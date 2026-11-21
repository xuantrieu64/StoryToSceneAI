import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { tierById, type GenerationTierId } from '@/features/characters/data/generation-tiers'
import { generationDeadline, loadCharacters } from '@/features/characters/lib/character-storage'
import { consumeGeneration, loadSelectedTier, remainingToday, saveSelectedTier } from '@/features/characters/lib/generation-usage'
import { useNow } from '@/features/characters/lib/use-now'
import { scriptHeading, loadScripts, type Script } from '@/features/script/lib/script-storage'
import { ConfirmDeleteDialog } from '@/features/story/components/ConfirmDeleteDialog'
import { buildStoryboard, hasScriptContent } from '../lib/build-storyboard'
import { parseDirectorCommand } from '../lib/director-commands'
import { pushMessage, resetConversation, updateSession, useDirectorSession } from '../lib/director-session'
import { frameStats, frameStatus, framesDeadline, hasFrameImage, pendingShots, queueFrames, shotsMissingFrames } from '../lib/frames'
import { allShots, formatDuration, loadStoryboards, saveStoryboard, totalDuration, updateShot, type ExportSettings, type ShotPatch, type VideoSettings } from '../lib/storyboard-storage'
import {
  clipStats,
  clipStatus,
  clipsDeadline,
  consumeVideoCredits,
  defaultExportSettings,
  defaultVideoSettings,
  exportDeadline,
  exportStatus,
  queueClips,
  shotsMissingClips,
  startExport,
  VIDEO_DAILY_LIMIT,
  videoModelById,
} from '../lib/clips'
import { consumeVoiceChars, linesToRead, queueVoices, remainingVoiceChars, VOICE_DAILY_CHAR_LIMIT, voiceDeadline, voiceLines, voiceStats, voiceStatus, type VoiceLine } from '../lib/voice'
import { loadVoiceSettings } from '../lib/voice-settings'
import { consumeStoryboardRun, remainingStoryboardRuns, STORYBOARD_DAILY_LIMIT } from '../lib/storyboard-usage'
import { useChatSplit } from '../lib/use-chat-split'
import { cn } from '@/lib/utils'
import { DirectorChat } from './DirectorChat'
import { StoryboardPanel, type EpisodeStatus } from './StoryboardPanel'
import { StoryboardToolRail } from './StoryboardToolRail'

const HELP =
  'Mình có thể:\n• Lập bảng phân cảnh: “Lập bảng phân cảnh cho tập này”\n• Đổi cỡ cảnh: “cú máy 3 đổi sang cận cảnh” (viễn / toàn / trung / cận cảnh, đặc tả)\n• Đổi chuyển động máy: “cú máy 3 lia máy” (đứng yên, lia, đẩy chậm vào, kéo ra, cầm tay)\n• Tạo khung hình: “tạo ảnh cả tập” hoặc “tạo lại ảnh cú máy 3”\n• Lồng tiếng: “lồng tiếng cả tập”\n• Video: “tạo video cả tập” hoặc “tạo lại video cú máy 2”\n• Bấm vào thẻ cú máy để sửa chi tiết hoặc tải ảnh lên'

/** Thanh công cụ dọc (60px + viền) và thanh kéo (1px) – phần chiều rộng không thuộc 2 cột. */
const RESERVED_WIDTH = 62

/** Thời gian giả lập (chưa có AI/backend). */
const REPLY_MS = 700
const GENERATE_MS = 2400
const HIGHLIGHT_MS = 2500

type StoryboardWorkspaceProps = {
  projectId: string
  /** storyboard = mục 5 Phân cảnh · frames = mục 6 Khung hình. Cùng một màn hình, khác tab kết quả. */
  mode: 'storyboard' | 'frames' | 'voice' | 'video'
  /** Báo ProjectLayout đọc lại dữ liệu (Sidebar cập nhật trạng thái mục 5, 6). */
  onStoryboardsChange: () => void
}

/**
 * Màn hình chung của mục 5 Phân cảnh và mục 6 Khung hình:
 * thanh công cụ dọc · chat Trợ lý đạo diễn · kết quả của tập đang chọn.
 * - Bảng phân cảnh lưu theo dự án + tập (localStorage); khung hình nằm trong từng cú máy của bảng đó.
 * - Hội thoại, tập đang chọn, tập đang lập nằm trong phiên của dự án (director-session) → chuyển giữa
 *   mục 5 và 6 không mất gì. Tiến trình tạo ảnh suy ra từ thời gian nên tải lại trang vẫn giữ.
 * - Không có dữ liệu mẫu – chỉ có bảng sau khi người dùng bấm lập hoặc nhắn trợ lý.
 */
export function StoryboardWorkspace({ projectId, mode, onStoryboardsChange }: StoryboardWorkspaceProps) {
  const navigate = useNavigate()
  const session = useDirectorSession(projectId)
  const [replying, setReplying] = useState(false)
  const [highlight, setHighlight] = useState<{ scriptId: string; shot: number } | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState<string | null>(null)
  const [tier, setTier] = useState<GenerationTierId>(loadSelectedTier)
  const { containerRef: splitRef, width: chatWidth, resizing: chatResizing, handleProps: splitHandleProps } = useChatSplit(RESERVED_WIDTH)
  /** Tăng sau mỗi lần lưu để đọc lại bảng phân cảnh từ bộ nhớ. */
  const [, setVersion] = useState(0)

  // Đọc trực tiếp từ bộ nhớ mỗi lần render (đúng dự án trên URL)
  const scripts = loadScripts(projectId)
  const storyboards = loadStoryboards(projectId)
  const episode = scripts.find((script) => script.id === session.episodeId) ?? scripts[0]
  const storyboard = episode ? storyboards[episode.id] : undefined
  const generating = session.generating
  const statusOf = (scriptId: string): EpisodeStatus => (generating[scriptId] ? 'generating' : storyboards[scriptId] ? 'ready' : 'none')
  const status: EpisodeStatus = episode ? statusOf(episode.id) : 'none'
  const remainingRuns = remainingStoryboardRuns()
  // Đồng hồ chỉ chạy khi có ảnh đang tạo → thẻ chuyển Chờ tạo → Đang tạo → Có ảnh
  const now = useNow(
    Math.max(framesDeadline(storyboard), voiceDeadline(storyboard), clipsDeadline(storyboard), exportDeadline(storyboard), generationDeadline(loadCharacters(projectId))),
  )
  const framesBusy = storyboard ? pendingShots(storyboard, now).length > 0 : false

  // Hẹn giờ KHÔNG hủy khi rời màn hình: kết quả ghi vào bộ nhớ + phiên, màn hình dựng lại vẫn thấy.
  const later = (fn: () => void, ms: number) => window.setTimeout(fn, ms)
  const say = (text: string, tone?: 'error') => pushMessage(projectId, 'assistant', text, tone)
  const selectEpisode = (scriptId: string) => updateSession(projectId, () => ({ episodeId: scriptId }))

  function persistChange() {
    setVersion((value) => value + 1)
    onStoryboardsChange()
  }

  /* ------------------------------ Lập bảng phân cảnh ------------------------------ */

  function runGeneration(script: Script) {
    if (!consumeStoryboardRun()) {
      say(`Hôm nay bạn đã dùng hết ${STORYBOARD_DAILY_LIMIT} lượt AI lập phân cảnh. Hãy quay lại vào ngày mai hoặc nâng gói.`, 'error')
      toast.error('Đã hết lượt AI hôm nay')
      return
    }
    updateSession(projectId, (current) => ({ generating: { ...current.generating, [script.id]: true } }))
    later(() => {
      const board = buildStoryboard(script)
      const saved = saveStoryboard(projectId, board)
      updateSession(projectId, (current) => {
        const { [script.id]: _done, ...rest } = current.generating
        return { generating: rest }
      })
      if (!saved) {
        say(`Không lưu được bảng phân cảnh ${scriptHeading(script)}. Bộ nhớ trình duyệt có thể đã đầy.`, 'error')
        toast.error('Không lưu được bảng phân cảnh')
        return
      }
      persistChange()
      say(
        `Xong bảng phân cảnh ${scriptHeading(script)}: ${board.scenes.length} cảnh, ${allShots(board).length} cú máy, khoảng ${formatDuration(totalDuration(board))}. Muốn sửa cú máy nào thì nhắn số cú máy; muốn có hình thì sang Khung hình hoặc nhắn “tạo ảnh cả tập”.`,
      )
      toast.success(`Đã lập bảng phân cảnh ${scriptHeading(script)}`)
    }, GENERATE_MS)
  }

  function requestGeneration(script: Script | undefined) {
    if (!script) {
      say('Dự án chưa có tập kịch bản nào. Hãy tạo tập ở màn hình Kịch bản trước nhé.', 'error')
      return
    }
    if (generating[script.id]) {
      toast.info(`${scriptHeading(script)} đang được lập phân cảnh`)
      return
    }
    if (!hasScriptContent(script)) {
      say(`${scriptHeading(script)} chưa có nội dung kịch bản nên mình chưa chia cảnh được.`, 'error')
      return
    }
    const existing = loadStoryboards(projectId)[script.id]
    if (existing) {
      if (pendingShots(existing).length > 0) {
        toast.info('Đang tạo khung hình cho tập này', { description: 'Chờ tạo ảnh xong rồi hãy lập lại bảng phân cảnh.' })
        return
      }
      setConfirmRegenerate(script.id)
      return
    }
    runGeneration(script)
  }

  /* ---------------------------------- Sửa cú máy ---------------------------------- */

  function editShot(script: Script, shotNumber: number, patch: ShotPatch) {
    const board = loadStoryboards(projectId)[script.id]
    if (!board) {
      say(`${scriptHeading(script)} chưa có bảng phân cảnh. Bấm “Lập bảng phân cảnh” trước rồi mình sửa từng cú máy được.`)
      return
    }
    const updated = updateShot(board, shotNumber, patch)
    if (!updated) {
      say(`Không có cú máy ${shotNumber}. ${scriptHeading(script)} có ${allShots(board).length} cú máy.`, 'error')
      return
    }
    if (!saveStoryboard(projectId, updated)) {
      say('Không lưu được thay đổi. Bộ nhớ trình duyệt có thể đã đầy.', 'error')
      return
    }
    persistChange()
    setHighlight({ scriptId: script.id, shot: shotNumber })
    later(() => setHighlight((current) => (current?.shot === shotNumber ? null : current)), HIGHLIGHT_MS)
    later(() => document.getElementById(`shot-${shotNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    const changes = [patch.size && `cỡ cảnh ${patch.size.toLocaleLowerCase('vi')}`, patch.movement && patch.movement.toLocaleLowerCase('vi')].filter(Boolean)
    say(`Đã đổi cú máy ${shotNumber} sang ${changes.join(', ')}.`)
  }

  /** Lưu thay đổi từ hộp sửa cú máy / sửa trên dòng. */
  function saveShotFromEditor(shotNumber: number, patch: ShotPatch) {
    if (!episode) return false
    const board = loadStoryboards(projectId)[episode.id]
    const updated = board ? updateShot(board, shotNumber, patch) : null
    if (!updated) {
      toast.error(`Không tìm thấy cú máy ${shotNumber}`)
      return false
    }
    if (!saveStoryboard(projectId, updated)) {
      toast.error('Không lưu được cú máy', { description: 'Bộ nhớ trình duyệt có thể đã đầy – thử ảnh nhỏ hơn hoặc bỏ bớt ảnh.' })
      return false
    }
    persistChange()
    toast.success(`Đã lưu cú máy ${shotNumber}`)
    return true
  }

  /* --------------------------------- Khung hình (mục 6) --------------------------------- */

  function generateFrames(script: Script | undefined, shotNumbers: number[]) {
    if (!script) return
    const board = loadStoryboards(projectId)[script.id]
    if (!board) {
      say(`${scriptHeading(script)} chưa có bảng phân cảnh nên chưa có cú máy để tạo ảnh. Lập bảng phân cảnh trước nhé.`)
      return
    }
    const startAt = Date.now()
    const shots = allShots(board)
    const unknown = shotNumbers.filter((number) => !shots.some((shot) => shot.number === number))
    if (unknown.length > 0) {
      say(`Không có cú máy ${unknown.join(', ')}. ${scriptHeading(script)} có ${shots.length} cú máy.`, 'error')
      return
    }
    const targets = shotNumbers.filter((number) => {
      const status = frameStatus(shots.find((shot) => shot.number === number)!, startAt)
      return status !== 'queued' && status !== 'generating'
    })
    if (targets.length === 0) {
      toast.info('Các cú máy này đang được tạo ảnh')
      return
    }

    const label = tierById(tier).label
    // Ảnh lỗi đã trừ lượt ở lần trước → thử lại không tính lượt
    const retries = targets.filter((number) => frameStatus(shots.find((shot) => shot.number === number)!, startAt) === 'failed')
    const fresh = targets.filter((number) => !retries.includes(number))
    let granted = 0
    while (granted < fresh.length && remainingToday(tier) > 0 && consumeGeneration(tier)) granted += 1
    if (granted === 0 && retries.length === 0) {
      say(`Hôm nay đã hết lượt tạo ảnh ${label.toLocaleLowerCase('vi')}. Thử chọn chất lượng khác hoặc quay lại vào ngày mai.`, 'error')
      toast.error(`Hết lượt tạo ảnh ${label.toLocaleLowerCase('vi')} hôm nay`)
      return
    }
    const allowed = new Set([...retries, ...fresh.slice(0, granted)])
    const batch = targets.filter((number) => allowed.has(number))
    const queued = queueFrames(board, batch, tier, startAt)
    if (!saveStoryboard(projectId, queued)) {
      toast.error('Không lưu được yêu cầu tạo ảnh', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return
    }
    persistChange()
    const seconds = Math.ceil((framesDeadline(queued) - startAt) / 1000)
    const shortage = granted < fresh.length ? ` Chỉ còn đủ lượt cho ${batch.length}/${targets.length} cú máy.` : ''
    const free = retries.length > 0 ? ` ${retries.length} ảnh lỗi được thử lại không tính lượt.` : ''
    say(
      batch.length === 1
        ? `Mình đang tạo ảnh ${label.toLocaleLowerCase('vi')} cho cú máy ${batch[0]}, khoảng ${seconds} giây.${shortage}${free}`
        : `Mình đang tạo ${batch.length} ảnh ${label.toLocaleLowerCase('vi')} cho ${scriptHeading(script)}, khoảng ${seconds} giây.${shortage}${free}`,
    )

    // Báo xong khi ảnh cuối cùng của bảng tạo xong (bỏ qua nếu có lượt tạo mới nối tiếp hoặc bảng đã bị lập lại)
    const batchIds = new Set(allShots(queued).filter((shot) => batch.includes(shot.number)).map((shot) => shot.id))
    later(() => {
      const latest = loadStoryboards(projectId)[script.id]
      if (!latest || !allShots(latest).some((shot) => batchIds.has(shot.id)) || pendingShots(latest).length > 0) return
      const stats = frameStats(latest)
      persistChange()
      if (stats.failed > 0) {
        say(
          `Xong lượt tạo ảnh ${scriptHeading(script)}: ${stats.ready}/${stats.total} cú máy đã có ảnh, ${stats.failed} ảnh bị lỗi. Bấm “Thử lại” trên thẻ lỗi (không tính lượt) hoặc nhắn “tạo ảnh cả tập”.`,
          'error',
        )
        toast.warning(`${stats.failed} ảnh tạo thất bại`, { description: 'Thử lại không tính lượt.' })
      } else {
        say(`Xong khung hình ${scriptHeading(script)}: ${stats.ready}/${stats.total} cú máy đã có ảnh. Muốn tạo lại cú máy nào thì nhắn “tạo lại ảnh cú máy 3”, hoặc bấm nút tạo lại trên thẻ.`)
        toast.success('Đã tạo xong khung hình')
      }
    }, framesDeadline(queued) - startAt + 150)
  }

  /** Chọn nhân vật trong khung của một cú máy (từ chi tiết nhân vật ở Khung hình). */
  function saveShotCharacters(shotNumber: number, names: string[]) {
    if (!episode) return false
    const board = loadStoryboards(projectId)[episode.id]
    const updated = board ? updateShot(board, shotNumber, { characters: names }) : null
    if (!updated || !saveStoryboard(projectId, updated)) return false
    persistChange()
    return true
  }

  /* --------------------------------- Lồng tiếng (mục 7) --------------------------------- */

  function readVoices(script: Script | undefined, lines: VoiceLine[]) {
    if (!script) return
    const board = loadStoryboards(projectId)[script.id]
    if (!board) {
      say(`${scriptHeading(script)} chưa có bảng phân cảnh nên chưa có câu thoại để lồng tiếng. Lập bảng phân cảnh trước nhé.`)
      return
    }
    const startAt = Date.now()
    const settings = loadVoiceSettings(projectId)
    // Đọc theo dữ liệu mới nhất; bỏ các câu đang đọc / đã đổi
    const current = new Map(voiceLines(board).map((line) => [line.id, line]))
    const targets = lines.map((line) => current.get(line.id)).filter((line): line is VoiceLine => {
      if (!line) return false
      const status = voiceStatus(line, settings, startAt)
      return status !== 'queued' && status !== 'generating'
    })
    if (targets.length === 0) {
      toast.info('Các câu này đang được đọc')
      return
    }
    // Trừ ký tự theo thứ tự câu, dừng khi hết hạn mức hôm nay
    const batch: VoiceLine[] = []
    let remaining = remainingVoiceChars()
    for (const line of targets) {
      if (line.chars > remaining) break
      batch.push(line)
      remaining -= line.chars
    }
    const chars = batch.reduce((sum, line) => sum + line.chars, 0)
    if (batch.length === 0 || !consumeVoiceChars(chars)) {
      say(`Hôm nay không còn đủ ký tự lồng tiếng (còn ${remainingVoiceChars().toLocaleString('vi-VN')}/${VOICE_DAILY_CHAR_LIMIT.toLocaleString('vi-VN')}). Quay lại vào ngày mai hoặc nâng gói.`, 'error')
      toast.error('Hết ký tự lồng tiếng hôm nay')
      return
    }
    const queued = queueVoices(board, batch, settings, startAt)
    if (!saveStoryboard(projectId, queued)) {
      toast.error('Không lưu được yêu cầu lồng tiếng', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return
    }
    persistChange()
    const seconds = Math.ceil((voiceDeadline(queued) - startAt) / 1000)
    const shortage = batch.length < targets.length ? ` Chỉ đủ ký tự cho ${batch.length}/${targets.length} câu.` : ''
    say(
      batch.length === 1
        ? `Mình đang đọc câu của ${batch[0].speaker} ở cú máy ${batch[0].shot.number} (${chars} ký tự), khoảng ${seconds} giây.${shortage}`
        : `Mình đang lồng tiếng ${batch.length} câu cho ${scriptHeading(script)} (${chars.toLocaleString('vi-VN')} ký tự), khoảng ${seconds} giây.${shortage}`,
    )

    // Báo xong khi câu cuối của bảng đọc xong (bỏ qua nếu có lượt mới nối tiếp hoặc bảng đã bị lập lại)
    const batchShotIds = new Set(batch.map((line) => line.shot.id))
    later(() => {
      const latest = loadStoryboards(projectId)[script.id]
      if (!latest || !allShots(latest).some((shot) => batchShotIds.has(shot.id))) return
      const stats = voiceStats(latest, loadVoiceSettings(projectId))
      if (stats.pending > 0) return
      persistChange()
      say(`Xong lồng tiếng ${scriptHeading(script)}: ${stats.ready}/${stats.total} câu đã có giọng. Muốn đổi giọng thì chỉnh ở “Giọng nhân vật”, các câu của nhân vật đó sẽ được đánh dấu cần đọc lại.`)
      toast.success('Đã lồng tiếng xong')
    }, voiceDeadline(queued) - startAt + 150)
  }

  /** Sửa lời đọc → ghi vào cú máy (thoại / lời dẫn) của bảng phân cảnh; giọng cũ tự thành "cần đọc lại". */
  function saveLineText(line: VoiceLine, text: string) {
    if (!episode) return false
    const board = loadStoryboards(projectId)[episode.id]
    const updated = board ? updateShot(board, line.shot.number, line.kind === 'dialogue' ? { dialogue: text } : { narration: text }) : null
    if (!updated || !saveStoryboard(projectId, updated)) {
      toast.error('Không lưu được lời đọc')
      return false
    }
    persistChange()
    toast.success(`Đã sửa lời ở cú máy ${line.shot.number}`, line.shot.voice?.[line.kind] ? { description: 'Giọng cũ cần đọc lại.' } : undefined)
    return true
  }

  /* ------------------------------------ Video (mục 8) ------------------------------------ */

  function generateClips(script: Script | undefined, shotNumbers: number[]) {
    if (!script) return
    const board = loadStoryboards(projectId)[script.id]
    if (!board) {
      say(`${scriptHeading(script)} chưa có bảng phân cảnh nên chưa có cú máy để dựng video. Lập bảng phân cảnh trước nhé.`)
      return
    }
    const startAt = Date.now()
    const shots = allShots(board)
    const unknown = shotNumbers.filter((number) => !shots.some((shot) => shot.number === number))
    if (unknown.length > 0) {
      say(`Không có cú máy ${unknown.join(', ')}. ${scriptHeading(script)} có ${shots.length} cú máy.`, 'error')
      return
    }
    const targets = shotNumbers.filter((number) => {
      const status = clipStatus(shots.find((shot) => shot.number === number)!, startAt)
      return status !== 'queued' && status !== 'generating'
    })
    if (targets.length === 0) {
      toast.info('Các cú máy này đang được tạo video')
      return
    }
    const resolution = defaultExportSettings(board).resolution
    const videoSettings = defaultVideoSettings(board)
    const model = videoModelById(videoSettings.model)
    // Clip lỗi đã trừ lượt ở lần trước → thử lại không tính lượt
    const retries = targets.filter((number) => clipStatus(shots.find((shot) => shot.number === number)!, startAt) === 'failed')
    const fresh = targets.filter((number) => !retries.includes(number))
    let granted = 0
    while (granted < fresh.length && consumeVideoCredits(model.credits)) granted += 1
    if (granted === 0 && retries.length === 0) {
      say(`Hôm nay đã hết lượt tạo video (${VIDEO_DAILY_LIMIT} lượt/ngày; model ${model.label} dùng ${model.credits} lượt mỗi clip). Thử model nhẹ hơn hoặc quay lại vào ngày mai.`, 'error')
      toast.error('Hết lượt tạo video hôm nay')
      return
    }
    const allowed = new Set([...retries, ...fresh.slice(0, granted)])
    const batch = targets.filter((number) => allowed.has(number))
    const queued = queueClips(board, batch, resolution, videoSettings, startAt)
    if (!saveStoryboard(projectId, queued)) {
      toast.error('Không lưu được yêu cầu tạo video', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return
    }
    persistChange()
    const seconds = Math.ceil((clipsDeadline(queued) - startAt) / 1000)
    const withoutFrame = batch.filter((number) => !hasFrameImage(shots.find((shot) => shot.number === number)!, startAt)).length
    const what = `clip ${videoSettings.clipLength} giây · ${model.label} · ${resolution}`
    say(
      (batch.length === 1 ? `Mình đang dựng ${what} cho cú máy ${batch[0]}, khoảng ${seconds} giây.` : `Mình đang dựng ${batch.length} ${what} cho ${scriptHeading(script)}, khoảng ${seconds} giây.`) +
        (granted < fresh.length ? ` Chỉ còn đủ lượt cho ${batch.length}/${targets.length} cú máy.` : '') +
        (retries.length > 0 ? ` ${retries.length} clip lỗi được thử lại không tính lượt.` : '') +
        (withoutFrame > 0 ? ` ${withoutFrame} cú máy chưa có khung hình nên dùng khung tạm.` : ''),
    )

    const batchIds = new Set(allShots(queued).filter((shot) => batch.includes(shot.number)).map((shot) => shot.id))
    later(() => {
      const latest = loadStoryboards(projectId)[script.id]
      if (!latest || !allShots(latest).some((shot) => batchIds.has(shot.id))) return
      const stats = clipStats(latest)
      if (stats.pending > 0) return
      persistChange()
      if (stats.failed > 0) {
        say(`Xong lượt dựng ${scriptHeading(script)}: ${stats.ready}/${stats.total} cú máy có clip, ${stats.failed} clip bị lỗi. Bấm “Thử lại” trên cú máy lỗi (không tính lượt).`, 'error')
        toast.warning(`${stats.failed} clip tạo thất bại`, { description: 'Thử lại không tính lượt.' })
      } else {
        say(`Xong video ${scriptHeading(script)}: ${stats.ready}/${stats.total} cú máy đã có clip. Bấm “Phát thử” ở Bản dựng nháp để xem cả tập.`)
        toast.success('Đã tạo xong clip')
      }
    }, clipsDeadline(queued) - startAt + 150)
  }

  /** Lưu model / độ dài clip của tập (clip đã tạo giữ nguyên; tạo lại để áp dụng). */
  function saveVideoSettings(settings: VideoSettings) {
    if (!episode) return
    const board = loadStoryboards(projectId)[episode.id]
    if (!board || !saveStoryboard(projectId, { ...board, videoSettings: settings })) {
      toast.error('Không lưu được thiết lập video')
      return
    }
    persistChange()
  }

  function startExportFor(script: Script | undefined, settings: ExportSettings) {
    if (!script) return
    const board = loadStoryboards(projectId)[script.id]
    if (!board) return
    if (exportStatus(board) === 'exporting') {
      toast.info('Phim đang được xuất')
      return
    }
    const startAt = Date.now()
    const next = startExport(board, settings, startAt)
    if (!saveStoryboard(projectId, next)) {
      toast.error('Không lưu được yêu cầu xuất phim')
      return
    }
    persistChange()
    const job = next.exportJob!
    say(`Mình đang xuất ${scriptHeading(script)} · ${settings.resolution} · ${settings.aspect} · chất lượng ${settings.quality.toLocaleLowerCase('vi')} (${job.clipsReady}/${job.clipsTotal} clip sẵn sàng).`)
    later(() => {
      const latest = loadStoryboards(projectId)[script.id]
      if (!latest?.exportJob || latest.exportJob.startedAt !== job.startedAt) return
      persistChange()
      say(`Đã xuất xong ${scriptHeading(script)} (mô phỏng). Mở “Xuất phim” để tải danh sách dựng (.edl).`)
      toast.success('Đã xuất phim xong')
    }, job.durationMs + 150)
  }

  /* ------------------------------------- Chat ------------------------------------- */

  function send(text: string) {
    pushMessage(projectId, 'user', text)
    // Lệnh áp dụng cho tập đang chọn lúc gửi
    const target = episode
    setReplying(true)
    later(() => {
      setReplying(false)
      const command = parseDirectorCommand(text)
      if (command.kind === 'generate') requestGeneration(target)
      else if (command.kind === 'frames') {
        const board = target ? loadStoryboards(projectId)[target.id] : undefined
        if (command.shotNumber !== undefined) generateFrames(target, [command.shotNumber])
        else if (!board) generateFrames(target, [])
        else {
          const missing = shotsMissingFrames(board)
          if (missing.length > 0) generateFrames(target, missing)
          else say('Mọi cú máy của tập này đã có hoặc đang tạo khung hình. Muốn đổi ảnh nào thì nhắn “tạo lại ảnh cú máy 3”.')
        }
      } else if (command.kind === 'clips') {
        const board = target ? loadStoryboards(projectId)[target.id] : undefined
        if (command.shotNumber !== undefined) generateClips(target, [command.shotNumber])
        else if (!board) generateClips(target, [])
        else {
          const missing = shotsMissingClips(board)
          if (missing.length > 0) generateClips(target, missing)
          else say('Mọi cú máy của tập này đã có hoặc đang tạo clip. Muốn làm lại cú nào thì nhắn “tạo lại video cú máy 3”.')
        }
      } else if (command.kind === 'export') {
        say('Bấm “Xuất phim” ở góc trên khu vực Video để chọn tỉ lệ, độ phân giải và chất lượng rồi xác nhận nhé.')
        if (target && loadStoryboards(projectId)[target.id] && mode !== 'video') navigate(projectPaths.video(projectId))
      } else if (command.kind === 'voice') {
        const board = target ? loadStoryboards(projectId)[target.id] : undefined
        if (!board) readVoices(target, [])
        else {
          const pending = linesToRead(board, loadVoiceSettings(projectId))
          if (pending.length > 0) readVoices(target, pending)
          else say(voiceLines(board).length === 0 ? 'Tập này chưa có lời thoại hay lời dẫn để lồng tiếng.' : 'Mọi câu của tập này đã có hoặc đang đọc giọng.')
        }
      } else if (command.kind === 'editShot') {
        if (target) editShot(target, command.shotNumber, { ...(command.size ? { size: command.size } : {}), ...(command.movement ? { movement: command.movement } : {}) })
        else say('Dự án chưa có tập kịch bản nào để sửa phân cảnh.', 'error')
      } else if (command.kind === 'editShotMissingChange') say(`Bạn muốn đổi cú máy ${command.shotNumber} thế nào?\n${HELP}`)
      else say(HELP)
    }, REPLY_MS)
  }

  const processingLabel = replying
    ? 'Trợ lý đang soạn trả lời…'
    : episode && generating[episode.id]
      ? `Đang lắng nghe chỉ dẫn từ kịch bản ${scriptHeading(episode)}…`
      : framesBusy
        ? 'Đang tạo ảnh ở thẻ Khung hình. Chờ xong rồi nhắn trợ lý nhé…'
        : null

  const canGenerate = !!episode && status !== 'generating' && hasScriptContent(episode) && remainingRuns > 0
  const regenerateScript = scripts.find((script) => script.id === confirmRegenerate)

  return (
    <div
      className="flex h-[calc(100vh-152px)] min-h-[560px] overflow-hidden rounded-xl border border-[#eceef1] bg-white max-[900px]:h-auto max-[900px]:flex-col"
      ref={splitRef}
      style={{ '--chat-width': `${chatWidth}px` } as CSSProperties}
    >
      <StoryboardToolRail
        activeId={episode?.id ?? null}
        canGenerate={canGenerate}
        onGenerate={() => requestGeneration(episode)}
        onNewChat={() => {
          resetConversation(projectId)
          toast.success('Đã bắt đầu hội thoại mới')
        }}
        onSelect={selectEpisode}
        scripts={scripts}
        statusOf={statusOf}
      />

      {/* Cột chat: rộng theo thanh kéo (280–600px); màn hẹp xếp dọc, chiếm hết hàng */}
      <div className="flex w-(--chat-width) min-w-0 shrink-0 max-[900px]:h-[560px] max-[900px]:w-full max-[900px]:border-b max-[900px]:border-[#eceef1] [&>section]:flex-1">
        <DirectorChat messages={session.messages} onSend={send} processingLabel={processingLabel} />
      </div>

      {/* Thanh kéo đổi chiều rộng chat ↔ kết quả. Vùng bắt chuột rộng 12px, vạch hiển thị 1px; ẩn khi xếp dọc. */}
      <div
        aria-label="Kéo để đổi chiều rộng khung Trợ lý đạo diễn"
        aria-orientation="vertical"
        className="group relative z-10 w-px shrink-0 cursor-col-resize touch-none bg-[#eceef1] outline-none max-[900px]:hidden"
        role="separator"
        tabIndex={0}
        title="Kéo để đổi chiều rộng · Nhấp đúp để về mặc định"
        {...splitHandleProps}
      >
        <span aria-hidden="true" className="absolute inset-y-0 -left-1.5 -right-1.5" />
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors duration-150',
            chatResizing ? 'bg-[#39b536]' : 'bg-transparent group-hover:bg-[#39b536]/50 group-focus-visible:bg-[#39b536]',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-1/2 top-1/2 h-9 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d1d5db] bg-white shadow-sm transition-opacity duration-150',
            chatResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
        />
      </div>

      <div className="flex min-w-0 flex-1 max-[900px]:min-h-[520px] [&>section]:flex-1">
        <StoryboardPanel
          episode={episode}
          frames={{
            now,
            tier,
            onTierChange: (next) => {
              setTier(next)
              saveSelectedTier(next)
            },
            onGenerateFrames: (shotNumbers) => generateFrames(episode, shotNumbers),
            onCharactersChanged: persistChange,
            onShotCharactersChange: saveShotCharacters,
          }}
          routeTab={mode === 'storyboard' ? null : mode}
          hasContent={episode ? hasScriptContent(episode) : false}
          highlightedShot={highlight && highlight.scriptId === episode?.id ? highlight.shot : null}
          onEpisodeChange={selectEpisode}
          onGenerate={() => requestGeneration(episode)}
          onLeaveRouteTab={() => navigate(projectPaths.storyboard(projectId))}
          onOpenRouteTab={(tab) => navigate(projectPaths[tab](projectId))}
          onSaveShot={saveShotFromEditor}
          projectId={projectId}
          remainingRuns={remainingRuns}
          video={{
            onGenerateClips: (shotNumbers) => generateClips(episode, shotNumbers),
            onStartExport: (settings) => startExportFor(episode, settings),
            onVideoSettingsChange: saveVideoSettings,
          }}
          voice={{ onRead: (lines) => readVoices(episode, lines), onSaveLineText: saveLineText, onSettingsChanged: persistChange }}
          scripts={scripts}
          status={status}
          storyboard={storyboard}
        />
      </div>

      <ConfirmDeleteDialog
        confirmLabel="Lập lại"
        description="Bảng phân cảnh hiện tại của tập này (kể cả các cú máy bạn đã sửa và khung hình đã tạo) sẽ được thay bằng bảng mới. Dùng 1 lượt AI."
        onCancel={() => setConfirmRegenerate(null)}
        onConfirm={() => {
          setConfirmRegenerate(null)
          if (regenerateScript) runGeneration(regenerateScript)
        }}
        open={regenerateScript !== undefined}
        title={regenerateScript ? `Lập lại phân cảnh ${scriptHeading(regenerateScript)}?` : 'Lập lại phân cảnh?'}
      />
    </div>
  )
}
