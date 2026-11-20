import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import { Mail, KeyRound, Eye, EyeOff, Wifi, Zap, ArrowRight, UserCheck } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest)

  const [tab, setTab] = useState('student') // 'student' | 'faculty' | 'guest'
  const [email, setEmail] = useState('rahul.patil24@dbit.in')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Welcome back!')
      navigate('/')
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error(error.message)
  }

  const handleInstantGuestLogin = async (name = 'Campus Guest') => {
    setGuestLoading(true)
    try {
      await loginAsGuest(name)
      toast.success('Welcome, Guest! Instant Access Granted ⚡')
      navigate('/')
    } catch (err) {
      toast.error('Failed to start guest session: ' + err.message)
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'var(--color-inverse-surface)' }}
      >
        {/* Ambient glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#c8ff00] opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full bg-[#3b5bdb] opacity-20 blur-3xl pointer-events-none" />

        {/* Top */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <span className="font-black text-2xl tracking-tight text-[#c8ff00]" style={{ fontFamily: 'var(--font-headline)' }}>
              BYTE <span className="text-white">//</span> CANTEEN
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10">
              <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#c8ff00]">
                Live Campus Node #02
              </span>
            </div>
          </div>

          <div className="text-[11px] font-black uppercase tracking-widest text-[#b8c3ff] mb-4">
            ● Campus Fast-Track v2.4 / Engineering Block C
          </div>
          <h1 className="text-5xl font-black uppercase leading-none text-white tracking-tight" style={{ fontFamily: 'var(--font-headline)' }}>
            SKIP THE QUEUE.<br />
            <span style={{ color: 'var(--color-primary-container)' }}>NOT THE LECTURE.</span>
          </h1>
          <p className="mt-4 text-[#dbdad5] text-base max-w-md leading-relaxed">
            Pre-order hot canteen meals between classes, skip the 30-minute rush, and pick up fresh at Counter #2 in under 180 seconds.
          </p>
        </div>

        {/* Kitchen load card */}
        <div className="relative z-10 space-y-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8ff00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c8ff00]" />
                </span>
                <span className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-headline)' }}>
                  Kitchen Load: <span className="text-[#c8ff00]">Low</span>
                </span>
              </div>
              <span className="bg-[#c8ff00] text-[#121316] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                8 MIN PREP
              </span>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#c8ff00] h-full rounded-full" style={{ width: '24%' }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[['Active Tokens', '14', '#c8ff00'], ['Next Batch', '12:45 PM', 'white'], ['Pickup Bay', 'BAY #02', '#b8c3ff']].map(([label, val, color]) => (
                <div key={label} className="bg-white/10 p-2 rounded flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#dbdad5]">{label}</span>
                  <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-headline)', color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[#747a60] text-xs">
            <div className="flex items-center gap-2">
              <Wifi size={12} />
              <span>DBIT Main Cafeteria • Floor 1</span>
            </div>
            <span className="font-black uppercase tracking-widest text-[10px]">SYS STATUS: OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--color-surface-container-low)' }}>
        <div
          className="w-full max-w-md bg-white rounded-xl p-8 flex flex-col gap-6"
          style={{ border: '1.5px solid #121316', boxShadow: '6px 6px 0px #121316' }}
        >
          {/* Tabs */}
          <div className="grid grid-cols-3 p-1 rounded-lg gap-1" style={{ background: 'var(--color-surface-container)' }}>
            {[
              ['student', '🎓', 'Student'],
              ['faculty', '🪪', 'Faculty'],
              ['guest', '⚡', 'Guest'],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key)
                  if (key === 'student') setEmail('rahul.patil24@dbit.in')
                  if (key === 'faculty') setEmail('dr.deshmukh@dbit.in')
                }}
                className={`py-2 rounded text-[11px] font-black uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${
                  tab === key
                    ? 'bg-[#121316] text-[#c8ff00] shadow-sm'
                    : 'text-[#121316] hover:bg-white/50'
                }`}
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: GUEST PASS */}
          {tab === 'guest' ? (
            <div className="flex flex-col gap-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#c8ff00] text-[#121316] border border-[#121316] mb-2">
                  <Zap size={12} className="fill-[#121316]" /> No Credentials Required
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                  Guest Pass
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Visiting DBIT campus or exploring the canteen ordering app? Jump straight in without registering an account.
                </p>
              </div>

              {/* Guest feature highlights */}
              <div className="p-4 rounded-lg flex flex-col gap-2.5" style={{ background: 'var(--color-surface-container)', border: '1.5px solid var(--color-outline-variant)' }}>
                <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
                  <span className="text-[#059669]">✓</span> Full access to live cafeteria menu & stock
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
                  <span className="text-[#059669]">✓</span> Add items to cart & simulate checkout
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
                  <span className="text-[#059669]">✓</span> Live order token generation & pickup tracking
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
                  <span className="text-[#059669]">✓</span> Pre-loaded ₹500 test campus wallet balance
                </div>
              </div>

              {/* Instant Guest CTA */}
              <button
                type="button"
                onClick={() => handleInstantGuestLogin('Campus Guest')}
                disabled={guestLoading}
                className="btn-brutal w-full py-3.5 bg-[#c8ff00] text-[#121316] hover:bg-[#b8eb00] rounded flex items-center justify-center gap-2 text-sm font-black shadow-[4px_4px_0px_#121316]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {guestLoading ? (
                  <Spinner size={18} />
                ) : (
                  <>
                    <Zap size={18} className="fill-[#121316]" />
                    <span>Enter Canteen as Guest</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STUDENT / FACULTY LOGIN FORM */
            <>
              {/* Heading */}
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-tight" style={{ fontFamily: 'var(--font-headline)' }}>
                  {tab === 'student' ? 'Student Access' : 'Faculty Portal'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {tab === 'student'
                    ? 'Authenticate via your campus Moodle ID to unlock lightning pickup & wallet balance.'
                    : 'Priority express processing for teaching staff, lab assistants, and authorized visitors.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest flex items-center justify-between" style={{ fontFamily: 'var(--font-headline)' }}>
                    <span>{tab === 'student' ? 'College Email / Moodle ID' : 'Staff Code / Faculty Email'}</span>
                    <span className="text-[#4f6600] font-black">@dbit.in</span>
                  </label>
                  <div className="relative flex items-center rounded-lg" style={{ background: 'var(--color-surface-container)', border: '1.5px solid var(--color-outline-variant)' }}>
                    <Mail size={16} className="ml-3 flex-shrink-0" style={{ color: 'var(--color-on-surface-variant)' }} />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={tab === 'student' ? 'student@dbit.in' : 'faculty@dbit.in'}
                      required
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                      style={{ color: 'var(--color-on-surface)' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest flex items-center justify-between" style={{ fontFamily: 'var(--font-headline)' }}>
                    <span>Campus Password</span>
                    <button type="button" className="text-[#2d4fcf] hover:underline text-[10px] font-black uppercase">Forgot?</button>
                  </label>
                  <div className="relative flex items-center rounded-lg" style={{ background: 'var(--color-surface-container)', border: '1.5px solid var(--color-outline-variant)' }}>
                    <KeyRound size={16} className="ml-3 flex-shrink-0" style={{ color: 'var(--color-on-surface-variant)' }} />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none tracking-widest"
                      style={{ color: 'var(--color-on-surface)' }}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="mr-3 p-0.5">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-brutal w-full py-3 bg-[#c8ff00] text-[#121316] rounded flex items-center justify-center gap-2 text-sm"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {loading ? <Spinner size={18} /> : (
                    <>{tab === 'faculty' ? 'Access Faculty Lounge' : 'Enter Canteen'} →</>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow h-px" style={{ background: 'var(--color-surface-container-high)' }} />
                <span className="mx-3 text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>or fast-track</span>
                <div className="flex-grow h-px" style={{ background: 'var(--color-surface-container-high)' }} />
              </div>

              {/* Quick Actions: Instant Guest & Google */}
              <div className="flex flex-col gap-2.5">
                {/* Instant Guest Access Button */}
                <button
                  type="button"
                  onClick={() => handleInstantGuestLogin('Campus Guest')}
                  disabled={guestLoading}
                  className="btn-brutal w-full py-2.5 bg-[#c8ff00] text-[#121316] hover:bg-[#b8eb00] rounded flex items-center justify-center gap-2 text-xs font-black shadow-[3px_3px_0px_#121316]"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {guestLoading ? (
                    <Spinner size={14} />
                  ) : (
                    <>
                      <Zap size={14} className="fill-[#121316]" />
                      <span>Instant Guest Access (1-Click)</span>
                    </>
                  )}
                </button>

                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="btn-brutal w-full py-2 bg-white text-[#121316] rounded flex items-center justify-center gap-2 text-xs font-bold"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" fill="#4285F4"/>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.41 7.34 24 12 24z" fill="#34A853"/>
                    <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.14z" fill="#FBBC05"/>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335"/>
                  </svg>
                  <span>Sign in with Google Mail</span>
                </button>
              </div>
            </>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] pt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            <span className="flex items-center gap-1 font-semibold">
              <UserCheck size={13} className="text-[#059669]" /> Instant Fast-Track
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold">
              🔒 DBIT Campus Node
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
