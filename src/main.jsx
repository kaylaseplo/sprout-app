import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { ClassroomProvider } from './contexts/ClassroomProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ClassroomProvider>
          <App />
        </ClassroomProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
