/** Nền trang Đăng nhập / Đăng ký: gradient mint mềm, sóng xanh góc dưới trái, dải phim góc dưới phải. */
export function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,#ffffff_0%,transparent_45%),radial-gradient(ellipse_at_55%_45%,#e3f8ee_0%,transparent_55%),radial-gradient(ellipse_at_100%_80%,#d9f5e8_0%,transparent_50%)] bg-[#f4fcf8]" />

      {/* Sóng xanh góc dưới */}
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[160px] w-full sm:h-[200px]">
        <path d="M0 120 C 240 60, 420 200, 720 150 C 980 108, 1180 40, 1440 90 V220 H0Z" fill="#d6f3e5" opacity="0.7" />
        <path d="M0 170 C 260 120, 520 220, 820 190 C 1080 165, 1260 120, 1440 150 V220 H0Z" fill="#c2edd9" opacity="0.6" />
      </svg>

      {/* Dải phim trang trí góc dưới phải */}
      <svg viewBox="0 0 240 420" className="absolute -right-6 bottom-[-40px] hidden h-[420px] w-[240px] rotate-[28deg] text-jade-200 opacity-70 lg:block">
        <rect x="20" y="0" width="200" height="420" rx="12" fill="none" stroke="currentColor" strokeWidth="6" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <rect x="32" y={14 + i * 46} width="18" height="24" rx="4" fill="currentColor" />
            <rect x="190" y={14 + i * 46} width="18" height="24" rx="4" fill="currentColor" />
          </g>
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={i} x="66" y={20 + i * 100} width="108" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="5" />
        ))}
      </svg>
    </div>
  )
}
