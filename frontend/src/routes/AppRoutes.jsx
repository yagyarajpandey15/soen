import React from 'react'
import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import RunnerScreen from '../screens/RunnerScreen'
import HistoryScreen from '../screens/HistoryScreen'
import UserAuth from '../auth/UserAuth'

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<UserAuth><Home /></UserAuth>} />
      <Route path="/project"  element={<UserAuth><Project /></UserAuth>} />
      <Route path="/runner"   element={<UserAuth><RunnerScreen /></UserAuth>} />
      <Route path="/history"  element={<UserAuth><HistoryScreen /></UserAuth>} />
      <Route path="*"         element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
)

export default AppRoutes
