import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV = [
  { label: 'Projects',    icon: 'ri-folder-3-line',     path: '/'          },
  { label: 'Code Runner', icon: 'ri-terminal-box-line',  path: '/runner'    },
  { label: 'History',     icon: 'ri-history-line',       path: '/history'   },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <i className="ri-code-s-slash-line text-white text-sm"></i>
        </div>
        <span className="text-text font-semibold text-lg tracking-tight">SOEN</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(item => {
          const active = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left
                ${active
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted hover:bg-white/5 hover:text-text'
                }`}
            >
              <i className={`${item.icon} text-base`}></i>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted">
          <i className="ri-shield-check-line text-success"></i>
          Sandbox secured
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar
