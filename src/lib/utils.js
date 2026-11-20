import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount) {
  return `₹${Number(amount).toFixed(0)}`
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function getOrderStatusColor(status) {
  const map = {
    pending: 'bg-pending text-obsidian',
    confirmed: 'bg-cobalt text-white',
    preparing: 'bg-secondary-container text-secondary',
    ready: 'bg-primary-container text-on-primary-container',
    picked_up: 'bg-surface-container-high text-on-surface-variant',
    cancelled: 'bg-error-container text-on-error-container',
  }
  return map[status] ?? 'bg-surface-container text-on-surface'
}

export function getOrderStatusLabel(status) {
  const map = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: '🔥 Preparing',
    ready: '✅ Ready for Pickup',
    picked_up: 'Picked Up',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}
