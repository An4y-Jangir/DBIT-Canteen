import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MenuItemCard from '../components/MenuItemCard'
import { LivePulse, Badge } from '../components/ui'
import { ShoppingCart, Search } from 'lucide-react'
import { formatPrice } from '../lib/utils'
import { DEFAULT_CATEGORIES, DEFAULT_MENU_ITEMS } from '../lib/mockData'

// Fast timeout helper (races network request against 2.5s timer)
const withTimeout = (promise, ms = 2500) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), ms)
    ),
  ])

const fetchCategories = async () => {
  if (!isSupabaseConfigured) return DEFAULT_CATEGORIES
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
    )
    if (!error && data && data.length > 0) return data
  } catch (err) {
    console.warn('Categories fast-fallback:', err?.message)
  }
  return DEFAULT_CATEGORIES
}

const fetchMenuItems = async () => {
  if (!isSupabaseConfigured) return DEFAULT_MENU_ITEMS
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('menu_items')
        .select('*, category:categories(name, slug)')
        .order('sort_order')
    )
    if (!error && data && data.length > 0) return data
  } catch (err) {
    console.warn('Menu fast-fallback:', err?.message)
  }
  return DEFAULT_MENU_ITEMS
}

export default function MenuPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  // Instant render with placeholderData (0ms first paint!)
  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    placeholderData: DEFAULT_CATEGORIES,
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  const { data: allMenuItems = DEFAULT_MENU_ITEMS } = useQuery({
    queryKey: ['menu_items_raw'],
    queryFn: fetchMenuItems,
    placeholderData: DEFAULT_MENU_ITEMS,
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  // Instant client-side filtering (0ms lag when clicking category pills or typing search)
  const filteredItems = (allMenuItems || DEFAULT_MENU_ITEMS).filter((item) => {
    // 1. Category match
    const matchesCategory =
      activeCategory === 'all' ||
      item.category?.slug === activeCategory ||
      item.category_id === `cat-${activeCategory}`

    if (!matchesCategory) return false

    // 2. Search match
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    )
  })

  const items = useCartStore((s) => s.items)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface)' }}>
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1
                className="text-2xl font-black uppercase tracking-tight flex items-center gap-3"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                Live Menu <LivePulse label="Kitchen Open" color="#c8ff00" />
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                DBIT Main Cafeteria • Floor 1 • Counter #2
              </p>
            </div>

            {/* Search */}
            <div className="relative flex items-center w-full sm:w-72">
              <Search
                size={15}
                className="absolute left-3"
                style={{ color: 'var(--color-on-surface-variant)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search food, chai, rolls..."
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--color-surface-container)',
                  border: '1.5px solid var(--color-outline-variant)',
                  color: 'var(--color-on-surface)',
                }}
              />
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                style={{
                  fontFamily: 'var(--font-headline)',
                  background: activeCategory === cat.slug ? '#121316' : 'white',
                  color: activeCategory === cat.slug ? '#c8ff00' : '#121316',
                  border: '1.5px solid #121316',
                  boxShadow: '2px 2px 0px #121316',
                }}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-[#747a60]">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-headline text-lg uppercase font-bold">No dishes found</p>
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setSearch('')
                }}
                className="mt-3 btn-brutal px-4 py-2 bg-[#c8ff00] text-[#121316] text-xs font-black rounded"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </main>

        {/* Sidebar cart summary (desktop) */}
        {totalItems > 0 && (
          <aside className="hidden lg:flex flex-col w-72 flex-shrink-0">
            <div className="sticky top-20 brutal-card bg-white rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-black uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Your Order
                </span>
                <Badge color="cobalt">{totalItems} items</Badge>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
                {items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-[#747a60]">×{item.quantity}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: '1.5px solid #121316' }}
              >
                <span
                  className="text-sm font-black uppercase"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Total
                </span>
                <span
                  className="text-lg font-black"
                  style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}
                >
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="btn-brutal w-full py-3 bg-[#c8ff00] text-[#121316] rounded text-sm flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                <ShoppingCart size={16} /> Checkout →
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile sticky checkout bar */}
      {totalItems > 0 && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-40"
          style={{ background: 'var(--color-surface)' }}
        >
          <button
            onClick={() => navigate('/checkout')}
            className="btn-brutal w-full py-3.5 bg-[#c8ff00] text-[#121316] rounded text-sm flex items-center justify-between px-4"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            <Badge color="cobalt">{totalItems} items</Badge>
            <span>Proceed to Checkout</span>
            <span className="font-black">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
