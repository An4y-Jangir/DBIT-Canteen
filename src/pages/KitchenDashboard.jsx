import React, { useEffect, useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Badge, LivePulse, Spinner } from '../components/ui'
import { getOrderStatusLabel, formatPrice, formatTime } from '../lib/utils'
import { DEFAULT_CATEGORIES, DEFAULT_MENU_ITEMS } from '../lib/mockData'
import {
  getMenuItems,
  updateMenuItem,
  addMenuItem,
  deleteMenuItem,
  resetMenuToDefaults,
} from '../lib/menuService'
import toast from 'react-hot-toast'
import {
  ChefHat,
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  RotateCcw,
  Clock,
  Flame,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react'

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

const DEMO_ORDERS = [
  {
    id: 'demo-ord-1',
    token_number: '#A-42',
    status: 'preparing',
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    total_amount: 110,
    special_instructions: 'Extra spicy chutney, please',
    order_items: [
      { id: 'doi-1', name: 'Crispy Paneer Byte Roll', quantity: 1, subtotal: 85 },
      { id: 'doi-2', name: 'Mumbai Vada Pav', quantity: 1, subtotal: 25 },
    ],
  },
  {
    id: 'demo-ord-2',
    token_number: '#B-19',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    total_amount: 120,
    special_instructions: null,
    order_items: [
      { id: 'doi-3', name: 'Dum Chicken Biryani', quantity: 1, subtotal: 120 },
    ],
  },
  {
    id: 'demo-ord-3',
    token_number: '#C-08',
    status: 'ready',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    total_amount: 55,
    special_instructions: 'Less sugar in chai',
    order_items: [
      { id: 'doi-4', name: 'Special Masala Chai', quantity: 1, subtotal: 15 },
      { id: 'doi-5', name: 'Thick Cold Coffee', quantity: 1, subtotal: 40 },
    ],
  },
]

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

  // Top-level tab: 'orders' | 'menu'
  const [activeTab, setActiveTab] = useState('orders')
  const [orderFilter, setOrderFilter] = useState('active')

  // Menu Manager State
  const [menuSearch, setMenuSearch] = useState('')
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('all')
  const [editingPriceId, setEditingPriceId] = useState(null)
  const [tempPrice, setTempPrice] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Add Item Form State
  const [newDish, setNewDish] = useState({
    name: '',
    category_id: 'cat-snacks',
    price: 50,
    mrp: 60,
    is_veg: true,
    prep_time_minutes: 8,
    stock_count: 30,
    description: '',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  })

  // 1. Fetch Orders with fallback to demo orders
  const { data: orders = DEMO_ORDERS, isLoading: ordersLoading } = useQuery({
    queryKey: ['kitchen-orders', orderFilter],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_ORDERS
      try {
        let q = supabase
          .from('orders')
          .select('*, order_items(id, name, quantity, subtotal)')
          .order('created_at', { ascending: true })

        if (orderFilter === 'active') {
          q = q.in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        } else if (orderFilter === 'done') {
          q = q.in('status', ['picked_up', 'cancelled'])
        }

        const { data, error } = await q
        if (error || !data || data.length === 0) return DEMO_ORDERS
        return data
      } catch (e) {
        return DEMO_ORDERS
      }
    },
    refetchInterval: 10000,
  })

  // 2. Fetch Menu Items (Unified)
  const { data: menuItems = DEFAULT_MENU_ITEMS, isLoading: menuLoading } = useQuery({
    queryKey: ['kitchen-menu-items'],
    queryFn: getMenuItems,
    staleTime: 1000 * 5,
  })

  // Real-time subscription for orders
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const sub = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
        toast('🔔 New order received at Counter #2!', { duration: 2500 })
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [queryClient])

  // Order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    if (isSupabaseConfigured) {
      const updates = { status: newStatus }
      if (newStatus === 'ready') updates.ready_at = new Date().toISOString()
      if (newStatus === 'picked_up') updates.picked_up_at = new Date().toISOString()

      const { error } = await supabase.from('orders').update(updates).eq('id', orderId)
      if (error) {
        toast.error('Failed to update order status')
        return
      }
    }
    toast.success(`Order → ${getOrderStatusLabel(newStatus)}`)
    queryClient.setQueryData(['kitchen-orders', orderFilter], (prev) =>
      prev ? prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)) : []
    )
    queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
  }

  // Stock / Availability toggle
  const handleToggleAvailability = async (item) => {
    const nextState = !item.is_available
    await updateMenuItem(item.id, { is_available: nextState })
    toast.success(`${item.name} is now ${nextState ? '🟢 IN STOCK' : '🔴 SOLD OUT'}`)
    queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] })
    queryClient.invalidateQueries({ queryKey: ['menu_items_raw'] })
  }

  // Stock count adjustment
  const handleAdjustStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stock_count || 0) + delta)
    const isNowAvailable = newStock > 0 ? item.is_available : false
    await updateMenuItem(item.id, {
      stock_count: newStock,
      is_available: isNowAvailable,
    })
    queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] })
    queryClient.invalidateQueries({ queryKey: ['menu_items_raw'] })
  }

  // Price save
  const handleSavePrice = async (itemId) => {
    const parsed = parseFloat(tempPrice)
    if (!isNaN(parsed) && parsed > 0) {
      await updateMenuItem(itemId, { price: parsed })
      toast.success('Price updated to ' + formatPrice(parsed))
      queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] })
      queryClient.invalidateQueries({ queryKey: ['menu_items_raw'] })
    }
    setEditingPriceId(null)
    setTempPrice('')
  }

  // Delete dish
  const handleDeleteDish = async (itemId, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from today's menu?`)) {
      await deleteMenuItem(itemId)
      toast.success(`Removed "${name}" from menu`)
      queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] })
      queryClient.invalidateQueries({ queryKey: ['menu_items_raw'] })
    }
  }

  // Add new dish
  const handleAddNewDish = async (e) => {
    e.preventDefault()
    if (!newDish.name.trim()) {
      toast.error('Dish name is required')
      return
    }

    const categoryObj = DEFAULT_CATEGORIES.find((c) => c.id === newDish.category_id) || {
      slug: 'snacks',
      name: 'Snacks',
    }

    await addMenuItem({
      ...newDish,
      category: categoryObj,
      price: Number(newDish.price),
      mrp: Number(newDish.mrp || newDish.price),
      stock_count: Number(newDish.stock_count),
      prep_time_minutes: Number(newDish.prep_time_minutes),
    })

    toast.success(`Added "${newDish.name}" to cafeteria menu! 🍲`)
    setShowAddModal(false)
    setNewDish({
      name: '',
      category_id: 'cat-snacks',
      price: 50,
      mrp: 60,
      is_veg: true,
      prep_time_minutes: 8,
      stock_count: 30,
      description: '',
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    })
    queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] })
    queryClient.invalidateQueries({ queryKey: ['menu_items_raw'] })
  }

  // Reset menu
  const handleResetMenu = () => {
    if (window.confirm('Reset all menu items, prices, and stock overrides back to campus defaults?')) {
      resetMenuToDefaults()
      toast.success('Menu restored to default DBIT cafeteria catalog')
      queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] })
      queryClient.invalidateQueries({ queryKey: ['menu_items_raw'] })
    }
  }

  // Filtered menu list
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((it) => {
      const matchesSearch =
        it.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        (it.description && it.description.toLowerCase().includes(menuSearch.toLowerCase()))
      const matchesCat =
        menuCategoryFilter === 'all' ||
        it.category_id === `cat-${menuCategoryFilter}` ||
        it.category?.slug === menuCategoryFilter
      return matchesSearch && matchesCat
    })
  }, [menuItems, menuSearch, menuCategoryFilter])

  // Stats calculation
  const stats = {
    pending: orders?.filter((o) => o.status === 'pending').length ?? 0,
    preparing: orders?.filter((o) => o.status === 'preparing').length ?? 0,
    ready: orders?.filter((o) => o.status === 'ready').length ?? 0,
    total: orders?.length ?? 0,
    menuTotal: menuItems.length,
    menuInStock: menuItems.filter((i) => i.is_available).length,
    menuSoldOut: menuItems.filter((i) => !i.is_available).length,
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[#c8ff00] text-[#121316] border border-[#121316]">
                Kitchen Node · Bay #02
              </span>
              <LivePulse label="Active Shift" color="#c8ff00" />
            </div>
            <h1
              className="text-3xl font-black uppercase tracking-tight flex items-center gap-3 text-white"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              👨‍🍳 Kitchen Console & Menu Manager
            </h1>
            <p className="text-xs text-[#a0a5b2] mt-0.5">
              Live DBIT Canteen Operations: update inventory, manage pending tickets, and control item availability.
            </p>
          </div>

          {/* MAIN TAB SWITCHER: ORDERS vs MENU */}
          <div
            className="flex p-1 rounded-lg gap-1 self-start md:self-auto"
            style={{
              background: '#1c1d24',
              border: '1.5px solid #383a46',
              boxShadow: '3px 3px 0px #000000',
            }}
          >
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#c8ff00] text-[#121316]'
                  : 'text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              <Flame size={14} />
              <span>Live Orders ({stats.pending + stats.preparing})</span>
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#c8ff00] text-[#121316]'
                  : 'text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              <UtensilsCrossed size={14} />
              <span>Menu & Stock Editor ({stats.menuTotal})</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: LIVE ORDERS QUEUE                                */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter Sub-Tabs & Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex gap-2">
                {[
                  ['active', 'Active Orders'],
                  ['done', 'Completed / Picked Up'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setOrderFilter(key)}
                    className="px-4 py-2 rounded text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
                    style={{
                      fontFamily: 'var(--font-headline)',
                      background: orderFilter === key ? '#121316' : 'white',
                      color: orderFilter === key ? '#c8ff00' : '#121316',
                      border: '1.5px solid #121316',
                      boxShadow: '2px 2px 0px #121316',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-[#5e5e62] font-semibold">
                Auto-refreshing every 10s • WebSocket stream online
              </div>
            </div>

            {/* Orders Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                ['🕐 Pending Confirmation', stats.pending, '#f59e0b'],
                ['🔥 In Preparation', stats.preparing, '#3b5bdb'],
                ['✅ Ready at Bay #02', stats.ready, '#c8ff00'],
                ['📦 Total Processed', stats.total, '#121316'],
              ].map(([label, count, color]) => (
                <div
                  key={label}
                  className="bg-white rounded-lg p-3 flex flex-col"
                  style={{ border: '1.5px solid #121316', boxShadow: '3px 3px 0px #121316' }}
                >
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface-variant)' }}
                  >
                    {label}
                  </span>
                  <span
                    className="text-3xl font-black mt-1"
                    style={{ fontFamily: 'var(--font-headline)', color }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* Orders Grid */}
            {ordersLoading ? (
              <div className="flex justify-center py-20">
                <Spinner size={40} />
              </div>
            ) : orders?.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border-[1.5px] border-[#121316] shadow-[4px_4px_0px_#121316]">
                <p className="text-5xl mb-4">🎉</p>
                <p className="font-headline text-xl font-black uppercase">All Orders Clear!</p>
                <p className="text-sm mt-1 text-[#5e5e62]">
                  No {orderFilter === 'active' ? 'active' : 'completed'} orders at this station.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: MENU & STOCK MANAGER                            */}
        {/* ======================================================== */}
        {activeTab === 'menu' && (
          <div>
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="relative flex items-center bg-white rounded-lg px-3 py-2 w-64"
                  style={{ border: '1.5px solid #121316', boxShadow: '2px 2px 0px #121316' }}
                >
                  <Search size={16} className="text-[#5e5e62] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search dishes to edit..."
                    className="w-full bg-transparent text-xs font-semibold outline-none text-[#121316]"
                  />
                  {menuSearch && (
                    <button onClick={() => setMenuSearch('')} className="text-[#5e5e62] hover:text-[#121316]">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setMenuCategoryFilter(cat.slug)}
                      className={`px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                        menuCategoryFilter === cat.slug
                          ? 'bg-[#121316] text-[#c8ff00]'
                          : 'bg-white text-[#121316] hover:bg-[#eae9e4]'
                      }`}
                      style={{
                        border: '1.5px solid #121316',
                        boxShadow: '2px 2px 0px #121316',
                        fontFamily: 'var(--font-headline)',
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kitchen Actions: Add Dish & Reset */}
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-brutal px-4 py-2 bg-[#c8ff00] text-[#121316] rounded text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_#121316]"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  <Plus size={16} />
                  <span>Add New Dish</span>
                </button>

                <button
                  onClick={handleResetMenu}
                  title="Restore DBIT catalog defaults"
                  className="p-2 bg-white text-[#5e5e62] hover:text-[#121316] rounded border-[1.5px] border-[#121316] shadow-[2px_2px_0px_#121316] cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Menu Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div
                className="bg-white rounded-lg p-3 flex flex-col"
                style={{ border: '1.5px solid #121316', boxShadow: '3px 3px 0px #121316' }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5e5e62]" style={{ fontFamily: 'var(--font-headline)' }}>
                  Total Menu Items
                </span>
                <span className="text-2xl font-black mt-1 text-[#121316]" style={{ fontFamily: 'var(--font-headline)' }}>
                  {stats.menuTotal}
                </span>
              </div>

              <div
                className="bg-white rounded-lg p-3 flex flex-col"
                style={{ border: '1.5px solid #121316', boxShadow: '3px 3px 0px #121316' }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-[#059669]" style={{ fontFamily: 'var(--font-headline)' }}>
                  🟢 Available In Stock
                </span>
                <span className="text-2xl font-black mt-1 text-[#059669]" style={{ fontFamily: 'var(--font-headline)' }}>
                  {stats.menuInStock}
                </span>
              </div>

              <div
                className="bg-white rounded-lg p-3 flex flex-col"
                style={{ border: '1.5px solid #121316', boxShadow: '3px 3px 0px #121316' }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-[#dc2626]" style={{ fontFamily: 'var(--font-headline)' }}>
                  🔴 Marked Sold Out
                </span>
                <span className="text-2xl font-black mt-1 text-[#dc2626]" style={{ fontFamily: 'var(--font-headline)' }}>
                  {stats.menuSoldOut}
                </span>
              </div>

              <div
                className="bg-white rounded-lg p-3 flex flex-col"
                style={{ border: '1.5px solid #121316', boxShadow: '3px 3px 0px #121316' }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3b5bdb]" style={{ fontFamily: 'var(--font-headline)' }}>
                  Instant Sync Status
                </span>
                <span className="text-xs font-black mt-2 text-[#121316]" style={{ fontFamily: 'var(--font-headline)' }}>
                  ⚡ Real-Time Active
                </span>
              </div>
            </div>

            {/* Menu Items Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl overflow-hidden flex flex-col transition-all ${
                    !item.is_available ? 'opacity-85 bg-[#faf9f6]' : ''
                  }`}
                  style={{
                    border: '1.5px solid #121316',
                    boxShadow: '4px 4px 0px #121316',
                  }}
                >
                  {/* Top Thumbnail & Status */}
                  <div className="relative h-32 w-full bg-[#efeee9] overflow-hidden border-b-[1.5px] border-[#121316]">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Diet tag */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-white/95 text-[10px] font-black uppercase border border-[#121316]">
                      <span>{item.is_veg ? '🟢 VEG' : '🔴 NON-VEG'}</span>
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#121316] text-[#c8ff00] text-[10px] font-black uppercase">
                      {item.category?.name || 'Dish'}
                    </div>

                    {/* Sold out banner if disabled */}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-3 py-1 bg-[#ef4444] text-white text-xs font-black uppercase tracking-widest rounded border border-white">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className="font-black text-base text-[#121316] leading-snug"
                          style={{ fontFamily: 'var(--font-headline)' }}
                        >
                          {item.name}
                        </h3>
                        <button
                          onClick={() => handleDeleteDish(item.id, item.name)}
                          title="Remove dish"
                          className="text-[#9ca3af] hover:text-[#ef4444] p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="text-xs text-[#5e5e62] line-clamp-2 mb-3">
                        {item.description || 'Cafeteria prepared daily.'}
                      </p>
                    </div>

                    {/* Interactive Kitchen Controls */}
                    <div className="flex flex-col gap-3 pt-3 border-t border-[#e5e7eb]">
                      {/* Price row */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-[#5e5e62]">
                          Selling Price:
                        </span>

                        {editingPriceId === item.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold">₹</span>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              placeholder={item.price.toString()}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold border border-[#121316] rounded"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(item.id)}
                              className="p-1 bg-[#c8ff00] text-[#121316] rounded border border-[#121316] cursor-pointer"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 bg-gray-200 text-[#121316] rounded cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPriceId(item.id)
                              setTempPrice(item.price.toString())
                            }}
                            className="flex items-center gap-1 font-black text-sm text-[#121316] hover:text-[#3b5bdb] transition-colors cursor-pointer"
                            style={{ fontFamily: 'var(--font-headline)' }}
                            title="Click to edit price"
                          >
                            <span>{formatPrice(item.price)}</span>
                            <Edit2 size={11} className="text-[#6b7280]" />
                          </button>
                        )}
                      </div>

                      {/* Stock Portion Counter */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-[#5e5e62]">
                          Stock Units:
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(item, -5)}
                            className="w-6 h-6 rounded bg-[#f3f4f6] hover:bg-[#e5e7eb] font-bold text-xs flex items-center justify-center border border-[#121316] cursor-pointer"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item, -1)}
                            className="w-6 h-6 rounded bg-[#f3f4f6] hover:bg-[#e5e7eb] font-bold text-xs flex items-center justify-center border border-[#121316] cursor-pointer"
                          >
                            -1
                          </button>
                          <span
                            className="w-9 text-center font-black text-xs"
                            style={{ fontFamily: 'var(--font-headline)' }}
                          >
                            {item.stock_count || 0}
                          </span>
                          <button
                            onClick={() => handleAdjustStock(item, 1)}
                            className="w-6 h-6 rounded bg-[#f3f4f6] hover:bg-[#e5e7eb] font-bold text-xs flex items-center justify-center border border-[#121316] cursor-pointer"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item, 5)}
                            className="w-6 h-6 rounded bg-[#f3f4f6] hover:bg-[#e5e7eb] font-bold text-xs flex items-center justify-center border border-[#121316] cursor-pointer"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      {/* Big 1-Click Availability Toggle */}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`w-full py-2 px-3 rounded text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          item.is_available
                            ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-[2px_2px_0px_#121316]'
                            : 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-[2px_2px_0px_#121316]'
                        }`}
                        style={{
                          border: '1.5px solid #121316',
                          fontFamily: 'var(--font-headline)',
                        }}
                      >
                        {item.is_available ? (
                          <>
                            <PackageCheck size={14} />
                            <span>In Stock (Click to Mark Sold Out)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} />
                            <span>Sold Out (Click to Re-stock)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ADD NEW DISH                                      */}
        {/* ======================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
              style={{
                border: '2px solid #121316',
                boxShadow: '6px 6px 0px #121316',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
                <div>
                  <h2
                    className="text-xl font-black uppercase text-[#121316]"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    Add New Dish to Menu
                  </h2>
                  <p className="text-xs text-[#5e5e62]">
                    Updates live for students immediately across the DBIT campus.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded hover:bg-gray-100 text-[#121316] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddNewDish} className="flex flex-col gap-3">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#121316]">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    placeholder="e.g. Schezwan Fried Rice"
                    required
                    className="px-3 py-2 text-xs font-semibold rounded border-[1.5px] border-[#121316] outline-none"
                  />
                </div>

                {/* Category & Veg */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-[#121316]">
                      Category
                    </label>
                    <select
                      value={newDish.category_id}
                      onChange={(e) => setNewDish({ ...newDish, category_id: e.target.value })}
                      className="px-3 py-2 text-xs font-semibold rounded border-[1.5px] border-[#121316] outline-none bg-white"
                    >
                      {DEFAULT_CATEGORIES.filter((c) => c.slug !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-[#121316]">
                      Dietary Type
                    </label>
                    <div className="flex gap-2 h-full items-center">
                      <button
                        type="button"
                        onClick={() => setNewDish({ ...newDish, is_veg: true })}
                        className={`flex-1 py-2 text-xs font-black uppercase rounded border-[1.5px] border-[#121316] cursor-pointer ${
                          newDish.is_veg
                            ? 'bg-[#10b981] text-white shadow-[2px_2px_0px_#121316]'
                            : 'bg-white text-[#121316]'
                        }`}
                      >
                        🟢 Pure Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewDish({ ...newDish, is_veg: false })}
                        className={`flex-1 py-2 text-xs font-black uppercase rounded border-[1.5px] border-[#121316] cursor-pointer ${
                          !newDish.is_veg
                            ? 'bg-[#ef4444] text-white shadow-[2px_2px_0px_#121316]'
                            : 'bg-white text-[#121316]'
                        }`}
                      >
                        🔴 Non-Veg
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price, MRP, Prep, Stock */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-[#121316]">Price (₹) *</label>
                    <input
                      type="number"
                      value={newDish.price}
                      onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                      required
                      className="px-2 py-1.5 text-xs font-bold rounded border-[1.5px] border-[#121316]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-[#121316]">MRP (₹)</label>
                    <input
                      type="number"
                      value={newDish.mrp}
                      onChange={(e) => setNewDish({ ...newDish, mrp: e.target.value })}
                      className="px-2 py-1.5 text-xs font-bold rounded border-[1.5px] border-[#121316]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-[#121316]">Prep Time (m)</label>
                    <input
                      type="number"
                      value={newDish.prep_time_minutes}
                      onChange={(e) => setNewDish({ ...newDish, prep_time_minutes: e.target.value })}
                      className="px-2 py-1.5 text-xs font-bold rounded border-[1.5px] border-[#121316]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-[#121316]">Initial Stock</label>
                    <input
                      type="number"
                      value={newDish.stock_count}
                      onChange={(e) => setNewDish({ ...newDish, stock_count: e.target.value })}
                      className="px-2 py-1.5 text-xs font-bold rounded border-[1.5px] border-[#121316]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#121316]">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDish.description}
                    onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                    placeholder="Short ingredients or serving notes..."
                    className="px-3 py-2 text-xs font-semibold rounded border-[1.5px] border-[#121316] outline-none"
                  />
                </div>

                {/* Image URL & Presets */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#121316]">
                    Photo Image URL
                  </label>
                  <input
                    type="text"
                    value={newDish.image_url}
                    onChange={(e) => setNewDish({ ...newDish, image_url: e.target.value })}
                    className="px-3 py-2 text-xs font-semibold rounded border-[1.5px] border-[#121316] outline-none text-[#5e5e62]"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] text-[#5e5e62] font-semibold">Presets:</span>
                    {[
                      ['🌯 Roll', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80'],
                      ['🍛 Rice', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'],
                      ['☕ Beverage', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'],
                      ['🥪 Sandwich', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80'],
                    ].map(([title, url]) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setNewDish({ ...newDish, image_url: url })}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f3f4f6] hover:bg-[#e5e7eb] border border-gray-300 cursor-pointer"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded text-xs font-black uppercase border-[1.5px] border-[#121316] bg-[#f3f4f6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded text-xs font-black uppercase border-[1.5px] border-[#121316] bg-[#c8ff00] text-[#121316] shadow-[3px_3px_0px_#121316] cursor-pointer"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    Publish to Menu 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
