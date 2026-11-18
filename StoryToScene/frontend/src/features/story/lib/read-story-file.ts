/**
 * Đọc nội dung tệp truyện ngay trên trình duyệt (không tải lên server).
 *  - .txt  : đọc UTF-8.
 *  - .docx : giải nén word/document.xml bằng DecompressionStream có sẵn của trình duyệt,
 *            lấy chữ theo từng đoạn (mỗi đoạn Word = một dòng).
 */

export const MAX_STORY_FILE_BYTES = 10 * 1024 * 1024
export const ACCEPTED_STORY_FILES = '.txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export class StoryFileError extends Error {}

export async function readStoryFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (file.size > MAX_STORY_FILE_BYTES) throw new StoryFileError('Tệp lớn hơn 10 MB. Vui lòng chia nhỏ hoặc dán từng phần nội dung.')
  if (name.endsWith('.txt')) return file.text()
  if (name.endsWith('.docx')) return readDocx(await file.arrayBuffer())
  throw new StoryFileError('Chỉ hỗ trợ tệp .txt hoặc .docx.')
}

/* ------------------------------- .docx (zip) ------------------------------- */

async function readDocx(buffer: ArrayBuffer): Promise<string> {
  const xml = await extractZipEntry(buffer, 'word/document.xml')
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) throw new StoryFileError('Không đọc được nội dung tệp .docx.')

  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const paragraphs = [...doc.getElementsByTagNameNS(W, 'p')].map((paragraph) => {
    let text = ''
    paragraph.querySelectorAll('*').forEach((node) => {
      if (node.namespaceURI !== W) return
      if (node.localName === 't') text += node.textContent ?? ''
      else if (node.localName === 'tab') text += '\t'
      else if (node.localName === 'br' || node.localName === 'cr') text += '\n'
    })
    return text
  })
  return paragraphs.join('\n')
}

async function extractZipEntry(buffer: ArrayBuffer, entryName: string): Promise<string> {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const invalid = () => new StoryFileError('Tệp .docx không hợp lệ hoặc đã bị hỏng.')

  // Tìm "End of central directory" (chữ ký 0x06054b50) từ cuối tệp
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw invalid()

  const entryCount = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder()

  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw invalid()
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))

    if (name === entryName) {
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw invalid()
      const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true)
      const data = bytes.subarray(start, start + compressedSize)
      if (method === 0) return decoder.decode(data)
      if (method !== 8) throw invalid()
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      return new Response(stream).text()
    }
    offset += 46 + nameLength + extraLength + commentLength
  }
  throw new StoryFileError('Không tìm thấy nội dung văn bản trong tệp .docx.')
}
