import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import { useAI } from '../context/ai.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'
import AIChat from '../components/AIChat'
import SimpleAI from '../components/SimpleAI'

const Home = () => {

    const { user, setUser } = useContext(UserContext)
    const { isAIChatOpen, openAIChat, closeAIChat, handleCodeGenerated, aiGeneratedCode } = useAI()
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])
    const [ showSimpleAI, setShowSimpleAI ] = useState(false)

    const navigate = useNavigate()

    function logout() {
        axios.get('/users/logout')
            .then(() => {
                localStorage.removeItem('token')
                setUser(null)
                navigate('/login')
            })
            .catch((err) => {
                console.log(err)
                // Even if logout fails on server, clear local storage
                localStorage.removeItem('token')
                setUser(null)
                navigate('/login')
            })
    }

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
                setProjectName('')
                // Refresh the projects list
                fetchProjects()
            })
            .catch((error) => {
                console.log(error)
            })
    }

    function fetchProjects() {
        console.log('📡 Fetching projects...');
        axios.get('/projects/all').then((res) => {
            console.log('✅ Projects fetched:', res.data);
            setProject(res.data.projects || [])
        }).catch(err => {
            console.error('❌ Failed to fetch projects:', err)
        })
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    return (
        <main className='p-4'>
            <header className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold">My Projects</h1>
                    <p className="text-gray-600">Welcome back, {user?.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={openAIChat}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>AI Chat</span>
                    </button>
                    <button
                        onClick={() => setShowSimpleAI(!showSimpleAI)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-md hover:from-green-600 hover:to-teal-700 flex items-center space-x-2"
                    >
                        <span>⚡</span>
                        <span>Frontend AI</span>
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Simple AI Demo */}
            {showSimpleAI && (
                <div className="mb-6">
                    <SimpleAI />
                </div>
            )}

            <div className="projects flex flex-wrap gap-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="project p-4 border border-slate-300 rounded-md">
                    New Project
                    <i className="ri-link ml-2"></i>
                </button>

                {
                    (project || []).map((project) => (
                        <div key={project._id || project.id}
                            onClick={() => {
                                console.log('🎯 Navigating to project:', project);
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="project flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-200">
                            <h2
                                className='font-semibold'
                            >{project.name}</h2>

                            <div className="flex gap-2">
                                <p> <small> <i className="ri-user-line"></i> Collaborators</small> :</p>
                                {project.users?.length || 0}
                            </div>

                        </div>
                    ))
                }


            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-md shadow-md w-1/3">
                        <h2 className="text-xl mb-4">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" className="mr-2 px-4 py-2 bg-gray-300 rounded-md" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Chat Component */}
            <AIChat 
                isOpen={isAIChatOpen} 
                onClose={closeAIChat}
                onCodeGenerated={handleCodeGenerated}
            />

            {/* AI Generated Code Notification */}
            {aiGeneratedCode && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">Code Generated!</h4>
                            <p className="text-sm">AI has generated {Object.keys(aiGeneratedCode.fileTree || {}).length} files</p>
                        </div>
                        <button
                            onClick={() => {
                                // Create a new project with AI-generated code
                                const aiProjectName = `ai-project-${Date.now()}`;
                                setProjectName(aiProjectName);
                                setIsModalOpen(true);
                            }}
                            className="ml-3 px-3 py-1 bg-white text-green-500 rounded text-sm hover:bg-gray-100"
                        >
                            Create Project
                        </button>
                    </div>
                </div>
            )}

        </main>
    )
}

export default Home