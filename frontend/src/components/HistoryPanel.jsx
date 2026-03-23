import React, { useEffect, useState } from 'react'
import axios from '../config/axios'
import { motion, AnimatePresence } from 'framer-motion'

const LANG_ICON = { javascript: '⚡', python: '🐍' }

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(d).toLocaleDateString()
}

const HistoryPanel = ({ onLoad, compact = false }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/execute/history')
      .then(r => setItems(r.data.executions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-muted text-sm gap-2">
      <i className="ri-loader-4-line animate-spin"></i> Loading...
    </div>
  )

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-muted gap-2">
      <i className="ri-history-line text-3xl"></i>
      <p className="text-sm">No executions yet</p>
      <p className="text-xs">Run some code to see history here</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onLoad?.(item)}
            className="text-left p-3 rounded-xl bg-base hover:bg-white/5 border border-border hover:border-primary/40 transition-all duration-150 group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-text">
                {LANG_ICON[item.language]} {item.language}
              </span>
              <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
            </div>
            <p className="text-xs font-mono text-muted truncate mb-1.5">
              {item.code.split('\n')[0]}
            </p>
            <div className="flex items-center justify-between">
              {item.output && (
                <span className="text-xs text-success truncate max-w-[160px]">
                  ✓ {item.output.slice(0, 35)}
                </span>
              )}
              {item.error && (
                <span className="text-xs text-danger truncate max-w-[160px]">
                  ✕ {item.error.slice(0, 35)}
                </span>
              )}
              <span className="text-xs text-muted ml-auto">{item.executionTime}ms</span>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default HistoryPanel
