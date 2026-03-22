import React from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={<UserAuth><Home /></UserAuth>} />
                <Route path="/project" element={<UserAuth><Project /></UserAuth>} />
                
                {/* Fallback route - redirect unknown paths to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes