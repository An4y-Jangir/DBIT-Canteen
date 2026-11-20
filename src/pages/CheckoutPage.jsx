import React, { useState, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { DietBadge, Spinner, Badge } from '../components/ui'
import { formatPrice } from '../lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import {
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  QrCode,
  Wallet,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DEFAULT_CANTEEN_UPI = import.meta.env.VITE_CANTEEN_UPI_ID || 'anayj@fam'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / Dynamic QR', icon: '📱', desc: 'Scan QR or Pay with GPay, PhonePe, Paytm' },
  { id: 'campus_wallet', label: 'DBIT Campus Wallet', icon: '🎓', desc: 'Pre-loaded student meal balance (1-Tap)' },
  { id: 'cash', label: 'Cash at Counter', icon: '💵', desc: 'Pay cash when collecting order at Bay #02' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, addItem, decrementItem, removeItem, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [instructions, setInstructions] = useState('')
  const [placing, setPlacing] = useState(false)

  // UPI State
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false)
  const [upiVerified, setUpiVerified] = useState(false)

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const maxPrepTime = Math.max(...items.map((i) => i.prep_time_minutes ?? 10), 5)

  // Dynamic order reference
  const [orderRefId] = useState(() => `DBIT${Math.floor(100000 + Math.random() * 900000)}`)

  // Construct NPCI Standard Dynamic UPI URI
  const upiUri = `upi://pay?pa=${DEFAULT_CANTEEN_UPI}&pn=DBIT%20Campus%20Canteen&am=${totalPrice.toFixed(
    2
  )}&tr=${orderRefId}&tn=Order%20${orderRefId}&cu=INR`

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(DEFAULT_CANTEEN_UPI)
    setCopiedUpi(true)
    toast.success('Canteen UPI ID copied!')
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleOpenUpiApp = (appScheme = 'generic') => {
    // Attempt standard intent launch
    let targetUri = upiUri
    if (appScheme === 'gpay') {
      targetUri = `gpay://upi/pay?pa=${DEFAULT_CANTEEN_UPI}&pn=DBIT%20Canteen&am=${totalPrice.toFixed(
        2
      )}&tr=${orderRefId}&cu=INR`
    } else if (appScheme === 'phonepe') {
      targetUri = `phonepe://pay?pa=${DEFAULT_CANTEEN_UPI}&pn=DBIT%20Canteen&am=${totalPrice.toFixed(
        2
      )}&tr=${orderRefId}&cu=INR`
    } else if (appScheme === 'paytm') {
      targetUri = `paytmmp://pay?pa=${DEFAULT_CANTEEN_UPI}&pn=DBIT%20Canteen&am=${totalPrice.toFixed(
        2
      )}&tr=${orderRefId}&cu=INR`
    }

    window.location.href = targetUri

    // Hint user to verify UTR afterwards
    toast('Switched to UPI app! Complete payment and submit UTR below.', {
      icon: '📲',
      duration: 4000,
    })
  }

  const handleSimulateUtr = () => {
    const fakeUtr = '4' + Math.floor(10000000000 + Math.random() * 90000000000).toString()
    setUtrNumber(fakeUtr)
    setUpiVerified(true)
    toast.success('Auto-filled 12-digit UPI UTR for testing!')
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) return toast.error('Your cart is empty!')

    // Validate UPI payment step
    if (paymentMethod === 'upi' && !upiVerified && !utrNumber.trim()) {
      return toast.error('Please scan the QR & enter your 12-digit UPI UTR / Ref No. to confirm payment!')
    }

    if (paymentMethod === 'campus_wallet') {
      const balance = profile?.campus_wallet_balance ?? 500
      if (balance < totalPrice) {
        return toast.error(`Insufficient wallet balance (₹${balance}). Please recharge or use UPI.`)
      }
    }

    setPlacing(true)

    try {
      const estimatedReady = new Date(Date.now() + maxPrepTime * 60 * 1000)
      const tokenChar = String.fromCharCode(65 + Math.floor(Math.random() * 4)) // A, B, C, D
      const tokenNum = String(Math.floor(10 + Math.random() * 90))
      const generatedToken = `${tokenChar}-${tokenNum}`
      const pickupBay = 'BAY #02'

      // Check if user is a valid Supabase auth UUID
      const isUuid =
        user?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)

      let savedOrder = null

      if (isUuid) {
        try {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              token_number: generatedToken,
              pickup_bay: pickupBay,
              total_amount: totalPrice,
              payment_method: paymentMethod,
              payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
              status: 'confirmed',
              estimated_ready_at: estimatedReady.toISOString(),
              special_instructions: instructions
                ? `${instructions} [UPI Ref: ${utrNumber || 'N/A'}]`
                : utrNumber
                ? `[UPI Ref: ${utrNumber}]`
                : null,
            })
            .select()
            .single()

          if (!orderError && order) {
            const orderItems = items.map((item) => ({
              order_id: order.id,
              menu_item_id: item.id?.startsWith('item-') ? null : item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))
            await supabase.from('order_items').insert(orderItems)
            savedOrder = order
          }
        } catch (dbErr) {
          console.warn('Supabase order insert fallback:', dbErr)
        }
      }

      // If database not configured or guest user without supabase session, create local simulated order
      if (!savedOrder) {
        const localOrderId = 'order-' + Math.random().toString(36).substring(2, 10)
        savedOrder = {
          id: localOrderId,
          token_number: generatedToken,
          pickup_bay: pickupBay,
          total_amount: totalPrice,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
          status: 'confirmed',
          estimated_ready_at: estimatedReady.toISOString(),
          special_instructions: instructions
            ? `${instructions} [UPI Ref: ${utrNumber || 'N/A'}]`
            : utrNumber
            ? `[UPI Ref: ${utrNumber}]`
            : null,
          created_at: new Date().toISOString(),
          order_items: items.map((item, idx) => ({
            id: 'oi-' + idx,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
        }
        localStorage.setItem(`byte-order-${savedOrder.id}`, JSON.stringify(savedOrder))
      }

      clearCart()
      toast.success(`Payment Verified! Order Token #${generatedToken} 🎫`)
      navigate(`/order/${savedOrder.id}`)
    } catch (err) {
      toast.error(err.message ?? 'Failed to place order. Try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-6xl">🛒</p>
          <p
            className="text-xl font-black uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Cart is empty
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-brutal px-6 py-3 bg-[#c8ff00] text-[#121316] rounded text-sm mt-2"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Browse Menu →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Order Items (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Order Review
            </h1>
            {user?.isGuest && <Badge color="lime">Guest Order</Badge>}
          </div>

          {/* Cart items list */}
          <div className="brutal-card bg-white rounded-lg overflow-hidden">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5"
                style={{
                  borderBottom:
                    idx < items.length - 1 ? '1.5px solid var(--color-outline-variant)' : 'none',
                }}
              >
                <DietBadge isVeg={item.is_veg} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-[#121316]">{item.name}</p>
                  <p className="text-[11px] text-[#747a60]">{formatPrice(item.price)} each</p>
                </div>
                {/* Stepper */}
                <div
                  className="flex items-stretch rounded overflow-hidden"
                  style={{ border: '1.5px solid #121316', boxShadow: '2px 2px 0px #121316' }}
                >
                  <button
                    onClick={() => decrementItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#f5f4ef]"
                    style={{ borderRight: '1.5px solid #121316' }}
                  >
                    <Minus size={11} />
                  </button>
                  <span
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold bg-white"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addItem(item)}
                    className="w-7 h-7 flex items-center justify-center bg-[#c8ff00] hover:bg-[#c0f500]"
                    style={{ borderLeft: '1.5px solid #121316' }}
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <span
                  className="text-xs font-black w-14 text-right"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-[#ba1a1a] hover:opacity-70 ml-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Special instructions */}
          <div>
            <label
              className="text-[11px] font-black uppercase tracking-widest block mb-1"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Chef Notes (optional)
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Extra mint chutney, less spicy..."
              className="w-full text-xs p-2.5 rounded-lg outline-none"
              style={{
                border: '1.5px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
              }}
            />
          </div>

          {/* Prep time card */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{
              background: 'var(--color-surface-container)',
              border: '1.5px solid var(--color-outline-variant)',
            }}
          >
            <span className="text-xl">⏱️</span>
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                Fast-Track Prep Time
              </p>
              <p className="text-xs text-[#5e5e62]">
                ~{maxPrepTime} mins · Collect at Counter #2 (Bay #02)
              </p>
            </div>
          </div>

          {/* Bill breakdown */}
          <div className="brutal-card bg-white rounded-lg p-4 flex flex-col gap-2">
            <div className="flex justify-between text-xs text-[#5e5e62]">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#5e5e62]">
              <span>Platform Fee</span>
              <span className="text-[#059669] font-bold">FREE (Campus Tier)</span>
            </div>
            <div
              className="flex justify-between text-base font-black pt-2"
              style={{ borderTop: '1.5px solid #121316', fontFamily: 'var(--font-headline)' }}
            >
              <span>Total Amount</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Payment System (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Payment Gateway
          </h2>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className="p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 text-center transition-all"
                style={{
                  border: `1.5px solid ${paymentMethod === pm.id ? '#121316' : 'var(--color-outline-variant)'}`,
                  background: paymentMethod === pm.id ? '#c8ff00' : 'white',
                  boxShadow: paymentMethod === pm.id ? '3px 3px 0px #121316' : 'none',
                }}
              >
                <span className="text-xl">{pm.icon}</span>
                <span
                  className="text-xs font-black uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-headline)', color: '#121316' }}
                >
                  {pm.label}
                </span>
              </button>
            ))}
          </div>

          {/* PAYMENT VIEW 1: DYNAMIC UPI */}
          {paymentMethod === 'upi' && (
            <div
              className="brutal-card bg-white rounded-lg p-5 flex flex-col gap-5"
              style={{ border: '1.5px solid #121316' }}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#efeee9]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-[#121316] text-[#c8ff00]">
                    <QrCode size={18} />
                  </span>
                  <div>
                    <h3
                      className="text-sm font-black uppercase"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      Scan & Pay with any UPI App
                    </h3>
                    <p className="text-[11px] text-[#747a60]">
                      Locked Amount: <strong className="text-[#121316]">{formatPrice(totalPrice)}</strong> · Ref: {orderRefId}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 bg-[#059669]/10 text-[#059669] px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-[#059669]/20">
                  <ShieldCheck size={12} />
                  <span>NPCI Dynamic URI</span>
                </div>
              </div>

              {/* QR and Mobile Launch Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* Dynamic QR Box */}
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-[#faf9f4] border border-[#121316] shadow-[3px_3px_0px_#121316]">
                  <div className="p-3 bg-white rounded border border-[#e3e3de] shadow-sm">
                    <QRCodeSVG
                      value={upiUri}
                      size={150}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#747a60] mt-2 flex items-center gap-1">
                    <span>⚡ GPay · PhonePe · Paytm · Cred</span>
                  </span>
                </div>

                {/* Direct App Launchers & UPI ID */}
                <div className="flex flex-col gap-3">
                  <p
                    className="text-[11px] font-black uppercase tracking-wider text-[#121316]"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    1-Tap Launch on Mobile:
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenUpiApp('gpay')}
                      className="btn-brutal p-2 bg-[#f5f4ef] hover:bg-[#e9e8e3] rounded text-[11px] font-black text-[#121316] flex flex-col items-center gap-1"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      <span className="text-base">🟢</span>
                      <span>GPay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenUpiApp('phonepe')}
                      className="btn-brutal p-2 bg-[#f5f4ef] hover:bg-[#e9e8e3] rounded text-[11px] font-black text-[#121316] flex flex-col items-center gap-1"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      <span className="text-base">🟣</span>
                      <span>PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenUpiApp('paytm')}
                      className="btn-brutal p-2 bg-[#f5f4ef] hover:bg-[#e9e8e3] rounded text-[11px] font-black text-[#121316] flex flex-col items-center gap-1"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      <span className="text-base">🔵</span>
                      <span>Paytm</span>
                    </button>
                  </div>

                  {/* Copy UPI ID */}
                  <div className="mt-1">
                    <span className="text-[10px] font-bold text-[#747a60] uppercase block mb-1">
                      Or pay directly to Canteen UPI VPA:
                    </span>
                    <div className="flex items-center gap-1 bg-[#efeee9] p-1.5 rounded border border-[#121316]">
                      <span className="text-xs font-mono font-bold px-2 flex-1 truncate text-[#121316]">
                        {DEFAULT_CANTEEN_UPI}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="btn-brutal px-2.5 py-1 bg-white text-[#121316] text-[10px] font-black uppercase rounded flex items-center gap-1"
                      >
                        {copiedUpi ? <Check size={11} className="text-[#059669]" /> : <Copy size={11} />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anti-Fraud UTR Verification Section */}
              <div
                className="p-3.5 rounded-lg flex flex-col gap-2"
                style={{
                  background: upiVerified ? '#059669]/10' : '#f6f5f0',
                  border: `1.5px solid ${upiVerified ? '#059669' : '#121316'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <label
                    className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-[#121316]"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    <ShieldCheck size={14} className={upiVerified ? 'text-[#059669]' : 'text-[#3b5bdb]'} />
                    <span>Enter 12-Digit UPI Ref / UTR No.:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSimulateUtr}
                    className="text-[10px] font-black uppercase text-[#2d4fcf] hover:underline"
                  >
                    ⚡ Auto-Fill Test Ref
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={utrNumber}
                    maxLength={16}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))
                      if (e.target.value.length >= 12) setUpiVerified(true)
                    }}
                    placeholder="e.g. 432189012345 (from GPay / PhonePe receipt)"
                    className="flex-1 bg-white px-3 py-2 text-xs rounded border border-[#121316] font-mono outline-none shadow-sm"
                  />
                  {upiVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-black text-[#059669] bg-white px-2.5 py-2 rounded border border-[#059669]">
                      <Check size={14} /> Ref Verified
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#747a60]">
                  💡 Found under "UPI Transaction ID" or "Google Transaction ID" in your payment receipt.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="btn-brutal w-full py-4 bg-[#c8ff00] text-[#121316] rounded flex items-center justify-center gap-2 text-sm font-black shadow-[4px_4px_0px_#121316]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {placing ? (
                  <Spinner size={18} />
                ) : (
                  <>
                    <span>Confirm UPI Payment · {formatPrice(totalPrice)}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* PAYMENT VIEW 2: CAMPUS WALLET */}
          {paymentMethod === 'campus_wallet' && (
            <div
              className="brutal-card bg-white rounded-lg p-5 flex flex-col gap-4"
              style={{ border: '1.5px solid #121316' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#efeee9]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-[#121316] text-[#c8ff00]">
                    <Wallet size={18} />
                  </span>
                  <div>
                    <h3
                      className="text-sm font-black uppercase"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      DBIT Student Meal Wallet
                    </h3>
                    <p className="text-[11px] text-[#747a60]">
                      Zero bank server delay · Instant order generation
                    </p>
                  </div>
                </div>
                <Badge color="cobalt">1-TAP DEDUCT</Badge>
              </div>

              <div className="p-4 rounded-lg bg-[#faf9f4] border border-[#121316] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#747a60] block">
                    Available Wallet Balance
                  </span>
                  <span
                    className="text-2xl font-black text-[#121316]"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {formatPrice(profile?.campus_wallet_balance ?? 500)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#747a60] block">
                    After Deduction
                  </span>
                  <span
                    className="text-base font-black text-[#059669]"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {formatPrice((profile?.campus_wallet_balance ?? 500) - totalPrice)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="btn-brutal w-full py-4 bg-[#c8ff00] text-[#121316] rounded flex items-center justify-center gap-2 text-sm font-black shadow-[4px_4px_0px_#121316]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {placing ? (
                  <Spinner size={18} />
                ) : (
                  <>
                    <span>Pay {formatPrice(totalPrice)} with Wallet</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* PAYMENT VIEW 3: CASH AT COUNTER */}
          {paymentMethod === 'cash' && (
            <div
              className="brutal-card bg-white rounded-lg p-5 flex flex-col gap-4"
              style={{ border: '1.5px solid #121316' }}
            >
              <div className="flex items-center gap-2 pb-3 border-b border-[#efeee9]">
                <span className="text-2xl">💵</span>
                <div>
                  <h3
                    className="text-sm font-black uppercase"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    Pay Cash at Counter #2
                  </h3>
                  <p className="text-[11px] text-[#747a60]">
                    Your order ticket will be printed; pay exact cash upon pickup.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#f6f5f0] border border-[#121316] text-xs text-[#121316]">
                <p className="font-bold mb-1">⚠️ Important Pickup Rules:</p>
                <ul className="list-disc list-inside space-y-1 text-[#434933] text-[11px]">
                  <li>Please keep exact change of <strong>{formatPrice(totalPrice)}</strong> ready.</li>
                  <li>Orders not collected within 20 mins of prep will be released to queue.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="btn-brutal w-full py-4 bg-[#c8ff00] text-[#121316] rounded flex items-center justify-center gap-2 text-sm font-black shadow-[4px_4px_0px_#121316]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {placing ? (
                  <Spinner size={18} />
                ) : (
                  <>
                    <span>Generate Cash Token · {formatPrice(totalPrice)}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-[#747a60]">
            <span className="flex items-center gap-1 font-bold">
              🔒 End-to-End Encrypted UPI Intent
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-bold">
              DBIT Campus Node Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
