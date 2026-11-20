import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingCart, ChefHat, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useTheme } from '../context/ThemeContext'
import { LivePulse } from './ui'
import toast from 'react-hot-toast'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const signOut = useAuthStore((s) => s.signOut)
  const profile = useAuthStore((s) => s.profile)
  const isKitchenStaff = useAuthStore((s) => s.isKitchenStaff)()
  const items = useCartStore((s) => s.items)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const { theme, toggleTheme, animating } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out!')
    navigate('/login')
  }

  return (
    <header
      style={{
        borderBottom: '1.5px solid var(--color-card-border, #121316)',
        background: '#121316',
      }}
      className="sticky top-0 z-50 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <span
            className="font-black text-lg uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: '#c8ff00' }}
          >
            BYTE <span className="text-white">//</span> CANTEEN
          </span>
          <LivePulse />
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => navigate('/')}
            className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${
              location.pathname === '/'
                ? 'bg-[#c8ff00] text-[#121316]'
                : 'text-white hover:bg-white/10'
            }`}
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Menu
          </button>
          {isKitchenStaff && (
            <button
              onClick={() => navigate('/kitchen')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${
                location.pathname === '/kitchen'
                  ? 'bg-[#c8ff00] text-[#121316]'
                  : 'text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              <ChefHat size={14} /> Kitchen
            </button>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Moon / Sun Liquid Flow Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            onClick={toggleTheme}
            disabled={animating}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="btn-brutal relative p-2 bg-[#1c1d24] hover:bg-[#282a34] rounded flex items-center justify-center transition-all cursor-pointer overflow-hidden"
            style={{
              border: '1.5px solid #383a46',
              boxShadow: '2px 2px 0px #000000',
              width: 36,
              height: 36,
            }}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.span
                  key="sun-icon"
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ rotate: 90, scale: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-base leading-none select-none"
                >
                  ☀️
                </motion.span>
              ) : (
                <motion.span
                  key="moon-icon"
                  initial={{ rotate: 90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ rotate: -90, scale: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-base leading-none select-none"
                >
                  🌙
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Cart */}
          <button
            onClick={() => navigate('/checkout')}
            className="relative flex items-center gap-2 btn-brutal px-3 py-1.5 bg-[#c8ff00] text-[#121316] rounded text-xs cursor-pointer"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#3b5bdb] text-white text-[10px] font-black flex items-center justify-center border border-[#121316]">
                {totalItems}
              </span>
            )}
          </button>

          {/* Profile & sign out */}
          {profile && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-white/60 max-w-[120px] truncate">
                {profile.full_name ?? profile.email}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
