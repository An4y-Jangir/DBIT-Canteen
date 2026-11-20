import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem) => {
        const existing = get().items.find((i) => i.id === menuItem.id)
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }))
        } else {
          set((state) => ({
            items: [...state.items, { ...menuItem, quantity: 1 }],
          }))
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }))
      },

      decrementItem: (itemId) => {
        const item = get().items.find((i) => i.id === itemId)
        if (!item) return
        if (item.quantity <= 1) {
          get().removeItem(itemId)
        } else {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          }))
        }
      },

      clearCart: () => set({ items: [] }),

      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get totalPrice() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },
    }),
    { name: 'byte-canteen-cart' }
  )
)
