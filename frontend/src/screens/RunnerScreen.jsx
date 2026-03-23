import React from 'react'
import AppLayout from '../components/AppLayout'
import CodeRunner from '../components/CodeRunner'

const RunnerScreen = () => (
  <AppLayout title="Code Runner">
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem - 3rem)' }}>
      <CodeRunner />
    </div>
  </AppLayout>
)

export default RunnerScreen
