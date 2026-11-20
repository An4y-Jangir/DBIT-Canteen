import React, { useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useAuthStore } from './store/authStore'
import { isSupabaseConfigured } from './lib/supabase'

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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Byte Canteen ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          style={{ background: '#faf9f4', color: '#121316' }}
        >
          <div
            className="max-w-md w-full bg-white p-6 rounded-lg"
            style={{ border: '1.5px solid #121316', boxShadow: '6px 6px 0px #121316' }}
          >
            <span className="text-4xl mb-3 block">⚠️</span>
            <h1
              className="text-xl font-black uppercase mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Something went wrong
            </h1>
            <p className="text-xs text-[#5e5e62] mb-4">
              {this.state.error?.message || 'An unexpected error occurred while loading the application.'}
            </p>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.href = '/'
              }}
              className="w-full py-2.5 bg-[#c8ff00] text-[#121316] font-bold text-xs uppercase rounded"
              style={{ border: '1.5px solid #121316', boxShadow: '2px 2px 0px #121316' }}
            >
              Reset & Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-surface, #faf9f4)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 animate-spin"
            style={{ borderColor: '#c8ff00', borderTopColor: '#121316' }}
          />
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#434933',
              fontWeight: 700,
            }}
          >
            Connecting Campus Bay...
          </span>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MenuPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:orderId"
              element={
                <ProtectedRoute>
                  <OrderTrackerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <KitchenRoute>
                  <KitchenDashboard />
                </KitchenRoute>
              }
            />
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
    </ErrorBoundary>
  )
}
