import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Badge, LivePulse, Spinner } from '../components/ui'
import { getOrderStatusLabel, formatPrice, formatTime } from '../lib/utils'
import toast from 'react-hot-toast'

const STATUS_ACTIONS = {
  pending: { next: 'confirmed', label: 'Confirm Order', color: '#3b5bdb', textColor: 'white' },
  confirmed: { next: 'preparing', label: '🔥 Start Preparing', color: '#f59e0b', textColor: '#121316' },
  preparing: { next: 'ready', label: '✅ Mark Ready', color: '#c8ff00', textColor: '#121316' },
  ready: { next: 'picked_up', label: '📦 Mark Picked Up', color: '#efeee9', textColor: '#121316' },
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b5bdb',
  preparing: '#f59e0b',
  ready: '#c8ff00',
  picked_up: '#e3e3de',
  cancelled: '#ffdad6',
}

function OrderCard({ order, onStatusUpdate }) {
  const action = STATUS_ACTIONS[order.status]
  return (
    <div
      className="bg-white rounded-lg flex flex-col gap-0 overflow-hidden"
      style={{ border: '1.5px solid #121316', boxShadow: '4px 4px 0px #121316' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: STATUS_COLORS[order.status] ?? '#efeee9', borderBottom: '1.5px solid #121316' }}
      >
        <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-headline)', color: '#121316' }}>
          {order.token_number}
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-headline)' }}>
            {getOrderStatusLabel(order.status)}
          </span>
          <span className="text-[10px]" style={{ color: '#434933' }}>{formatTime(order.created_at)}</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 flex flex-col gap-1 flex-1">
        {order.order_items?.map((oi) => (
          <div key={oi.id} className="flex items-center justify-between text-xs">
            <span>{oi.name}</span>
            <span className="font-bold" style={{ fontFamily: 'var(--font-headline)' }}>×{oi.quantity}</span>
          </div>
        ))}
        <div className="text-xs mt-1 font-bold" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>
          Total: {formatPrice(order.total_amount)}
        </div>
        {order.special_instructions && (
          <div className="text-[11px] mt-1 p-2 rounded" style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
            📝 {order.special_instructions}
          </div>
        )}
      </div>

      {/* Action button */}
      {action && (
        <div style={{ borderTop: '1.5px solid #121316' }}>
          <button
            onClick={() => onStatusUpdate(order.id, action.next)}
            className="w-full py-2.5 text-xs font-black uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ background: action.color, color: action.textColor, fontFamily: 'var(--font-headline)' }}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}

export default function KitchenDashboard() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('active')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['kitchen-orders', filter],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, order_items(id, name, quantity, subtotal)')
        .order('created_at', { ascending: true })

      if (filter === 'active') {
        q = q.in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      } else if (filter === 'done') {
        q = q.in('status', ['picked_up', 'cancelled'])
      }

      const { data, error } = await q
      if (error) throw error
      return data
    },
    refetchInterval: 10000,
  })

  // Real-time subscription for kitchen
  useEffect(() => {
    const sub = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
        toast('🔔 New order update!', { duration: 2000 })
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [queryClient])

  const handleStatusUpdate = async (orderId, newStatus) => {
    const updates = { status: newStatus }
    if (newStatus === 'ready') updates.ready_at = new Date().toISOString()
    if (newStatus === 'picked_up') updates.picked_up_at = new Date().toISOString()

    const { error } = await supabase.from('orders').update(updates).eq('id', orderId)
    if (error) {
      toast.error('Failed to update order status')
    } else {
      toast.success(`Order → ${getOrderStatusLabel(newStatus)}`)
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
    }
  }

  const stats = {
    pending: orders?.filter((o) => o.status === 'pending').length ?? 0,
    preparing: orders?.filter((o) => o.status === 'preparing').length ?? 0,
    ready: orders?.filter((o) => o.status === 'ready').length ?? 0,
    total: orders?.length ?? 0,
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3" style={{ fontFamily: 'var(--font-headline)' }}>
              🍳 Kitchen Dashboard <LivePulse label="Live" color="#c8ff00" />
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
              DBIT Canteen · Counter #2 · Real-time Order Management
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {[['active', 'Active Orders'], ['done', 'Completed']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-4 py-2 rounded text-xs font-black uppercase tracking-widest"
                style={{
                  fontFamily: 'var(--font-headline)',
                  background: filter === key ? '#121316' : 'white',
                  color: filter === key ? '#c8ff00' : '#121316',
                  border: '1.5px solid #121316',
                  boxShadow: '2px 2px 0px #121316',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            ['🕐 Pending', stats.pending, '#f59e0b'],
            ['🔥 Preparing', stats.preparing, '#3b5bdb'],
            ['✅ Ready', stats.ready, '#c8ff00'],
            ['📦 Total Active', stats.total, '#121316'],
          ].map(([label, count, color]) => (
            <div
              key={label}
              className="bg-white rounded-lg p-3 flex flex-col"
              style={{ border: '1.5px solid #121316', boxShadow: '3px 3px 0px #121316' }}
            >
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface-variant)' }}>{label}</span>
              <span className="text-3xl font-black mt-1" style={{ fontFamily: 'var(--font-headline)', color }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Orders grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size={40} /></div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-headline text-xl font-black uppercase">All caught up!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-tertiary)' }}>No {filter === 'active' ? 'active' : 'completed'} orders right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
