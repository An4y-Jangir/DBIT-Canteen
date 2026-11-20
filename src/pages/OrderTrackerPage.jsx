import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Badge, Spinner, LivePulse } from '../components/ui'
import { getOrderStatusLabel, formatPrice, formatTime } from '../lib/utils'

const STATUS_STEPS = ['confirmed', 'preparing', 'ready', 'picked_up']

function ProgressStep({ step, currentStatus }) {
  const steps = STATUS_STEPS
  const currentIdx = steps.indexOf(currentStatus)
  const stepIdx = steps.indexOf(step)
  const done = stepIdx <= currentIdx
  const active = stepIdx === currentIdx

  const labels = {
    confirmed: { emoji: '✅', label: 'Order Confirmed' },
    preparing: { emoji: '🔥', label: 'Kitchen Preparing' },
    ready: { emoji: '🛎️', label: 'Ready for Pickup' },
    picked_up: { emoji: '🎉', label: 'Order Collected' },
  }
  const { emoji, label } = labels[step]

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 font-black transition-all"
        style={{
          background: done ? '#c8ff00' : active ? '#3b5bdb' : 'var(--color-surface-container)',
          border: `1.5px solid ${done || active ? '#121316' : 'var(--color-outline-variant)'}`,
          boxShadow: done || active ? '2px 2px 0px #121316' : 'none',
        }}
      >
        {done ? emoji : stepIdx + 1}
      </div>
      <span
        className="text-sm font-bold"
        style={{
          fontFamily: 'var(--font-headline)',
          color: done ? 'var(--color-on-surface)' : 'var(--color-tertiary)',
        }}
      >
        {label}
      </span>
      {active && <LivePulse color="#3b5bdb" />}
    </div>
  )
}

export default function OrderTrackerPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [simulatedStatus, setSimulatedStatus] = useState(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      // 1. Check local order cache
      const cached = localStorage.getItem(`byte-order-${orderId}`)
      if (cached) {
        return JSON.parse(cached)
      }

      // 2. Query Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, is_veg))')
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    },
  })

  // Simulated live kitchen progression if order is local/demo
  useEffect(() => {
    if (order && !simulatedStatus) {
      setSimulatedStatus(order.status)

      // Automatically advance status for demo experience
      const t1 = setTimeout(() => {
        setSimulatedStatus('preparing')
      }, 3500)

      const t2 = setTimeout(() => {
        setSimulatedStatus('ready')
      }, 8500)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [order])

  // Real-time subscription for Supabase orders
  useEffect(() => {
    if (!orderId?.startsWith('order-')) {
      const sub = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] })
          }
        )
        .subscribe()
      return () => supabase.removeChannel(sub)
    }
  }, [orderId, queryClient])

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
        <Navbar />
        <div className="flex justify-center py-32"><Spinner size={40} /></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
        <Navbar />
        <div className="text-center py-32">
          <p className="text-4xl mb-4">❌</p>
          <p className="font-headline text-xl font-black uppercase">Order not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 btn-brutal px-6 py-2.5 bg-[#c8ff00] text-[#121316] rounded font-black text-xs"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Go to Menu
          </button>
        </div>
      </div>
    )
  }

  const currentStatus = simulatedStatus || order.status
  const isReady = currentStatus === 'ready'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Token Card — Boarding Pass Neo-Brutalist format */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1.5px solid #121316', boxShadow: '6px 6px 0px #121316' }}
        >
          {/* Top section */}
          <div
            className="p-6 flex flex-col gap-4 transition-colors duration-500"
            style={{ background: isReady ? '#c8ff00' : '#121316', color: isReady ? '#121316' : 'white' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-60 mb-1">
                  BYTE CANTEEN · DBIT CAMPUS
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Pickup Token
                </p>
                <p
                  className="font-black leading-none mt-2"
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '72px',
                    letterSpacing: '-0.05em',
                    color: isReady ? '#121316' : '#c8ff00',
                  }}
                >
                  {order.token_number}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge color={currentStatus === 'ready' ? 'lime' : currentStatus === 'preparing' ? 'cobalt' : 'default'}>
                  {getOrderStatusLabel(currentStatus)}
                </Badge>
                {isReady && (
                  <div className="flex items-center gap-2 mt-2 bg-[#121316] text-[#c8ff00] px-3 py-1 rounded">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8ff00] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c8ff00]" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest">Collect at {order.pickup_bay}</span>
                  </div>
                )}
              </div>
            </div>

            {order.estimated_ready_at && (
              <div className="flex items-center gap-2 text-sm opacity-80">
                <span>⏱️</span>
                <span>Est. Pickup: <strong>{formatTime(order.estimated_ready_at)}</strong></span>
              </div>
            )}
          </div>

          {/* Ticket divider with punch holes */}
          <div className="relative flex items-center" style={{ background: '#faf9f4', borderTop: '1.5px dashed #121316' }}>
            <div className="absolute -left-3 w-6 h-6 rounded-full" style={{ background: 'var(--color-surface)', border: '1.5px solid #121316' }} />
            <div className="absolute -right-3 w-6 h-6 rounded-full" style={{ background: 'var(--color-surface)', border: '1.5px solid #121316' }} />
          </div>

          {/* Bottom section */}
          <div className="p-6 flex flex-col gap-3" style={{ background: 'white' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface-variant)' }}>
                Order Items
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface-variant)' }}>
                Total: {formatPrice(order.total_amount)}
              </span>
            </div>
            {order.order_items?.map((oi) => (
              <div key={oi.id} className="flex items-center justify-between text-sm">
                <span>{oi.name} × {oi.quantity}</span>
                <span className="font-bold" style={{ fontFamily: 'var(--font-headline)' }}>{formatPrice(oi.subtotal || oi.price * oi.quantity)}</span>
              </div>
            ))}
            <div className="text-[11px] mt-1" style={{ color: 'var(--color-tertiary)' }}>
              Placed at {formatTime(order.created_at)} · {order.payment_method?.toUpperCase()} · {order.pickup_bay}
            </div>
          </div>
        </div>

        {/* Progress tracker */}
        {currentStatus !== 'cancelled' && (
          <div className="brutal-card bg-white rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-sm font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-headline)' }}>
              Live Kitchen Progress <LivePulse color={isReady ? '#c8ff00' : '#3b5bdb'} />
            </h2>
            <div className="flex flex-col gap-4">
              {STATUS_STEPS.map((step) => (
                <ProgressStep key={step} step={step} currentStatus={currentStatus} />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="btn-brutal py-3 bg-white text-[#121316] rounded text-sm text-center"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          ← Order More Food
        </button>
      </div>
    </div>
  )
}
