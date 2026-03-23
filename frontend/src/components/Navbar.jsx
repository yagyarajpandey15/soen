import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'
import toast from 'react-hot-toast'

const Navbar = ({ title = 'Dashboard' }) => {
  const { user, setUser } = useContext(UserContext)
  const navigate = useNavigate()

  const logout = () => {
    axios.get('/users/logout').finally(() => {
      localStorage.removeItem('token')
      setUser(null)
      toast.success('Logged out')
      navigate('/login')
    })
  }

  const initials = user?.email?.charAt(0).toUpperCase() || '?'

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-text font-semibold text-base">{title}</h1>

      <div className="flex items-center gap-3">
        <span className="text-muted text-sm hidden sm:block">{user?.email}</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        <button
          onClick={logout}
          className="text-muted hover:text-danger transition-colors text-sm flex items-center gap-1"
        >
          <i className="ri-logout-box-r-line"></i>
        </button>
      </div>
    </header>
  )
}

export default Navbar
