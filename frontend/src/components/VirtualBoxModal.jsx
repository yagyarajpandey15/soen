import React, { useState, useEffect, useRef } from 'react';
import { getWebContainer, killActiveProcess, setActiveProcess } from '../config/webContainer';

const UNSUPPORTED_EXTENSIONS = ['.java', '.py', '.rb', '.go', '.rs', '.cpp', '.c', '.cs', '.php'];

const detectUnsupported = (fileTree) => {
    const bad = Object.keys(fileTree).find(f =>
        UNSUPPORTED_EXTENSIONS.some(ext => f.endsWith(ext))
    );
    return bad ? bad.split('.').pop() : null;
};

const detectProjectType = (fileTree) => {
    if (Object.keys(fileTree).includes('package.json')) return 'node';
    if (Object.keys(fileTree).some(f => f.endsWith('.html'))) return 'html';
    return 'node';
};

const getStartArgs = (fileTree) => {
    try {
        const raw = fileTree['package.json']?.file?.contents;
        if (raw) {
            const s = JSON.parse(raw).scripts || {};
            if (s.dev)     return ['run', 'dev'];
            if (s.start)   return ['start'];
            if (s.serve)   return ['run', 'serve'];
            if (s.preview) return ['run', 'preview'];
        }
    } catch { /* ignore */ }
    return ['start'];
};

const NPMRC = 'yes=true\nfund=false\naudit=false\nloglevel=error\nprogress=false\n';

// Minimal static file server — avoids npx serve prompt
const STATIC_SERVER = `
const http = require('http');
const fs = require('fs');
const path = require('path');
const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer((req, res) => {
  const filePath = '.' + (req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
}).listen(3000, () => console.log('Server running on port 3000'));
`.trim();

const VirtualBoxModal = ({ fileTree, onClose }) => {
    const [logs, setLogs] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [status, setStatus] = useState('initializing');
    const [error, setError] = useState('');
    const logsRef = useRef(null);
    // Track whether this modal instance is still mounted
    const mountedRef = useRef(true);

    const appendLog = (text) => {
        if (mountedRef.current) setLogs(prev => prev + text);
    };

    // Auto-scroll terminal
    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        mountedRef.current = true;

        if (!fileTree || Object.keys(fileTree).length === 0) return;

        const run = async () => {
            try {
                // 1. Unsupported language check
                const unsupported = detectUnsupported(fileTree);
                if (unsupported) {
                    throw new Error(
                        `.${unsupported} files are not supported in WebContainer.\n` +
                        'Only JavaScript/TypeScript (Node.js) and HTML/CSS/JS projects are supported.'
                    );
                }

                const projectType = detectProjectType(fileTree);
                appendLog(`🚀 Starting WebContainer (${projectType} project)...\n`);

                const wc = await getWebContainer();

                // 2. Kill any previously running process BEFORE mounting new files
                appendLog('🛑 Stopping previous process...\n');
                killActiveProcess();
                // Small delay to let the port release inside the container
                await new Promise(r => setTimeout(r, 300));

                // 3. Mount fresh files + .npmrc
                appendLog('📁 Mounting files...\n');
                await wc.mount({
                    ...fileTree,
                    '.npmrc': { file: { contents: NPMRC } },
                });
                appendLog(`✅ Mounted ${Object.keys(fileTree).length} files\n`);

                if (projectType === 'html') {
                    await runHtmlProject(wc);
                } else {
                    await runNodeProject(wc, fileTree);
                }

                // 4. server-ready — WebContainer fires this once per server start
                wc.on('server-ready', (port, url) => {
                    appendLog(`\n✅ Server ready on port ${port} → ${url}\n`);
                    if (mountedRef.current) {
                        setPreviewUrl(url);
                        setStatus('ready');
                    }
                });

            } catch (err) {
                console.error('WebContainer error:', err);
                if (mountedRef.current) {
                    setError(err.message);
                    setStatus('error');
                }
                appendLog(`\n❌ ${err.message}\n`);
            }
        };

        run();

        return () => {
            mountedRef.current = false;
            // Don't kill on unmount — let the process keep running so port stays free
            // until the next run() call explicitly kills it
        };
    }, [fileTree]);

    const runHtmlProject = async (wc) => {
        appendLog('📝 Writing static file server...\n');
        await wc.mount({ '_server.js': { file: { contents: STATIC_SERVER } } });

        if (mountedRef.current) setStatus('starting');
        appendLog('▶️  Starting static server on port 3000...\n');

        const proc = await wc.spawn('node', ['_server.js']);
        setActiveProcess(proc);
        proc.output.pipeTo(new WritableStream({ write: appendLog }));
    };

    const runNodeProject = async (wc, ft) => {
        if (mountedRef.current) setStatus('installing');
        appendLog('\n📦 Installing dependencies...\n');

        const install = await wc.spawn(
            'npm', ['install', '--yes', '--no-fund', '--no-audit', '--loglevel=error'],
            { env: { CI: 'true', npm_config_yes: 'true' } }
        );
        install.output.pipeTo(new WritableStream({ write: appendLog }));

        const exitCode = await install.exit;
        if (exitCode !== 0) {
            throw new Error(`npm install failed (exit code ${exitCode}). See terminal for details.`);
        }
        appendLog('✅ Dependencies installed\n');

        if (mountedRef.current) setStatus('starting');
        const startArgs = getStartArgs(ft);
        appendLog(`\n▶️  npm ${startArgs.join(' ')}...\n`);

        const proc = await wc.spawn('npm', startArgs, {
            env: { CI: 'true', NODE_ENV: 'development' }
        });
        setActiveProcess(proc);
        proc.output.pipeTo(new WritableStream({ write: appendLog }));
    };

    if (!fileTree) return null;

    const statusLabel = {
        initializing: '⏳ Initializing...',
        installing:   '📦 Installing dependencies...',
        starting:     '▶️  Starting server...',
        ready:        '🟢 Live',
        error:        '🔴 Error',
    }[status] || '...';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 text-green-400 rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col font-mono">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-800 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🖥️</span>
                        <div>
                            <p className="font-semibold text-green-300 text-sm">WebContainer Sandbox</p>
                            <p className="text-xs text-gray-400">{statusLabel}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Terminal */}
                    <div className="w-2/5 flex flex-col border-r border-gray-700">
                        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs text-green-300 font-semibold flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${status === 'error' ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}></span>
                            Terminal
                        </div>
                        <pre ref={logsRef} className="flex-1 overflow-auto text-xs leading-relaxed text-green-300 bg-gray-950 p-3 whitespace-pre-wrap">
                            {logs || 'Waiting...'}
                        </pre>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 flex flex-col">
                        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-xs text-green-300 font-semibold flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${previewUrl ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`}></span>
                            Live Preview
                            {previewUrl && (
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                    className="ml-auto text-blue-400 hover:underline font-normal">
                                    Open in new tab ↗
                                </a>
                            )}
                        </div>
                        <div className="flex-1 bg-white">
                            {status === 'error' ? (
                                <div className="h-full flex items-center justify-center bg-gray-950 p-6">
                                    <div className="text-center max-w-md">
                                        <p className="text-red-400 text-4xl mb-3">❌</p>
                                        <p className="text-red-300 font-semibold mb-2">Execution failed</p>
                                        <p className="text-gray-400 text-xs whitespace-pre-wrap">{error}</p>
                                        <button onClick={onClose}
                                            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : previewUrl ? (
                                <iframe src={previewUrl} className="w-full h-full border-0" title="Preview" />
                            ) : (
                                <div className="h-full flex items-center justify-center bg-gray-950">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-green-300 text-sm">{statusLabel}</p>
                                        <p className="text-gray-500 text-xs mt-1">Check terminal for details</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-2 border-t border-gray-700 bg-gray-800 rounded-b-xl flex items-center justify-between text-xs text-gray-400">
                    <span>{Object.keys(fileTree).length} files mounted</span>
                    <button onClick={onClose} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VirtualBoxModal;
