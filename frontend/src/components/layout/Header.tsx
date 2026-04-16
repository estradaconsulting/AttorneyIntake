export default function Header() {
  return (
    <header>
      {/* Top bar — white nav like the site */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Scale of justice icon (text-based fallback) */}
            <span className="text-2xl" aria-hidden="true">⚖️</span>
            <div>
              <div className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide leading-tight">
                Sacramento Eviction Attorney
              </div>
              <div className="text-xs text-gray-500">Law Office of Thomas M. Hogan</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="hidden sm:inline font-semibold">(916) 929-2255</span>
            <a href="mailto:Hogan4eviction@outlook.com"
               className="hidden sm:inline text-[#8b1414] hover:underline">
              Hogan4eviction@outlook.com
            </a>
            {/* Staff-only portal link — not prominently advertised to clients */}
            <a href="/admin" className="text-gray-300 hover:text-gray-500 transition-colors text-xs">
              Staff
            </a>
          </div>
        </div>
      </div>

      {/* Hero banner — dark navy with crimson accent, matching the site */}
      <div className="bg-[#1e2840] px-4 py-5">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Client Intake Form
          </h1>
          <p className="mt-1 text-sm text-[#b8c4b0]">
            Complete all sections below to begin your eviction case. All required fields are marked with a red asterisk.
          </p>
        </div>
      </div>
    </header>
  )
}
