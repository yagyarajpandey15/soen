import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS = {
  idle:    { label: '○ Terminal',    color: 'text-muted',   border: 'border-border'         },
  running: { label: '● Running...',  color: 'text-warning', border: 'border-warning/40'     },
  success: { label: '✓ Success',     color: 'text-success', border: 'border-success/40'     },
  error:   { label: '✕ Error',       color: 'text-danger',  border: 'border-danger/40'      },
  timeout: { label: '⏱ Timeout',    color: 'text-warning', border: 'border-warning/40'     },
}

const Terminal = ({ output, status = 'idle', execTime }) => {
  const bottomRef = useRef(null)
  const s = STATUS[status] || STATUS.idle

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  const copy = () => { if (output) navigator.clipboard.writeText(output) }

  return (
    <div className={`flex flex-col rounded-xl border ${s.border} bg-[#0A0F1E] overflow-hidden transition-colors duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-danger/70"></span>
            <span className="w-3 h-3 rounded-full bg-warning/70"></span>
            <span className="w-3 h-3 rounded-full bg-success/70"></span>
          </div>
          <span className={`text-xs font-medium ml-2 ${s.color}`}>{s.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {execTime != null && (
            <span className="text-xs text-muted">{execTime}ms</span>
          )}
          {output && (
            <button onClick={copy} className="text-xs text-muted hover:text-text transition-colors flex items-center gap-1">
              <i className="ri-file-copy-line"></i> Copy
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-4 min-h-[120px] max-h-64 font-mono text-xs leading-relaxed">
        <AnimatePresence mode="wait">
          {output ? (
            <motion.pre
              key="output"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`whitespace-pre-wrap ${
                status === 'success' ? 'text-green-300' :
                status === 'error'   ? 'text-red-300'   :
                status === 'timeout' ? 'text-yellow-300' :
                'text-slate-300'
              }`}
            >
              {output}
            </motion.pre>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted italic"
            >
              {status === 'running' ? 'Executing...' : 'Run your code to see output here.'}
            </motion.p>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default Terminal
