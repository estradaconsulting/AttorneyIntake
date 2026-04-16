import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import IntakeWizard from './components/intake/IntakeWizard'
import AdminDashboard from './components/admin/AdminDashboard'
import CaseDetail from './components/admin/CaseDetail'

function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Sage green info bar */}
      <div className="bg-[#d4ddd0] border-b border-[#b8c4b0] px-4 py-3">
        <div className="mx-auto max-w-4xl text-xs text-gray-700 flex flex-wrap gap-x-6 gap-y-1">
          <span>📎 Please submit all documents in <strong>PDF format</strong> (JPEG not accepted)</span>
          <span>⚠️ Fees are required in advance of filing unless otherwise agreed</span>
          <span>📞 Questions? Call <strong>(916) 929-2255</strong></span>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <IntakeWizard />
      </main>

      <footer className="bg-[#1e2840] text-white py-6 px-4 text-center text-xs">
        <p className="font-serif text-sm mb-1">Law Office of Thomas M. Hogan</p>
        <p className="text-[#b8c4b0]">942 Enterprise Drive, Suite B · Sacramento, CA 95825</p>
        <p className="text-[#b8c4b0] mt-1">(916) 929-2255 · Hogan4eviction@outlook.com</p>
        <p className="text-[#8fa388] mt-2 text-xs">SM &amp; © 2023 Hogan4Eviction · All rights reserved</p>
      </footer>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/cases/:id" element={<CaseDetail />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<ClientLayout />} />
      <Route path="/intake" element={<ClientLayout />} />
    </Routes>
  )
}
