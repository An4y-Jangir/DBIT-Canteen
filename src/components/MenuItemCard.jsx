import React from 'react'
import { motion } from 'motion/react'
import { DietBadge, Badge } from './ui'
import { Plus, Minus, Clock } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { formatPrice } from '../lib/utils'

export default function MenuItemCard({ item, index = 0 }) {
  const addItem = useCartStore((s) => s.addItem)
  const decrementItem = useCartStore((s) => s.decrementItem)
  const cartItems = useCartStore((s) => s.items)
  const cartItem = cartItems.find((i) => i.id === item.id)
  const qty = cartItem?.quantity ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{
        duration: 0.35,
        delay: Math.min((index % 6) * 0.04, 0.2),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="brutal-card rounded flex flex-col overflow-hidden will-change-transform"
      style={{
        background: 'var(--color-card-bg)',
        border: '1.5px solid var(--color-card-border)',
      }}
    >
      {/* Image */}
      {item.image_url ? (
        <div
          className="relative h-36 overflow-hidden"
          style={{ borderBottom: '1.5px solid var(--color-card-border)' }}
        >
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <DietBadge isVeg={item.is_veg} />
          </div>
          {item.stock_count <= 10 && item.stock_count > 0 && item.is_available && (
            <div className="absolute top-2 right-2">
              <Badge color="lime">Only {item.stock_count} left</Badge>
            </div>
          )}
          {(!item.is_available || item.stock_count === 0) && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-2.5 py-1 bg-[#ef4444] text-white text-[11px] font-black uppercase tracking-wider rounded border border-white">
                Sold Out
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="h-24 flex items-center justify-center text-4xl"
          style={{
            background: 'var(--color-surface-container)',
            borderBottom: '1.5px solid var(--color-card-border)',
          }}
        >
          {item.is_veg ? '🥗' : '🍗'}
        </div>
      )}

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {!item.image_url && <DietBadge isVeg={item.is_veg} />}
              {item.tags?.includes('chef-special') && <Badge color="cobalt">Chef Special</Badge>}
              {item.tags?.includes('bestseller') && <Badge color="lime">Bestseller</Badge>}
            </div>
            <h3
              className="text-sm font-bold leading-tight truncate"
              style={{
                fontFamily: 'var(--font-headline)',
                color: 'var(--color-text-title)',
              }}
            >
              {item.name}
            </h3>
            {item.description && (
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Prep time */}
        <div
          className="flex items-center gap-1 text-[11px]"
          style={{ color: 'var(--color-text-dim)' }}
        >
          <Clock size={11} />
          <span>{item.prep_time_minutes} min prep</span>
        </div>

        {/* Price + Qty */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-lg font-black text-[#c8ff00] dark:text-[#c8ff00] text-stroke-sm"
              style={{
                fontFamily: 'var(--font-headline)',
                color: 'var(--color-primary-container, #c8ff00)',
                textShadow: '0 0 1px rgba(0,0,0,0.5)',
              }}
            >
              <span className="text-[#4f6600] dark:text-[#c8ff00]">
                {formatPrice(item.price)}
              </span>
            </span>
            {item.mrp && item.mrp > item.price && (
              <span
                className="text-xs line-through"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {formatPrice(item.mrp)}
              </span>
            )}
          </div>

          {/* Quantity Stepper */}
          {!item.is_available || item.stock_count === 0 ? (
            <span className="text-xs font-bold uppercase text-[#ba1a1a]">Sold Out</span>
          ) : qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => addItem(item)}
              className="btn-brutal px-3.5 py-1.5 bg-[#c8ff00] text-[#121316] rounded text-xs flex items-center gap-1 font-bold"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              <Plus size={13} /> Add
            </motion.button>
          ) : (
            <div
              className="flex items-stretch rounded overflow-hidden"
              style={{
                border: '1.5px solid var(--color-card-border)',
                boxShadow: '2px 2px 0px var(--color-card-shadow)',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => decrementItem(item.id)}
                className="w-8 flex items-center justify-center hover:bg-[#f5f4ef] dark:hover:bg-[#23252d] transition-colors"
                style={{
                  borderRight: '1.5px solid var(--color-card-border)',
                  background: 'var(--color-card-bg)',
                  color: 'var(--color-text-title)',
                }}
              >
                <Minus size={12} />
              </motion.button>
              <span
                className="w-8 flex items-center justify-center text-sm font-bold"
                style={{
                  fontFamily: 'var(--font-headline)',
                  background: 'var(--color-card-bg)',
                  color: 'var(--color-text-title)',
                }}
              >
                {qty}
              </span>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => addItem(item)}
                className="w-8 flex items-center justify-center bg-[#c8ff00] text-[#121316] hover:bg-[#c0f500] transition-colors"
                style={{ borderLeft: '1.5px solid var(--color-card-border)' }}
              >
                <Plus size={12} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
