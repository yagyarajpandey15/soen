import React from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { Toaster } from 'react-hot-toast'

const AppLayout = ({ children, title }) => {
  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-hidden p-6">
          {children}
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', fontSize: '13px' },
          success: { iconTheme: { primary: '#22C55E', secondary: '#1E293B' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#1E293B' } },
        }}
      />
    </div>
  )
}

export default AppLayout
