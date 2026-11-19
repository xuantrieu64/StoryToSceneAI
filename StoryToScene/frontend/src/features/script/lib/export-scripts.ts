import { sceneHeading, scriptHeading, type Script } from './script-storage'

/** Nội dung văn bản thuần của các kịch bản (xuất file .txt). */
export function scriptsToText(projectName: string, scripts: Script[]) {
  const blocks = scripts.map((script) => {
    // Đã biên tập: `content` được tính từ dòng (đã gồm các cảnh) → xuất nguyên văn
    if (script.blocks?.length) return [scriptHeading(script), script.content.trim()].join('\n')
    const scenes = script.scenes.map((scene, index) => {
      const summary = scene.summary.trim()
      return summary ? `  ${sceneHeading(scene, index)}\n  ${summary}` : `  ${sceneHeading(scene, index)}`
    })
    const content = script.content.trim()
    const body = [...scenes, ...(content ? [content] : [])]
    return [scriptHeading(script), ...(body.length ? body : ['  (Chưa có nội dung)'])].join('\n')
  })
  const title = `${projectName} – Kịch bản`
  return `${title}\n${'='.repeat(title.length)}\n\n${blocks.join('\n\n')}\n`
}

/** Tên file an toàn: bỏ dấu, chỉ giữ chữ/số/gạch nối. */
function slugify(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'du-an'
  )
}

/** Tải file .txt về máy (chạy hoàn toàn trên trình duyệt). */
export function downloadScripts(projectName: string, scripts: Script[]) {
  const blob = new Blob([scriptsToText(projectName, scripts)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kich-ban-${slugify(projectName)}.txt`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
