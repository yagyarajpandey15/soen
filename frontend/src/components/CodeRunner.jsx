import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import CodeEditor from './CodeEditor'
import Terminal from './Terminal'
import HistoryPanel from './HistoryPanel'

const TEMPLATES = {
  javascript: `// JavaScript Sandbox\nconsole.log("Hello, World!");\n\nconst add = (a, b) => a + b;\nconsole.log("2 + 3 =", add(2, 3));`,
  python:     `# Python Sandbox\nprint("Hello, World!")\n\ndef add(a, b):\n    return a + b\n\nprint("2 + 3 =", add(2, 3))`,
  html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Preview</title>\n  <style>\n    body { font-family: sans-serif; padding: 2rem; background: #f8fafc; }\n    h1 { color: #3b82f6; }\n  </style>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Edit this HTML and click Run to preview.</p>\n</body>\n</html>`
}

const LANG_META = {
  javascript: { label: '⚡ JavaScript', ext: 'js',   monacoLang: 'javascript' },
  python:     { label: '🐍 Python',     ext: 'py',  monacoLang: 'python'     },
  html:       { label: '🌐 HTML',       ext: 'html', monacoLang: 'html'       },
}

/** Client-side language detection — mirrors backend strict logic */
function detectLang(code) {
  const t = code.trim()
  const lower = t.toLowerCase()
  // HTML only when code literally starts with doctype or <html
  if (lower.startsWith('<!doctype html') || lower.startsWith('<html')) return 'html'
  // Python: comments, keywords, print, def, import
  if (/^\s*(#|def |print\s*\(|import |from \w+ import|for |while |if |class )/m.test(t)) return 'python'
  return 'javascript'
}

const CodeRunner = ({ initialCode, initialLanguage = 'javascript' }) => {
  const [code, setCode] = useState(initialCode || TEMPLATES.javascript)
  const [language, setLanguage] = useState(initialLanguage)
  const [stdinInput, setStdinInput] = useState('')      // user-provided stdin
  const [showStdin, setShowStdin] = useState(false)     // toggle stdin panel
  const [output, setOutput] = useState(null)
  const [htmlOutput, setHtmlOutput] = useState(null)
  const [status, setStatus] = useState('idle')
  const [execTime, setExecTime] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const switchLanguage = (lang) => {
    setLanguage(lang)
    setCode(TEMPLATES[lang])
    setOutput(null)
    setHtmlOutput(null)
    setStatus('idle')
    setExecTime(null)
    setStdinInput('')
    setShowStdin(false)
  }

  const runCode = async (codeToRun = code, lang = language) => {
    if (!codeToRun?.trim()) {
      toast.error('No code to run')
      return
    }

    // Language resolution: tab state is the source of truth for JS/Python
    // Only auto-switch to HTML if code is genuinely HTML, never the reverse
    const detected = detectLang(codeToRun)
    let effectiveLang
    if (detected === 'html') {
      effectiveLang = 'html'
    } else if (lang === 'html') {
      // Tab is on HTML but code isn't HTML — use detected (python or javascript)
      effectiveLang = detected
    } else {
      // Tab is JS or Python — always trust the tab
      effectiveLang = lang
    }

    // Warn user if JS code uses prompt() but no input is provided
    if (effectiveLang === 'javascript' && codeToRun.includes('prompt(') && !stdinInput.trim()) {
      setShowStdin(true)
      toast.error('This code uses prompt() — enter your input values in the Input box below', { duration: 5000 })
      setIsRunning(false)
      return
    }

    setIsRunning(true)
    setStatus('running')
    setOutput(null)
    setHtmlOutput(null)
    setExecTime(null)

    try {
      const res = await axios.post('/execute/run', { code: codeToRun, language: effectiveLang, input: stdinInput })
      const { success, output: out, html, error, executionTime } = res.data

      setExecTime(executionTime)

      // HTML response — render in iframe
      if (html) {
        setStatus('success')
        setHtmlOutput(html)
        if (effectiveLang !== language) setLanguage('html')
        toast.success('HTML rendered')
        return
      }

      if (error?.includes('timed out')) {
        setStatus('timeout')
        setOutput(error)
        toast.error('Execution timed out')
      } else if (success) {
        setStatus('success')
        setOutput(out)
        toast.success(`Executed in ${executionTime}ms`)
      } else {
        setStatus('error')
        setOutput(error || 'Unknown error')
        toast.error('Execution failed')
      }
    } catch (err) {
      setStatus('error')
      setOutput(err.response?.data?.error || err.message || 'Request failed')
      toast.error('Execution failed')
    } finally {
      setIsRunning(false)
    }
  }

  const generateAndRun = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    setOutput(null)
    setHtmlOutput(null)
    setStatus('idle')
    toast.loading('Generating code...', { id: 'ai-gen' })

    try {
      const res = await axios.get('/ai/get-result', { params: { prompt: aiPrompt } })
      const aiData = res.data
      let generatedCode = ''

      if (aiData?.fileTree) {
        const exts = language === 'python' ? ['.py'] : language === 'html' ? ['.html', '.htm'] : ['.js']
        const entry = Object.entries(aiData.fileTree).find(([k]) => exts.some(e => k.endsWith(e)))
        generatedCode = entry
          ? entry[1]?.file?.contents
          : Object.values(aiData.fileTree)[0]?.file?.contents || ''
      } else if (aiData?.text) {
        const match = aiData.text.match(/```(?:js|javascript|python|html)?\n([\s\S]*?)```/)
        generatedCode = match ? match[1] : aiData.text
      }

      toast.dismiss('ai-gen')

      if (generatedCode) {
        setCode(generatedCode)
        setIsGenerating(false)
        await runCode(generatedCode, language)
      } else {
        setStatus('error')
        setOutput('AI did not return executable code. Try a more specific prompt.')
        toast.error('No code generated')
        setIsGenerating(false)
      }
    } catch (err) {
      toast.dismiss('ai-gen')
      setStatus('error')
      setOutput(err.response?.data?.error || 'AI generation failed.')
      toast.error('AI generation failed')
      setIsGenerating(false)
    }
  }

  const loadFromHistory = (item) => {
    setCode(item.code)
    setLanguage(item.language || detectLang(item.code))
    setOutput(item.output || item.error)
    setHtmlOutput(null)
    setStatus(item.output ? 'success' : 'error')
    setExecTime(item.executionTime)
    setShowHistory(false)
    toast.success('Loaded from history')
  }

  const downloadCode = () => {
    const ext = LANG_META[language]?.ext || 'txt'
    const blob = new Blob([code], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `code.${ext}`
    a.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 h-full"
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Language selector */}
        <div className="flex rounded-xl overflow-hidden border border-border text-xs">
          {Object.entries(LANG_META).map(([lang, meta]) => (
            <button
              key={lang}
              onClick={() => switchLanguage(lang)}
              className={`px-4 py-2 font-medium transition-colors ${
                language === lang
                  ? 'bg-primary text-white'
                  : 'bg-card text-muted hover:text-text'
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button onClick={downloadCode} title="Download" className="p-2 rounded-xl border border-border text-muted hover:text-text hover:border-primary/40 transition-all text-sm">
          <i className="ri-download-line"></i>
        </button>
        <button
          title="Copy code"
          onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!') }}
          className="p-2 rounded-xl border border-border text-muted hover:text-text hover:border-primary/40 transition-all text-sm"
        >
          <i className="ri-file-copy-line"></i>
        </button>
        <button
          onClick={() => setShowHistory(v => !v)}
          className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            showHistory ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted hover:text-text'
          }`}
        >
          <i className="ri-history-line mr-1"></i> History
        </button>
        {/* Stdin toggle — only for JS and Python */}
        {language !== 'html' && (
          <button
            onClick={() => setShowStdin(v => !v)}
            className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              showStdin
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : code.includes('prompt(') || code.includes('input(')
                  ? 'border-yellow-500/60 text-yellow-400 animate-pulse'
                  : 'border-border text-muted hover:text-text'
            }`}
            title="Provide stdin input for your program"
          >
            <i className="ri-terminal-box-line mr-1"></i> Input
            {(code.includes('prompt(') || code.includes('input(')) && !showStdin && (
              <span className="ml-1 text-yellow-400">●</span>
            )}
          </button>
        )}
        <button
          onClick={() => runCode()}
          disabled={isRunning || isGenerating}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
        >
          {isRunning
            ? <><i className="ri-loader-4-line animate-spin"></i> Running...</>
            : <><i className="ri-play-fill"></i> Run</>}
        </button>
      </div>

      {/* ── Main area ── */}
      <div className="flex gap-4 flex-1 overflow-hidden min-h-0">

        {/* Editor + Output */}
        <div className="flex flex-col flex-1 gap-4 min-h-0 overflow-hidden">

          {/* AI bar */}
          <div className="flex gap-2 items-end">
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateAndRun() } }}
              placeholder="✨ Describe what you want to build... (e.g. fibonacci sequence)&#10;Press Enter to run, Shift+Enter for new line"
              rows={3}
              className="flex-1 input-premium resize-none"
            />
            <button
              onClick={generateAndRun}
              disabled={isGenerating || isRunning || !aiPrompt.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap shadow-lg shadow-purple-500/20 self-end"
            >
              {isGenerating
                ? <><i className="ri-loader-4-line animate-spin"></i> Generating...</>
                : <><i className="ri-sparkling-line"></i> Generate & Run</>}
            </button>
          </div>

          {/* Stdin input panel — shown when user clicks Input button */}
          {showStdin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-1"
            >
              <label className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                <i className="ri-terminal-box-line"></i>
                Program Input (stdin) — one value per line
              </label>
              <textarea
                value={stdinInput}
                onChange={e => setStdinInput(e.target.value)}
                placeholder={'e.g.\n5\nhello world\n42'}
                rows={3}
                className="input-premium resize-none font-mono text-xs"
              />
            </motion.div>
          )}

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0" style={{ minHeight: 300 }}>
            <CodeEditor
              code={code}
              language={LANG_META[language]?.monacoLang || 'javascript'}
              onChange={setCode}
            />
          </div>

          {/* Output: HTML preview OR terminal */}
          {htmlOutput ? (
            <HtmlPreview html={htmlOutput} onClose={() => setHtmlOutput(null)} />
          ) : (
            <Terminal output={output} status={status} execTime={execTime} />
          )}
        </div>

        {/* History sidebar */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="w-72 bg-card rounded-xl border border-border flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Recent Executions</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <HistoryPanel onLoad={loadFromHistory} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/** Sandboxed iframe for HTML output */
const HtmlPreview = ({ html, onClose }) => {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-xl border border-green-500/40 bg-[#0A0F1E] overflow-hidden"
      style={{ minHeight: 200, maxHeight: 320 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
          </div>
          <span className="text-xs font-medium ml-2 text-green-400">🌐 HTML Preview</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted hover:text-text transition-colors flex items-center gap-1"
        >
          <i className="ri-close-line"></i> Close
        </button>
      </div>
      <iframe
        src={url}
        sandbox="allow-scripts"
        title="HTML Preview"
        className="flex-1 w-full border-0 bg-white"
        style={{ minHeight: 160 }}
      />
    </motion.div>
  )
}

export default CodeRunner
