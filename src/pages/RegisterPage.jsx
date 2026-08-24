import { Navigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function RegisterPage() {
  const { authenticated } = useAuth()
  return authenticated ? <Navigate replace to="/schedule" /> : <AuthForm mode="register" />
}

