import { Navigate, Route, Routes } from 'react-router-dom'
import { SignUp } from './pages/SignUp'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { ProtectedRoute, RedirectIfAuthed } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignUp />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
