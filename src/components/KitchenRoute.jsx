import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function KitchenRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const isKitchenStaff = useAuthStore((s) => s.isKitchenStaff)()
  if (!user) return <Navigate to="/login" replace />
  if (!isKitchenStaff) return <Navigate to="/" replace />
  return children
}
