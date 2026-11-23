import { Link } from 'react-router-dom'
import { paths } from '@/routes/paths'

export default function StatusPage({ code }: { code: 404 | 403 }) {
  const isForbidden = code === 403

  return (
    <main className="grid min-h-svh place-items-center bg-slate-50 px-6 text-slate-900">
      <section className="max-w-md text-center">
        <p className="mb-2 text-sm font-semibold text-jade-700">{code}</p>
        <h1 className="text-2xl font-bold">
          {isForbidden ? 'Không có quyền truy cập' : 'Không tìm thấy trang'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isForbidden
            ? 'Bạn không có quyền truy cập nội dung này.'
            : 'Trang bạn tìm kiếm không tồn tại hoặc đã được chuyển đi.'}
        </p>
        <Link
          to={paths.home}
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-jade-700 px-4 text-sm font-semibold text-white"
        >
          Về trang chủ
        </Link>
      </section>
    </main>
  )
}
