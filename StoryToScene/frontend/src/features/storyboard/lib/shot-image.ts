/*
 * Ảnh minh họa cú máy do người dùng tải lên: kiểm tra loại/kích thước rồi thu nhỏ
 * (cạnh dài tối đa 640px, JPEG) để lưu gọn trong localStorage.
 * TODO(api): tải ảnh lên kho lưu trữ và chỉ lưu URL khi backend sẵn sàng.
 */
const MAX_EDGE = 640
const MAX_FILE_BYTES = 10 * 1024 * 1024
export const SHOT_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

export class ShotImageError extends Error {}

export async function readShotImage(file: File): Promise<string> {
  if (!SHOT_IMAGE_ACCEPT.split(',').includes(file.type)) throw new ShotImageError('Chỉ nhận ảnh PNG, JPG hoặc WEBP.')
  if (file.size > MAX_FILE_BYTES) throw new ShotImageError('Ảnh lớn hơn 10 MB.')

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new ShotImageError('Không đọc được ảnh này.'))
      element.src = url
    })
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new ShotImageError('Trình duyệt không xử lý được ảnh.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.78)
  } finally {
    URL.revokeObjectURL(url)
  }
}
