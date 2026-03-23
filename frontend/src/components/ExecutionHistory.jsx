import React, { useEffect, useState } from 'react'
import axios from '../config/axios'

const LANG_ICON = { javascript: '⚡', python: '🐍' }

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
}

const ExecutionHistory = ({ onLoad }) => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        axios.get('/execute/history')
            .then(res => setHistory(res.data.executions || []))
            .catch(() => setError('Failed to load history.'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            <i className="ri-loader-4-line animate-spin mr-2"></i> Loading history...
        </div>
    )

    if (error) return (
        <div className="p-4 text-red-400 text-sm">{error}</div>
    )

    if (history.length === 0) return (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-2">
            <i className="ri-history-line text-2xl"></i>
            <p>No executions yet</p>
        </div>
    )

    return (
        <div className="flex flex-col gap-1 overflow-y-auto max-h-full">
            {history.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onLoad(item)}
                    className="text-left p-3 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 group"
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-slate-300">
                            {LANG_ICON[item.language]} {item.language}
                        </span>
                        <span className="text-xs text-slate-500">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate">
                        {item.code.split('\n')[0]}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                        {item.output && (
                            <span className="text-xs text-green-400 truncate max-w-[180px]">
                                ✅ {item.output.slice(0, 40)}
                            </span>
                        )}
                        {item.error && (
                            <span className="text-xs text-red-400 truncate max-w-[180px]">
                                ❌ {item.error.slice(0, 40)}
                            </span>
                        )}
                        <span className="ml-auto text-xs text-slate-600">{item.executionTime}ms</span>
                    </div>
                </button>
            ))}
        </div>
    )
}

export default ExecutionHistory
