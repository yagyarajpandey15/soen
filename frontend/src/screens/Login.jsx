import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import { Toaster } from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useContext(UserContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/users/login', { email, password })
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      toast.success('Welcome back!')
      navigate('/')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155' } }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <i className="ri-code-s-slash-line text-white text-lg"></i>
          </div>
          <span className="text-text font-bold text-2xl">SOEN</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-text font-semibold text-xl mb-1">Sign in</h2>
          <p className="text-muted text-sm mb-6">Welcome back to SOEN</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="text-muted text-xs font-medium mb-1.5 block">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="input-premium"
              />
            </div>
            <div>
              <label className="text-muted text-xs font-medium mb-1.5 block">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="input-premium"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:opacity-60 text-white font-medium text-sm transition-all hover:scale-[1.02] mt-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="text-muted text-sm text-center mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
