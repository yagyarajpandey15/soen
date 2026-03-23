import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const Login = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    async function submitHandler(e) {
        e.preventDefault()

        setLoading(true)
        setError('')

        try {
            const res = await axios.post('/users/login', {
                email,
                password
            }, {
                withCredentials: true
            })

            // ✅ store token (IMPORTANT)
            if (res.data.token) {
                localStorage.setItem('token', res.data.token)
            }

            // ✅ set user
            setUser(res.data.user)

            // ✅ redirect
            navigate('/')

        } catch (err) {
            console.error(err)

            const message =
                err.response?.data?.errors ||
                err.response?.data?.error ||
                err.message ||
                'Login failed'

            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">

                <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500 text-white rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={submitHandler}>

                    <div className="mb-4">
                        <label className="block text-gray-400 mb-2">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-3 rounded text-white transition ${
                            loading
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                </form>

                <p className="text-gray-400 mt-4 text-center">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-500 hover:underline">
                        Create one
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Login