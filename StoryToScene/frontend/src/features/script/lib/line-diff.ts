/*
 * So sánh hai danh sách dòng (LCS theo dòng).
 * `remove` = chỉ có ở `from`, `add` = chỉ có ở `to`, `same` = giống nhau.
 */

export type DiffOp<T> = { kind: 'same' | 'add' | 'remove'; item: T }
export type DiffRow<T> = DiffOp<T> | { kind: 'skip'; count: number }

/** Quá giới hạn ô bảng LCS → so sánh thô (xóa hết phần giữa rồi thêm), tránh treo trình duyệt. */
const MAX_LCS_CELLS = 4_000_000

export function diffLines<T>(from: T[], to: T[], key: (item: T) => string): DiffOp<T>[] {
  const a = from.map(key)
  const b = to.map(key)
  // Bỏ phần đầu/cuối giống nhau trước cho nhanh
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const head: DiffOp<T>[] = from.slice(0, start).map((item) => ({ kind: 'same', item }))
  const tail: DiffOp<T>[] = from.slice(endA).map((item) => ({ kind: 'same', item }))
  const n = endA - start
  const m = endB - start
  const middle: DiffOp<T>[] = []

  if (n * m > MAX_LCS_CELLS) {
    from.slice(start, endA).forEach((item) => middle.push({ kind: 'remove', item }))
    to.slice(start, endB).forEach((item) => middle.push({ kind: 'add', item }))
    return [...head, ...middle, ...tail]
  }

  // lcs[i][j] = độ dài LCS của a[start+i..endA) và b[start+j..endB)
  const width = m + 1
  const lcs = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] = a[start + i] === b[start + j] ? lcs[(i + 1) * width + j + 1] + 1 : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1])
    }
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[start + i] === b[start + j]) {
      middle.push({ kind: 'same', item: from[start + i] })
      i++
      j++
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      middle.push({ kind: 'remove', item: from[start + i++] })
    } else {
      middle.push({ kind: 'add', item: to[start + j++] })
    }
  }
  while (i < n) middle.push({ kind: 'remove', item: from[start + i++] })
  while (j < m) middle.push({ kind: 'add', item: to[start + j++] })
  return [...head, ...middle, ...tail]
}

/** Thu gọn các đoạn giống nhau dài, chỉ giữ `context` dòng quanh chỗ thay đổi. */
export function collapseSame<T>(ops: DiffOp<T>[], context = 2): DiffRow<T>[] {
  const rows: DiffRow<T>[] = []
  let index = 0
  while (index < ops.length) {
    if (ops[index].kind !== 'same') {
      rows.push(ops[index++])
      continue
    }
    let end = index
    while (end < ops.length && ops[end].kind === 'same') end++
    const keepBefore = index === 0 ? 0 : context
    const keepAfter = end === ops.length ? 0 : context
    const run = end - index
    if (run > keepBefore + keepAfter + 1) {
      rows.push(...ops.slice(index, index + keepBefore))
      rows.push({ kind: 'skip', count: run - keepBefore - keepAfter })
      rows.push(...ops.slice(end - keepAfter, end))
    } else {
      rows.push(...ops.slice(index, end))
    }
    index = end
  }
  return rows
}
