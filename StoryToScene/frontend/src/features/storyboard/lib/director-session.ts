/*
 * Phiên làm việc với Trợ lý đạo diễn theo dự án (bộ nhớ trong trang, không lưu localStorage):
 * hội thoại, tập đang chọn, các tập đang lập phân cảnh.
 * Mục 5 (Phân cảnh) và mục 6 (Khung hình) dùng chung phiên này → chuyển qua lại không mất
 * hội thoại hay tiến trình, kể cả khi màn hình được dựng lại. Tải lại trang thì bắt đầu phiên mới.
 * TODO(api): lưu hội thoại ở backend.
 */
import { useSyncExternalStore } from 'react'

export type DirectorMessage = { id: number; role: 'assistant' | 'user'; text: string; tone?: 'error' }

export type DirectorSession = {
  messages: DirectorMessage[]
  nextId: number
  episodeId: string | null
  /** Tập đang được lập bảng phân cảnh. */
  generating: Record<string, true>
}

export const DIRECTOR_GREETING =
  'Chào bạn, mình là Trợ lý đạo diễn. Mình đọc kịch bản của tập đang chọn, chia cảnh rồi viết bảng phân cảnh từng cú máy, sau đó tạo khung hình cho từng cú máy. Có bảng rồi thì nhắn số cú máy bạn muốn sửa, ví dụ “cú máy 5 đổi sang toàn cảnh”.'

const sessions = new Map<string, DirectorSession>()
const listeners = new Map<string, Set<() => void>>()

const freshSession = (): DirectorSession => ({ messages: [{ id: 0, role: 'assistant', text: DIRECTOR_GREETING }], nextId: 1, episodeId: null, generating: {} })

function getSession(projectId: string) {
  let session = sessions.get(projectId)
  if (!session) {
    session = freshSession()
    sessions.set(projectId, session)
  }
  return session
}

export function updateSession(projectId: string, update: (session: DirectorSession) => Partial<DirectorSession>) {
  const current = getSession(projectId)
  sessions.set(projectId, { ...current, ...update(current) })
  listeners.get(projectId)?.forEach((listener) => listener())
}

export function pushMessage(projectId: string, role: DirectorMessage['role'], text: string, tone?: 'error') {
  updateSession(projectId, (session) => ({
    messages: [...session.messages, { id: session.nextId, role, text, ...(tone ? { tone } : {}) }],
    nextId: session.nextId + 1,
  }))
}

export function resetConversation(projectId: string) {
  updateSession(projectId, (session) => ({ messages: [{ id: session.nextId, role: 'assistant', text: DIRECTOR_GREETING }], nextId: session.nextId + 1 }))
}

export function useDirectorSession(projectId: string) {
  return useSyncExternalStore(
    (listener) => {
      const set = listeners.get(projectId) ?? new Set()
      set.add(listener)
      listeners.set(projectId, set)
      return () => set.delete(listener)
    },
    () => getSession(projectId),
  )
}
