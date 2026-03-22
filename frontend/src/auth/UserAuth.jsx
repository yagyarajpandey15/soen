import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const UserAuth = ({ children }) => {
    const { user, setUser } = useContext(UserContext)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        let mounted = true
        const controller = new AbortController()

        const verifyAuth = async () => {
            // No token - redirect immediately
            if (!token) {
                if (mounted) {
                    setLoading(false)
                    navigate('/login', { replace: true })
                }
                return
            }

            // User already loaded - skip verification
            if (user) {
                if (mounted) setLoading(false)
                return
            }

            // Verify token with 5 second timeout
            const timeoutId = setTimeout(() => {
                controller.abort()
                if (mounted) {
                    console.error('Auth verification timeout')
                    setError('Connection timeout. Please check your network.')
                    setLoading(false)
                }
            }, 5000)

            try {
                const response = await axios.get('/users/profile', {
                    signal: controller.signal
                })
                
                clearTimeout(timeoutId)
                
                if (mounted) {
                    setUser(response.data.user)
                    setLoading(false)
                    setError(null)
                }
            } catch (err) {
                clearTimeout(timeoutId)
                
                if (mounted) {
                    console.error('Auth verification failed:', err)
                    localStorage.removeItem('token')
                    setError(err.message || 'Authentication failed')
                    setLoading(false)
                    
                    // Redirect after showing error briefly
                    setTimeout(() => {
                        if (mounted) {
                            navigate('/login', { replace: true })
                        }
                    }, 1500)
                }
            }
        }

        verifyAuth()

        // Cleanup function
        return () => {
            mounted = false
            controller.abort()
        }
    }, [user, token, navigate, setUser])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-white text-xl">Verifying authentication...</div>
                    <div className="text-gray-400 text-sm mt-2">Please wait</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center max-w-md mx-4">
                    <div className="text-red-400 text-6xl mb-4">⚠️</div>
                    <h2 className="text-red-400 text-2xl font-bold mb-2">Authentication Error</h2>
                    <p className="text-gray-300 text-sm mb-4">{error}</p>
                    <p className="text-gray-500 text-xs mb-4">Redirecting to login...</p>
                    <button 
                        onClick={() => navigate('/login', { replace: true })}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Go to Login Now
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default UserAuth