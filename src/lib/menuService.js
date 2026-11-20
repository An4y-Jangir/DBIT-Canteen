import { supabase, isSupabaseConfigured } from './supabase'
import { DEFAULT_CATEGORIES, DEFAULT_MENU_ITEMS } from './mockData'

const LOCAL_STORAGE_KEY = 'byte-canteen-custom-menu-items'
const LOCAL_OVERRIDE_KEY = 'byte-canteen-item-overrides'

// Fast timeout helper
const withTimeout = (promise, ms = 2500) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), ms)
    ),
  ])

// Helper to get local overrides
export const getLocalOverrides = () => {
  try {
    const raw = localStorage.getItem(LOCAL_OVERRIDE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    console.warn('Failed to parse local overrides', e)
    return {}
  }
}

// Helper to get custom added items
export const getCustomAddedItems = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.warn('Failed to parse custom added items', e)
    return []
  }
}

// Fetch all menu items combining Supabase + Local additions & overrides
export const getMenuItems = async () => {
  const overrides = getLocalOverrides()
  const customItems = getCustomAddedItems()

  let baseItems = DEFAULT_MENU_ITEMS

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('menu_items')
          .select('*, category:categories(name, slug)')
          .order('sort_order')
      )
      if (!error && data && data.length > 0) {
        baseItems = data
      }
    } catch (err) {
      console.warn('Menu service fetch fallback:', err?.message)
    }
  }

  // Combine base items with custom items
  const allMap = new Map()
  for (const item of baseItems) {
    allMap.set(item.id, { ...item })
  }
  for (const custom of customItems) {
    allMap.set(custom.id, { ...custom })
  }

  // Apply overrides (e.g. stock count, is_available, price edits)
  const result = []
  for (const [id, item] of allMap.entries()) {
    if (overrides[id]) {
      if (overrides[id]._deleted) {
        continue // Marked deleted locally
      }
      result.push({ ...item, ...overrides[id] })
    } else {
      result.push(item)
    }
  }

  return result
}

// Update single item (available to kitchen staff)
export const updateMenuItem = async (id, updates) => {
  // 1. Update in local storage overrides immediately
  const overrides = getLocalOverrides()
  overrides[id] = { ...(overrides[id] || {}), ...updates }
  try {
    localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(overrides))
  } catch (e) {
    console.warn('Failed to persist override', e)
  }

  // 2. If it is a custom locally added item, update it in custom items array
  const customItems = getCustomAddedItems()
  const cIndex = customItems.findIndex((it) => it.id === id)
  if (cIndex >= 0) {
    customItems[cIndex] = { ...customItems[cIndex], ...updates }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customItems))
    } catch (e) {}
  }

  // 3. Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      // Don't send joined fields or internal meta
      const sanitized = { ...updates }
      delete sanitized.category
      delete sanitized._deleted

      await supabase.from('menu_items').update(sanitized).eq('id', id)
    } catch (err) {
      console.warn('Supabase update warning:', err)
    }
  }

  return true
}

// Add new dish (available to kitchen staff)
export const addMenuItem = async (newItem) => {
  const itemWithId = {
    id: 'item-custom-' + Date.now(),
    is_available: true,
    stock_count: newItem.stock_count ?? 25,
    prep_time_minutes: newItem.prep_time_minutes ?? 10,
    tags: newItem.tags ?? ['fresh', 'chef-special'],
    ...newItem,
  }

  // Save to local storage custom items
  const customItems = getCustomAddedItems()
  customItems.unshift(itemWithId)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customItems))
  } catch (e) {
    console.warn('Failed to persist custom item', e)
  }

  // Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const sanitized = { ...itemWithId }
      delete sanitized.category
      await supabase.from('menu_items').insert(sanitized)
    } catch (err) {
      console.warn('Supabase insert warning:', err)
    }
  }

  return itemWithId
}

// Delete dish (available to kitchen staff)
export const deleteMenuItem = async (id) => {
  const overrides = getLocalOverrides()
  overrides[id] = { _deleted: true }
  try {
    localStorage.setItem(LOCAL_OVERRIDE_KEY, JSON.stringify(overrides))
  } catch (e) {}

  const customItems = getCustomAddedItems().filter((it) => it.id !== id)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customItems))
  } catch (e) {}

  if (isSupabaseConfigured) {
    try {
      await supabase.from('menu_items').delete().eq('id', id)
    } catch (err) {
      console.warn('Supabase delete warning:', err)
    }
  }

  return true
}

// Reset menu to defaults
export const resetMenuToDefaults = () => {
  localStorage.removeItem(LOCAL_OVERRIDE_KEY)
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}
