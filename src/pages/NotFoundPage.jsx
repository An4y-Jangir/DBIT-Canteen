import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--color-surface)' }}>
      <p className="text-8xl">🍽️</p>
      <div className="text-center">
        <h1 className="text-5xl font-black uppercase tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
          404
        </h1>
        <p className="text-lg font-bold mt-2 uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>
          Page not found
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="btn-brutal px-8 py-3 bg-[#c8ff00] text-[#121316] rounded text-sm"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        ← Back to Menu
      </button>
    </div>
  )
}
