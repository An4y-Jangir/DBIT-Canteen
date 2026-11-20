import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuthStore } from './store/authStore'

import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderTrackerPage from './pages/OrderTrackerPage'
import KitchenDashboard from './pages/KitchenDashboard'
import NotFoundPage from './pages/NotFoundPage'

import ProtectedRoute from './components/ProtectedRoute'
import KitchenRoute from './components/KitchenRoute'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
})

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => { initialize() }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#c8ff00', borderTopColor: 'transparent' }} />
          <span style={{ fontFamily: 'var(--font-headline)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
            Connecting Campus Bay...
          </span>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/order/:orderId" element={<ProtectedRoute><OrderTrackerPage /></ProtectedRoute>} />
          <Route path="/kitchen" element={<KitchenRoute><KitchenDashboard /></KitchenRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '13px',
            fontWeight: '700',
            border: '1.5px solid #121316',
            boxShadow: '4px 4px 0px #121316',
            borderRadius: '4px',
            background: '#ffffff',
            color: '#121316',
          },
        }}
      />
    </QueryClientProvider>
  )
}
