import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getWebContainer, killActiveProcess, setActiveProcess } from '../config/webContainer'
import VirtualBoxModal from '../components/VirtualBoxModal'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)
    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])
    return <code {...props} ref={ref} />
}

const Project = () => {
    const location = useLocation()
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state?.project || null)
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [isAiLoading, setIsAiLoading] = useState(false)
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)
    const [runLogs, setRunLogs] = useState('')
    const [isRunning, setIsRunning] = useState(false)
    const [sandboxFileTree, setSandboxFileTree] = useState(null) // auto-trigger sandbox

    // Fetch project if not in location state
    useEffect(() => {
        if (!location.state?.project) {
            const urlParams = new URLSearchParams(window.location.search)
            const projectId = urlParams.get('id')
            if (projectId) {
                axios.get(`/projects/get-project/${projectId}`)
                    .then(res => setProject(res.data.project))
                    .catch(err => console.error('Failed to fetch project:', err))
            } else {
                setProject({ _id: 'temp', name: 'Temporary Project', users: [user], fileTree: {} })
            }
        }
    }, [location.state, user])

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading project...</p>
                </div>
            </div>
        )
    }

    const handleUserClick = (id) => {
        setSelectedUserId(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    function addCollaborators() {
        axios.put('/projects/add-user', {
            projectId: project._id || project.id,
            users: Array.from(selectedUserId)
        }).then(() => setIsModalOpen(false)).catch(console.error)
    }

    const send = () => {
        if (!message.trim()) return
        const isAIMessage = message.includes('@ai')
        sendMessage('project-message', { message, sender: user })
        setMessages(prev => [...prev, { sender: user, message }])
        if (isAIMessage) {
            setIsAiLoading(true)
            handleAIMessage(message.replace(/@ai\s*/i, '').trim())
        }
        setMessage('')
    }

    const handleAIMessage = async (prompt) => {
        try {
            console.log('🤖 AI prompt:', prompt)
            const response = await axios.get('/ai/get-result', { params: { prompt } })
            const aiResponse = response.data
            console.log('✅ AI response:', aiResponse)

            const displayText = typeof aiResponse?.text === 'string'
                ? aiResponse.text
                : JSON.stringify(aiResponse)

            const aiMessage = { message: displayText, sender: { _id: 'ai', email: 'AI Assistant' } }
            sendMessage('project-message', aiMessage)
            setMessages(prev => [...prev, aiMessage])

            // If AI returned a fileTree — update editor AND auto-launch sandbox
            if (aiResponse?.fileTree && Object.keys(aiResponse.fileTree).length > 0) {
                const newFileTree = { ...fileTree, ...aiResponse.fileTree }
                setFileTree(newFileTree)
                saveFileTree(newFileTree)
                // Auto-open sandbox preview
                setSandboxFileTree(aiResponse.fileTree)
            }
        } catch (error) {
            console.error('AI Error:', error)
            const errMsg = { message: `❌ AI error: ${error.message}`, sender: { _id: 'ai', email: 'AI Assistant' } }
            sendMessage('project-message', errMsg)
            setMessages(prev => [...prev, errMsg])
        } finally {
            setIsAiLoading(false)
        }
    }

    // Run the current fileTree in the inline WebContainer
    const runInContainer = async () => {
        if (!webContainer || Object.keys(fileTree).length === 0) return

        const UNSUPPORTED = ['.java', '.py', '.rb', '.go', '.rs', '.cpp', '.c', '.cs', '.php']
        const badFile = Object.keys(fileTree).find(f => UNSUPPORTED.some(ext => f.endsWith(ext)))
        if (badFile) {
            setRunLogs(`❌ Unsupported language: ${badFile}\nWebContainer only supports JavaScript/Node.js and HTML/CSS/JS.\n`)
            return
        }

        setIsRunning(true)
        setRunLogs('')
        setIframeUrl(null)

        const appendLog = (t) => setRunLogs(prev => prev + t)

        try {
            // Kill previous process first so port is released
            appendLog('🛑 Stopping previous process...\n')
            killActiveProcess()
            await new Promise(r => setTimeout(r, 300))

            appendLog('📁 Mounting files...\n')
            await webContainer.mount({
                ...fileTree,
                '.npmrc': { file: { contents: 'yes=true\nfund=false\naudit=false\nloglevel=error\n' } }
            })

            appendLog('📦 Installing dependencies...\n')
            const install = await webContainer.spawn(
                'npm', ['install', '--yes', '--no-fund', '--no-audit', '--loglevel=error'],
                { env: { CI: 'true', npm_config_yes: 'true' } }
            )
            install.output.pipeTo(new WritableStream({ write: appendLog }))
            const code = await install.exit
            if (code !== 0) throw new Error(`npm install failed (exit ${code})`)
            appendLog('✅ Dependencies installed\n')

            let startArgs = ['start']
            try {
                const pkg = JSON.parse(fileTree['package.json']?.file?.contents || '{}')
                const s = pkg.scripts || {}
                if (s.dev)        startArgs = ['run', 'dev']
                else if (s.start) startArgs = ['start']
                else if (s.serve) startArgs = ['run', 'serve']
            } catch { /* ignore */ }

            appendLog(`\n▶️  npm ${startArgs.join(' ')}...\n`)
            const proc = await webContainer.spawn('npm', startArgs, {
                env: { CI: 'true', NODE_ENV: 'development' }
            })
            setRunProcess(proc)
            setActiveProcess(proc)
            proc.output.pipeTo(new WritableStream({ write: appendLog }))

            webContainer.on('server-ready', (port, url) => {
                appendLog(`\n✅ Ready at ${url}\n`)
                setIframeUrl(url)
                setIsRunning(false)
            })
        } catch (err) {
            appendLog(`\n❌ ${err.message}\n`)
            setIsRunning(false)
        }
    }

    function WriteAiMessage(msg) {
        return (
            <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                <Markdown children={String(msg ?? '')} options={{ overrides: { code: SyntaxHighlightedCode } }} />
            </div>
        )
    }

    useEffect(() => {
        const projectId = project?._id || project?.id
        if (!project || !projectId) return

        initializeSocket(projectId).catch(console.error)

        getWebContainer().then(wc => {
            if (wc) setWebContainer(wc)
        }).catch(console.error)

        receiveMessage('project-message', data => {
            if (!data) return
            if (data.sender?._id === 'ai') {
                setIsAiLoading(false)
                // Socket-based AI messages (from other users' @ai triggers)
                let parsed = null
                try { parsed = typeof data.message === 'string' ? JSON.parse(data.message) : data.message } catch { }
                if (parsed?.fileTree) {
                    setFileTree(parsed.fileTree)
                    setSandboxFileTree(parsed.fileTree)
                }
            }
            setMessages(prev => [...prev, data])
        })

        axios.get(`/projects/get-project/${projectId}`)
            .then(res => {
                setProject(res.data.project)
                setFileTree(res.data.project?.fileTree || {})
            }).catch(console.error)

        axios.get('/users/all')
            .then(res => setUsers(res.data.users || []))
            .catch(console.error)

        return () => {
            import('../config/socket').then(({ disconnectSocket }) => disconnectSocket())
        }
    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id || project.id,
            fileTree: ft
        }).catch(console.error)
    }

    return (
        <main className='h-screen w-screen flex'>

            {/* ── Left: Chat ── */}
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0'>
                    <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill mr-1"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div ref={messageBox} className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
                        {(messages || []).map((msg, index) => (
                            <div key={index} className={`${msg?.sender?._id === 'ai' ? 'max-w-80' : 'max-w-52'} ${String(msg?.sender?._id) === String(user?._id ?? '') ? 'ml-auto' : ''} message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                                <small className='opacity-65 text-xs'>{msg?.sender?.email}</small>
                                <div className='text-sm'>
                                    {msg?.sender?._id === 'ai'
                                        ? WriteAiMessage(String(msg.message ?? ''))
                                        : <p className='whitespace-pre-wrap'>{String(msg.message ?? '')}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                            className='p-2 px-4 border-none outline-none flex-grow'
                            type="text"
                            placeholder='Message... (use @ai to generate code)'
                        />
                        <button
                            onClick={send}
                            disabled={isAiLoading}
                            className={`px-5 text-white transition-colors ${message.includes('@ai') ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-950'} ${isAiLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {isAiLoading
                                ? <i className="ri-loader-4-line animate-spin"></i>
                                : <i className="ri-send-plane-fill"></i>}
                        </button>
                    </div>
                </div>

                {isAiLoading && (
                    <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none">
                        <span className="text-xs text-blue-700 bg-white/80 rounded px-2 py-1 animate-pulse">AI is generating code...</span>
                    </div>
                )}

                {/* Collaborators panel */}
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>
                        <h1 className='font-semibold text-lg'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(false)} className='p-2'><i className="ri-close-fill"></i></button>
                    </header>
                    <div className="users flex flex-col gap-2">
                        {(project?.users || []).map((pu, idx) => (
                            <div key={idx} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                    <i className="ri-user-fill absolute"></i>
                                </div>
                                <h1 className='font-semibold text-lg'>{pu.user?.email || pu.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Right: Editor + Preview ── */}
            <section className="right bg-slate-50 flex-grow h-full flex">

                {/* File explorer */}
                <div className="explorer h-full max-w-64 min-w-52 bg-slate-200 overflow-y-auto">
                    <div className="file-tree w-full">
                        {Object.keys(fileTree || {}).map((file, index) => (
                            <button
                                key={index}
                                onClick={() => { setCurrentFile(file); setOpenFiles([...new Set([...openFiles, file])]) }}
                                className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full hover:bg-slate-400">
                                <i className="ri-file-code-line text-sm"></i>
                                <p className='font-medium text-sm truncate'>{file}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code editor */}
                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full bg-slate-200 border-b border-slate-300">
                        <div className="files flex overflow-x-auto">
                            {(openFiles || []).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 text-sm whitespace-nowrap ${currentFile === file ? 'bg-slate-100 border-b-2 border-blue-500' : 'bg-slate-200 hover:bg-slate-300'}`}>
                                    {file}
                                </button>
                            ))}
                        </div>

                        <div className="actions flex gap-2 p-2 shrink-0">
                            {/* Run in sandbox button */}
                            {Object.keys(fileTree).length > 0 && (
                                <button
                                    onClick={() => setSandboxFileTree({ ...fileTree })}
                                    className='px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-1'>
                                    <i className="ri-play-fill"></i> Run in Sandbox
                                </button>
                            )}
                            {/* Inline run button */}
                            <button
                                onClick={runInContainer}
                                disabled={isRunning || Object.keys(fileTree).length === 0}
                                className='px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded flex items-center gap-1'>
                                {isRunning
                                    ? <><i className="ri-loader-4-line animate-spin"></i> Running...</>
                                    : <><i className="ri-terminal-line"></i> Run Inline</>}
                            </button>
                        </div>
                    </div>

                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {fileTree[currentFile] ? (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs h-full outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const ft = { ...fileTree, [currentFile]: { file: { contents: e.target.innerText } } }
                                            setFileTree(ft)
                                            saveFileTree(ft)
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight(
                                                fileTree[currentFile]?.file?.contents || '',
                                                { language: 'javascript', ignoreIllegals: true }
                                            ).value
                                        }}
                                        style={{ whiteSpace: 'pre-wrap', paddingBottom: '25rem' }}
                                    />
                                </pre>
                            </div>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <i className="ri-code-s-slash-line text-4xl mb-2"></i>
                                    <p className="text-sm">Select a file or use <span className="font-mono bg-slate-200 px-1 rounded">@ai</span> to generate code</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Inline run logs */}
                    {runLogs && (
                        <div className="h-32 bg-gray-900 text-green-300 text-xs font-mono p-2 overflow-auto border-t border-gray-700">
                            <pre className="whitespace-pre-wrap">{runLogs}</pre>
                        </div>
                    )}
                </div>

                {/* Inline iframe preview */}
                {iframeUrl && (
                    <div className="flex min-w-96 flex-col h-full border-l border-slate-300">
                        <div className="flex items-center gap-2 bg-slate-200 p-2 border-b border-slate-300">
                            <input
                                type="text"
                                value={iframeUrl}
                                onChange={(e) => setIframeUrl(e.target.value)}
                                className="flex-1 p-1 px-2 text-sm bg-white border border-slate-300 rounded"
                            />
                            <button onClick={() => setIframeUrl(null)} className="text-slate-500 hover:text-red-500">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full border-0" title="Preview" />
                    </div>
                )}
            </section>

            {/* Add collaborator modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Add Collaborator</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'><i className="ri-close-fill"></i></button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {(users || []).map(u => (
                                <div key={u.id}
                                    className={`user cursor-pointer hover:bg-slate-200 ${selectedUserId.has(u.id) ? 'bg-slate-200' : ''} p-2 flex gap-2 items-center`}
                                    onClick={() => handleUserClick(u.id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold'>{u.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}

            {/* Auto-triggered sandbox modal */}
            {sandboxFileTree && (
                <VirtualBoxModal
                    fileTree={sandboxFileTree}
                    onClose={() => setSandboxFileTree(null)}
                />
            )}
        </main>
    )
}

export default Project
