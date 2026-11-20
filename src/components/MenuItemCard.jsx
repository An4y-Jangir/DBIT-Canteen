import React, { useState } from 'react'
import { DietBadge, Badge, Button } from './ui'
import { Plus, Minus, Clock } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { formatPrice } from '../lib/utils'

export default function MenuItemCard({ item }) {
  const addItem = useCartStore((s) => s.addItem)
  const decrementItem = useCartStore((s) => s.decrementItem)
  const cartItems = useCartStore((s) => s.items)
  const cartItem = cartItems.find((i) => i.id === item.id)
  const qty = cartItem?.quantity ?? 0

  return (
    <div className="brutal-card bg-white rounded flex flex-col overflow-hidden">
      {/* Image */}
      {item.image_url ? (
        <div className="relative h-36 overflow-hidden" style={{ borderBottom: '1.5px solid #121316' }}>
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <DietBadge isVeg={item.is_veg} />
          </div>
          {item.stock_count <= 10 && item.stock_count > 0 && (
            <div className="absolute top-2 right-2">
              <Badge color="lime">Only {item.stock_count} left</Badge>
            </div>
          )}
        </div>
      ) : (
        <div
          className="h-24 flex items-center justify-center text-4xl"
          style={{ background: 'var(--color-surface-container)', borderBottom: '1.5px solid #121316' }}
        >
          {item.is_veg ? '🥗' : '🍗'}
        </div>
      )}

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {!item.image_url && <DietBadge isVeg={item.is_veg} />}
              {item.tags?.includes('chef-special') && <Badge color="cobalt">Chef Special</Badge>}
              {item.tags?.includes('bestseller') && <Badge color="lime">Bestseller</Badge>}
            </div>
            <h3
              className="text-sm font-bold leading-tight truncate"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-on-surface)' }}
            >
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-tertiary)' }}>
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Prep time */}
        <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>
          <Clock size={11} />
          <span>{item.prep_time_minutes} min prep</span>
        </div>

        {/* Price + Qty */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}
            >
              {formatPrice(item.price)}
            </span>
            {item.mrp && item.mrp > item.price && (
              <span className="text-xs line-through" style={{ color: 'var(--color-tertiary)' }}>
                {formatPrice(item.mrp)}
              </span>
            )}
          </div>

          {/* Quantity Stepper */}
          {!item.is_available || item.stock_count === 0 ? (
            <span className="text-xs font-bold uppercase text-[#ba1a1a]">Sold Out</span>
          ) : qty === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="btn-brutal px-3 py-1.5 bg-[#c8ff00] text-[#121316] rounded text-xs flex items-center gap-1"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              <Plus size={12} /> Add
            </button>
          ) : (
            <div
              className="flex items-stretch rounded overflow-hidden"
              style={{ border: '1.5px solid #121316', boxShadow: '2px 2px 0px #121316' }}
            >
              <button
                onClick={() => decrementItem(item.id)}
                className="w-8 flex items-center justify-center hover:bg-[#f5f4ef] transition-colors"
                style={{ borderRight: '1.5px solid #121316' }}
              >
                <Minus size={12} />
              </button>
              <span
                className="w-8 flex items-center justify-center text-sm font-bold"
                style={{ fontFamily: 'var(--font-headline)', background: 'white' }}
              >
                {qty}
              </span>
              <button
                onClick={() => addItem(item)}
                className="w-8 flex items-center justify-center bg-[#c8ff00] hover:bg-[#c0f500] transition-colors"
                style={{ borderLeft: '1.5px solid #121316' }}
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
