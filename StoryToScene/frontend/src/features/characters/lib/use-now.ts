import { useEffect, useState } from 'react'

/**
 * Thời điểm hiện tại cho việc tính trạng thái "đang tạo".
 * Chỉ chạy đồng hồ tới `deadline` (lúc phiên bản cuối cùng tạo xong), sau đó dừng – không render lại vô ích.
 */
export function useNow(deadline: number, intervalMs = 500) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= deadline) window.clearInterval(timer)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [deadline, intervalMs])
  return now
}
