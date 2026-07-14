import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext'
import { router } from './router'
import SocketProvider from '@/shared/hooks/useSocket'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}