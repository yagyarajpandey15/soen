import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './context/user.context'
import { AIProvider } from './context/ai.context'

const App = () => {
  // Verify environment variables
  React.useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    console.log('App initialized - API URL:', apiUrl)
  }, [])
  
  return (
    <UserProvider>
      <AIProvider>
        <AppRoutes />
      </AIProvider>
    </UserProvider>
  )
}

export default App