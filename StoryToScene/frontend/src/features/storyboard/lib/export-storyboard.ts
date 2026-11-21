/*
 * Xuất bảng phân cảnh ra file Excel (.xlsx) ngay trên trình duyệt, không cần thư viện:
 * một sheet, mỗi dòng một cú máy. File .xlsx là gói ZIP gồm vài tệp XML; ở đây đóng gói
 * kiểu "store" (không nén) nên chỉ cần tính CRC-32.
 */
import { allShots, sceneTitle, type Storyboard } from './storyboard-storage'

const HEADER = ['Cảnh', 'STT', 'Mô tả hình', 'Thời lượng (giây)', 'Cỡ cảnh', 'Chuyển động máy', 'Người nói', 'Lời thoại', 'Âm thanh', 'Nhân vật', 'Lời dẫn', 'Chuyển cảnh']

function rows(storyboard: Storyboard): (string | number)[][] {
  return storyboard.scenes.flatMap((scene) =>
    scene.shots.map((shot) => [
      sceneTitle(scene),
      shot.number,
      shot.description,
      shot.duration,
      shot.size,
      shot.movement,
      shot.character ?? '',
      shot.dialogue ?? '',
      shot.sound,
      shot.characters.join(', '),
      shot.narration ?? '',
      shot.transition ?? '',
    ]),
  )
}

/** Bỏ ký tự điều khiển không hợp lệ trong XML (giữ tab, xuống dòng). */
const stripControl = (value: string) =>
  [...value].filter((char) => char.charCodeAt(0) >= 0x20 || char === '\t' || char === '\n' || char === '\r').join('')

const escapeXml = (value: string) =>
  stripControl(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function columnName(index: number) {
  let name = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name
  return name
}

function sheetXml(data: (string | number)[][]) {
  const widths = [32, 6, 60, 12, 12, 16, 14, 48, 32, 22, 40, 14]
  const cols = widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')
  const body = data
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          const ref = `${columnName(c)}${r + 1}`
          const style = r === 0 ? ' s="1"' : ''
          return typeof value === 'number'
            ? `<c r="${ref}"${style}><v>${value}</v></c>`
            : `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
        })
        .join('')
      return `<row r="${r + 1}">${cells}</row>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData></worksheet>`
}

function xlsxFiles(sheetName: string, data: (string | number)[][]): [string, string][] {
  return [
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    ],
    [
      'xl/styles.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0"/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>',
    ],
    ['xl/worksheets/sheet1.xml', sheetXml(data)],
  ]
}

/* ------------------------------- ZIP (store) ------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zip(files: [string, string][]): Blob {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(content)
    const crc = crc32(data)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // tên tệp UTF-8
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true)
    local.setUint32(22, data.length, true)
    local.setUint16(26, nameBytes.length, true)
    parts.push(new Uint8Array(local.buffer), nameBytes, data)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true)
    entry.setUint16(4, 20, true)
    entry.setUint16(6, 20, true)
    entry.setUint16(8, 0x0800, true)
    entry.setUint32(16, crc, true)
    entry.setUint32(20, data.length, true)
    entry.setUint32(24, data.length, true)
    entry.setUint16(28, nameBytes.length, true)
    entry.setUint32(42, offset, true)
    central.push(new Uint8Array(entry.buffer), nameBytes)

    offset += 30 + nameBytes.length + data.length
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Tên file an toàn: bỏ dấu, chỉ giữ chữ/số/gạch nối. */
const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'phan-canh'

/** Tải bảng phân cảnh của một tập về máy dạng .xlsx. */
export function downloadStoryboardExcel(storyboard: Storyboard, episodeLabel: string) {
  const data = [HEADER, ...rows(storyboard)]
  const blob = zip(xlsxFiles('Phân cảnh', data))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `phan-canh-${slugify(episodeLabel)}.xlsx`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Số dòng cú máy sẽ xuất (để báo cho người dùng). */
export const exportedShotCount = (storyboard: Storyboard) => allShots(storyboard).length
