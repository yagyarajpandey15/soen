import React from 'react'
import Editor from '@monaco-editor/react'

const LANG_MAP = { javascript: 'javascript', python: 'python', html: 'html' }

const CodeEditor = ({ code, language, onChange }) => {
  return (
    <div className="h-full overflow-hidden rounded-xl border border-border monaco-container" style={{ minHeight: 300 }}>
      <Editor
        height="100%"
        language={LANG_MAP[language] || 'javascript'}
        value={code}
        onChange={(val) => onChange(val ?? '')}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  )
}

export default CodeEditor
