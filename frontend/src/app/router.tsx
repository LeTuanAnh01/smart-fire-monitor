import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import AppLayout from '@/shared/components/layout/AppLayout'
import LoginForm from '@/features/auth/components/LoginForm'

const Dashboard = lazy(() => import('@/features/dashboard'))
const Alerts = lazy(() => import('@/features/alerts'))
const Devices = lazy(() => import('@/features/devices'))
const Users = lazy(() => import('@/features/users'))
const Reports = lazy(() => import('@/features/reports'))
const Settings = lazy(() => import('@/features/settings'))
const Locations = lazy(() => import('@/features/locations'))
const DeviceMap = lazy(() => import('@/features/device-map'))

const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <Spin size="large" />
  </div>
)

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
)

export const router = createBrowserRouter([
  { path: '/login', element: <LoginForm /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Wrap><Dashboard /></Wrap> },
      { path: 'alerts', element: <Wrap><Alerts /></Wrap> },
      { path: 'devices', element: <Wrap><Devices /></Wrap> },
      { path: 'locations', element: <Wrap><Locations /></Wrap> },
      { path: 'users', element: <Wrap><Users /></Wrap> },
      { path: 'reports', element: <Wrap><Reports /></Wrap> },
      { path: 'settings', element: <Wrap><Settings /></Wrap> },
      { path: 'device-map', element: <Wrap><DeviceMap /></Wrap> },
    ]
  }
])