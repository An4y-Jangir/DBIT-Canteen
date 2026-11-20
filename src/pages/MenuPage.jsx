import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MenuItemCard from '../components/MenuItemCard'
import { LivePulse, Badge } from '../components/ui'
import { ShoppingCart, Search, ArrowUpDown, Check } from 'lucide-react'
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

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular', icon: '🔥' },
  { id: 'price-asc', label: 'Price: Low → High', icon: '₹' },
  { id: 'price-desc', label: 'Price: High → Low', icon: '🏷️' },
  { id: 'fastest', label: 'Fastest Prep', icon: '⏱️' },
]

export default function MenuPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [vegOnly, setVegOnly] = useState(false)

  // Instant render with placeholderData (0ms first paint)
  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    placeholderData: DEFAULT_CATEGORIES,
    staleTime: 1000 * 60 * 5,
  })

  const { data: allMenuItems = DEFAULT_MENU_ITEMS } = useQuery({
    queryKey: ['menu_items_raw'],
    queryFn: fetchMenuItems,
    placeholderData: DEFAULT_MENU_ITEMS,
    staleTime: 1000 * 60 * 5,
  })

  // Instant filtering and sorting
  const processedItems = useMemo(() => {
    let items = (allMenuItems || DEFAULT_MENU_ITEMS).slice()

    // 1. Category Filter
    if (activeCategory !== 'all') {
      items = items.filter(
        (item) =>
          item.category?.slug === activeCategory ||
          item.category_id === `cat-${activeCategory}`
      )
    }

    // 2. Pure Veg Filter
    if (vegOnly) {
      items = items.filter((item) => item.is_veg)
    }

    // 3. Search Term
    if (search.trim()) {
      const term = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term))
      )
    }

    // 4. Sorting Order
    items.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'fastest') return (a.prep_time_minutes ?? 10) - (b.prep_time_minutes ?? 10)
      if (sortBy === 'popular') {
        const aPop = a.tags?.includes('bestseller') || a.tags?.includes('chef-special') ? 1 : 0
        const bPop = b.tags?.includes('bestseller') || b.tags?.includes('chef-special') ? 1 : 0
        return bPop - aPop
      }
      return 0
    })

    return items
  }, [allMenuItems, activeCategory, vegOnly, search, sortBy])

  const cartItems = useCartStore((s) => s.items)
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}
    >
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Main Menu Feed */}
        <main className="flex-1 min-w-0">
          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          >
            <div>
              <h1
                className="text-2xl font-black uppercase tracking-tight flex items-center gap-3"
                style={{
                  fontFamily: 'var(--font-headline)',
                  color: 'var(--color-text-title)',
                }}
              >
                Live Menu <LivePulse label="Kitchen Open" color="#c8ff00" />
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                DBIT Main Cafeteria • Floor 1 • Counter #2
              </p>
            </div>

            {/* Search Input */}
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
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-surface-container)',
                  border: '1.5px solid var(--color-card-border)',
                  color: 'var(--color-on-surface)',
                }}
              />
            </div>
          </motion.div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            {categories.map((cat) => {
              const active = activeCategory === cat.slug
              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-headline)',
                    background: active
                      ? 'var(--color-card-border, #121316)'
                      : 'var(--color-card-bg, #ffffff)',
                    color: active ? '#c8ff00' : 'var(--color-on-surface)',
                    border: '1.5px solid var(--color-card-border)',
                    boxShadow: active
                      ? '3px 3px 0px var(--color-card-shadow)'
                      : '2px 2px 0px var(--color-card-shadow)',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>

          {/* Interactive Sorting & Veg Toggle Toolbar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg mb-6 transition-colors"
            style={{
              background: 'var(--color-toolbar-bg)',
              border: '1.5px solid var(--color-card-border)',
            }}
          >
            {/* Sort Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[10px] font-black uppercase tracking-wider mr-1 flex items-center gap-1"
                style={{ color: 'var(--color-text-dim)' }}
              >
                <ArrowUpDown size={12} />
                <span>Sort by:</span>
              </span>

              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className="px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-headline)',
                      background: isSelected
                        ? 'var(--color-card-border, #121316)'
                        : 'var(--color-card-bg, #faf9f4)',
                      color: isSelected ? '#c8ff00' : 'var(--color-on-surface)',
                      border: `1px solid ${
                        isSelected ? 'var(--color-card-border)' : 'var(--color-card-border)'
                      }`,
                      boxShadow: isSelected
                        ? '2px 2px 0px var(--color-card-shadow)'
                        : 'none',
                    }}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Veg Only Switch */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className="px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              style={{
                background: vegOnly ? '#059669' : 'var(--color-card-bg)',
                color: vegOnly ? '#ffffff' : '#059669',
                border: '1.5px solid #059669',
                boxShadow: vegOnly ? '2px 2px 0px var(--color-card-shadow)' : 'none',
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: vegOnly ? '#ffffff' : '#059669' }}
              />
              <span>Veg Only</span>
              {vegOnly && <Check size={12} />}
            </button>
          </div>

          {/* Menu Items Grid: Clean scroll fade-in WITHOUT position morphing */}
          <div className="min-h-[300px]">
            {processedItems.length === 0 ? (
              <div className="text-center py-20 text-[#747a60]">
                <p className="text-4xl mb-3">🍽️</p>
                <p
                  className="font-headline text-lg uppercase font-bold"
                  style={{ color: 'var(--color-text-title)' }}
                >
                  No dishes found
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all')
                    setSearch('')
                    setVegOnly(false)
                    setSortBy('popular')
                  }}
                  className="mt-3 btn-brutal px-4 py-2 bg-[#c8ff00] text-[#121316] text-xs font-black rounded cursor-pointer"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedItems.map((item, index) => (
                  <MenuItemCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Cart Summary (Desktop) */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.aside
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className="hidden lg:flex flex-col w-72 flex-shrink-0"
            >
              <div
                className="sticky top-20 brutal-card rounded-lg p-4 flex flex-col gap-3"
                style={{
                  background: 'var(--color-card-bg)',
                  border: '1.5px solid var(--color-card-border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-black uppercase tracking-widest"
                    style={{
                      fontFamily: 'var(--font-headline)',
                      color: 'var(--color-text-title)',
                    }}
                  >
                    Your Order
                  </span>
                  <Badge color="cobalt">{totalItems} items</Badge>
                </div>

                <div className="divide-y divide-[var(--color-surface-container-high)] max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <span
                        className="text-xs flex-1 truncate"
                        style={{ color: 'var(--color-text-title)' }}
                      >
                        {item.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--color-text-dim)' }}
                      >
                        ×{item.quantity}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          fontFamily: 'var(--font-headline)',
                          color: 'var(--color-text-title)',
                        }}
                      >
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: '1.5px solid var(--color-card-border)' }}
                >
                  <span
                    className="text-sm font-black uppercase"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    Total
                  </span>
                  <span
                    className="text-lg font-black text-[#4f6600] dark:text-[#c8ff00]"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/checkout')}
                  className="btn-brutal w-full py-3 bg-[#c8ff00] text-[#121316] rounded text-sm flex items-center justify-center gap-2 font-black cursor-pointer shadow-[3px_3px_0px_var(--color-card-shadow)]"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  <ShoppingCart size={16} /> Checkout →
                </motion.button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-40"
            style={{ background: 'var(--color-surface)' }}
          >
            <button
              onClick={() => navigate('/checkout')}
              className="btn-brutal w-full py-3.5 bg-[#c8ff00] text-[#121316] rounded text-sm flex items-center justify-between px-4 font-black shadow-[4px_4px_0px_#121316] cursor-pointer"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              <Badge color="cobalt">{totalItems} items</Badge>
              <span>Proceed to Checkout</span>
              <span className="font-black">{formatPrice(totalPrice)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
