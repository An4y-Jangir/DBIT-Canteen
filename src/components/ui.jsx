import React from 'react'
import { cn } from '../lib/utils'

const C = 'var(--color-obsidian)'
const baseCard = 'bg-white rounded'

export function Card({ children, className, hover = true, ...props }) {
  return (
    <div
      className={cn(baseCard, hover && 'brutal-card', className)}
      style={!hover ? { border: `1.5px solid ${C}`, boxShadow: '4px 4px 0px #121316' } : {}}
      {...props}
    >
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  as: Tag = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-[#c8ff00] text-[#121316] hover:bg-[#c0f500]',
    secondary: 'bg-[#121316] text-white hover:bg-[#30312e]',
    outline: 'bg-white text-[#121316] hover:bg-[#f5f4ef]',
    ghost: 'bg-transparent text-[#121316] border-transparent shadow-none hover:bg-[#efeee9]',
    danger: 'bg-[#ffdad6] text-[#93000a] hover:bg-[#ba1a1a] hover:text-white',
  }
  const sizes = {
    xs: 'px-2 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2.5 text-[13px]',
    lg: 'px-6 py-3 text-[14px]',
    xl: 'px-8 py-4 text-[16px]',
  }

  return (
    <Tag
      className={cn(
        'btn-brutal inline-flex items-center justify-center gap-2 rounded',
        variant !== 'ghost' && 'border border-[#121316]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function Badge({ children, color = 'default', className }) {
  const colors = {
    default: 'bg-[#efeee9] text-[#434933]',
    lime: 'bg-[#c8ff00] text-[#121316]',
    cobalt: 'bg-[#4b69ea] text-white',
    veg: 'bg-white text-[#059669] border border-[#059669]',
    'non-veg': 'bg-white text-[#dc2626] border border-[#dc2626]',
    pending: 'bg-[#f59e0b] text-[#121316]',
    ready: 'bg-[#c8ff00] text-[#121316]',
    preparing: 'bg-[#4b69ea] text-white',
    cancelled: 'bg-[#ffdad6] text-[#93000a]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-[10px] font-black uppercase tracking-[0.08em]',
        'border border-[#121316]',
        'shadow-[2px_2px_0px_#121316]',
        colors[color] ?? colors.default,
        className
      )}
    >
      {children}
    </span>
  )
}

export function DietBadge({ isVeg }) {
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-sm"
      style={{
        border: `1.5px solid ${isVeg ? '#059669' : '#dc2626'}`,
        background: 'white',
      }}
      title={isVeg ? 'Pure Veg' : 'Non-Veg'}
    >
      <span
        className={isVeg ? 'rounded-full' : ''}
        style={{
          width: 8,
          height: 8,
          background: isVeg ? '#059669' : '#dc2626',
          clipPath: isVeg ? 'circle()' : 'polygon(50% 0%, 0% 100%, 100% 100%)',
          display: 'block',
        }}
      />
    </span>
  )
}

export function Spinner({ size = 24 }) {
  return (
    <div
      className="animate-spin rounded-full border-4"
      style={{
        width: size,
        height: size,
        borderColor: '#c8ff00',
        borderTopColor: 'transparent',
      }}
    />
  )
}

export function LivePulse({ label, color = '#c8ff00' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: color }}
        />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
      </span>
      {label && (
        <span className="text-[10px] font-black uppercase tracking-[0.08em]">{label}</span>
      )}
    </span>
  )
}
