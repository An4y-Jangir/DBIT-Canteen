import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  animating: false,
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('byte-canteen-theme') || 'light'
  })
  const [animating, setAnimating] = useState(false)
  const [ripple, setRipple] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('byte-canteen-theme', theme)
  }, [theme])

  const toggleTheme = (e) => {
    if (animating) return

    let x = window.innerWidth - 60
    let y = 30

    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }

    const nextTheme = theme === 'light' ? 'dark' : 'light'
    const targetColor = nextTheme === 'dark' ? '#0e0f12' : '#faf9f4'

    // Compute furthest corner distance to guarantee 100% viewport coverage
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    setRipple({ x, y, maxRadius, targetColor, nextTheme })
    setAnimating(true)

    // Switch theme class right as screen is covered (at 380ms) without interrupting animation
    setTimeout(() => {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
      setTheme(nextTheme)
    }, 380)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, animating }}>
      {children}

      {/* GPU-Accelerated Liquid Ink Ripple Overlay */}
      <AnimatePresence>
        {animating && ripple && (
          <div
            key="liquid-ink-ripple-container"
            className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden"
          >
            {/* Pure GPU-composited circular ink droplet */}
            <motion.div
              style={{
                position: 'absolute',
                left: ripple.x - 24,
                top: ripple.y - 24,
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: ripple.targetColor,
                willChange: 'transform, opacity',
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                // 1. Pop up & energetic bounce on the spot (0ms - 280ms)
                // 2. Rapid liquid expansion across full screen (280ms - 580ms)
                // 3. Crisp fade dissolve (580ms - 720ms)
                scale: [
                  0,
                  1.35,
                  0.88,
                  1.12,
                  1,
                  (ripple.maxRadius / 22) * 1.08,
                  (ripple.maxRadius / 22) * 1.08,
                ],
                opacity: [1, 1, 1, 1, 1, 1, 0],
              }}
              transition={{
                duration: 0.72,
                times: [0, 0.14, 0.24, 0.34, 0.42, 0.82, 1.0],
                ease: 'easeInOut',
              }}
              onAnimationComplete={() => {
                setAnimating(false)
                setRipple(null)
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
