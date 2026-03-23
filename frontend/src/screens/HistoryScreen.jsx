import React, { useState } from 'react'
import AppLayout from '../components/AppLayout'
import HistoryPanel from '../components/HistoryPanel'
import CodeRunner from '../components/CodeRunner'
import { motion, AnimatePresence } from 'framer-motion'

const HistoryScreen = () => {
  const [selected, setSelected] = useState(null)

  return (
    <AppLayout title="Execution History">
      <div className="flex gap-6 h-full" style={{ height: 'calc(100vh - 3.5rem - 3rem)' }}>

        {/* History list */}
        <div className="w-80 bg-card rounded-xl border border-border flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text">Recent Executions</h3>
            <p className="text-xs text-muted mt-0.5">Last 10 runs</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <HistoryPanel onLoad={setSelected} />
          </div>
        </div>

        {/* Preview / runner */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <CodeRunner
                  initialCode={selected.code}
                  initialLanguage={selected.language}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-muted gap-3"
              >
                <i className="ri-cursor-line text-4xl"></i>
                <p className="text-sm">Select an execution to load it</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  )
}

export default HistoryScreen
