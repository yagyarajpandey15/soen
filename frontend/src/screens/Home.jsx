import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'

const Home = () => {
  const { user } = useContext(UserContext)
  const [projects, setProjects] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchProjects = () => {
    axios.get('/projects/all')
      .then(res => setProjects(res.data.projects || []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const createProject = (e) => {
    e.preventDefault()
    if (!projectName.trim()) return
    axios.post('/projects/create', { name: projectName })
      .then(() => {
        toast.success('Project created')
        setIsModalOpen(false)
        setProjectName('')
        fetchProjects()
      })
      .catch(() => toast.error('Failed to create project'))
  }

  return (
    <AppLayout title="My Projects">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-text text-xl font-semibold">Projects</h2>
          <p className="text-muted text-sm mt-0.5">Welcome back, {user?.email}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
        >
          <i className="ri-add-line"></i> New Project
        </button>
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted gap-2">
          <i className="ri-loader-4-line animate-spin text-xl"></i>
          <span className="text-sm">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
          <i className="ri-folder-3-line text-5xl"></i>
          <p className="text-base font-medium text-text">No projects yet</p>
          <p className="text-sm">Create your first project to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-text hover:border-primary/40 transition-all"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/project', { state: { project: p } })}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <i className="ri-folder-3-line text-primary"></i>
                  </div>
                  <i className="ri-arrow-right-up-line text-muted group-hover:text-primary transition-colors"></i>
                </div>
                <h3 className="text-text font-semibold text-sm truncate mb-1">{p.name}</h3>
                <p className="text-muted text-xs flex items-center gap-1">
                  <i className="ri-user-line"></i>
                  {p.users?.length || 0} collaborator{p.users?.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-text font-semibold text-lg mb-4">New Project</h2>
              <form onSubmit={createProject}>
                <input
                  autoFocus
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="input-premium mb-4"
                  required
                />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-muted hover:text-text text-sm transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm font-medium hover:scale-105 transition-all">
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

export default Home
