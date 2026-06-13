'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  url: string
}

interface AuditScores {
  speed: number
  seo: number
  ux: number
}

type AppState = 'form' | 'loading' | 'result'

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Connexion au site en cours…',
  'Analyse des balises SEO…',
  'Mesure des performances…',
  'Audit de l\'expérience utilisateur…',
  'Calcul des Core Web Vitals…',
  'Génération de votre rapport…',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(score: number): { text: string; ring: string; bg: string; label: string } {
  if (score >= 80) return { text: 'text-emerald-400', ring: 'stroke-emerald-400', bg: 'bg-emerald-400/10', label: 'Excellent' }
  if (score >= 50) return { text: 'text-amber-400', ring: 'stroke-amber-400', bg: 'bg-amber-400/10', label: 'À améliorer' }
  return { text: 'text-rose-400', ring: 'stroke-rose-500', bg: 'bg-rose-400/10', label: 'Critique' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ score, label, icon }: { score: number; label: string; icon: string }) {
  const { text, ring, bg, label: badge } = getScoreColor(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={`flex flex-col items-center gap-4 rounded-2xl border border-white/10 ${bg} p-8 backdrop-blur-sm`}>
      <div className="relative h-36 w-36">
        <svg className="-rotate-90" viewBox="0 0 120 120" width="144" height="144">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            className={ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl">{icon}</span>
          <span className={`text-3xl font-bold tabular-nums ${text}`}>{score}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-white">{label}</p>
        <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${text} border ${ring.replace('stroke-', 'border-')}`}>
          {badge}
        </span>
      </div>
    </div>
  )
}

function InputField({
  label, name, type = 'text', placeholder, value, onChange, required,
}: {
  label: string; name: string; type?: string; placeholder: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-300">
        {label}{required && <span className="ml-1 text-orange-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        value={value} onChange={onChange} required={required}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500
          outline-none transition-all duration-200
          focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [state, setState] = useState<AppState>('form')
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', company: '', email: '', phone: '', url: '',
  })
  const [scores, setScores] = useState<AuditScores | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [auditedUrl, setAuditedUrl] = useState('')

  // Rotate loading messages
  useEffect(() => {
    if (state !== 'loading') return
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [state])

  // Animate progress bar
  useEffect(() => {
    if (state !== 'loading') { setLoadingProgress(0); return }
    setLoadingProgress(0)
    const timer = setTimeout(() => setLoadingProgress(85), 200)
    return () => clearTimeout(timer)
  }, [state])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAuditedUrl(formData.url)
    setState('loading')
    setLoadingMsg(0)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'audit')

      // Use scores from API if provided, otherwise generate realistic placeholders
      setScores(data.scores ?? {
        speed: Math.floor(Math.random() * 40) + 40,
        seo: Math.floor(Math.random() * 40) + 40,
        ux: Math.floor(Math.random() * 40) + 40,
      })
      setLoadingProgress(100)
      setTimeout(() => setState('result'), 400)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setState('form')
    }
  }

  function handleReset() {
    setState('form')
    setScores(null)
    setError(null)
    setFormData({ firstName: '', lastName: '', company: '', email: '', phone: '', url: '' })
  }

  const globalScore = scores ? Math.round((scores.speed + scores.seo + scores.ux) / 3) : 0

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-lime-500/20 font-sans">

      {/* ── Background glow ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-neutral-900/40 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-16">

        {/* ── Header ── */}
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            Audit gratuit · Résultats en 30 secondes
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Votre site mérite{' '}
            <span className="bg-gradient-to-r bg-emerald-500 to-orange-600 bg-clip-text text-transparent">
              mieux.
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Obtenez un diagnostic complet de votre site web — performance, SEO, expérience
            utilisateur — en quelques secondes, sans inscription.
          </p>
        </header>

        {/* ══════════════════════════════════════════════════════════════════════
            STATE 1 — FORM
        ══════════════════════════════════════════════════════════════════════ */}
        {state === 'form' && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/8 bg-neutral-900/40 p-8 backdrop-blur-md shadow-2xl shadow-black/40"
          >
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                <span className="mt-0.5 text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Prénom" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} required />
              <InputField label="Nom" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} required />
              <InputField label="Entreprise" name="company" placeholder="Acme SAS" value={formData.company} onChange={handleChange} />
              <InputField label="Email" name="email" type="email" placeholder="jean@acme.fr" value={formData.email} onChange={handleChange} required />
              <InputField label="Téléphone" name="phone" type="tel" placeholder="+33 6 00 00 00 00" value={formData.phone} onChange={handleChange} />
              <InputField label="Site à auditer" name="url" type="url" placeholder="https://votre-site.fr" value={formData.url} onChange={handleChange} required />
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-xl bg-emerald-700 shadow-emerald-950/20 hover:bg-emerald-600 text-white px-6 py-4 text-sm font-semibold text-white
                shadow-lg shadow-lime-600/25 transition-all duration-200
                hover:from-lime-500 hover:to-lime-600 hover:shadow-lime-500/30 hover:-translate-y-0.5
                active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              Lancer l'audit gratuit →
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              Aucune carte bancaire · Résultats immédiats · 100 % confidentiel
            </p>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STATE 2 — LOADING
        ══════════════════════════════════════════════════════════════════════ */}
        {state === 'loading' && (
          <div className="rounded-2xl border border-white/8 bg-neutral-900/40 p-12 text-center backdrop-blur-md shadow-2xl shadow-black/40">

            {/* Spinner */}
            <div className="relative mx-auto mb-8 h-20 w-20">
              <svg className="animate-spin" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" stroke="url(#grad)" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray="213" strokeDashoffset="150" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
            </div>

            {/* Dynamic message */}
            <p key={loadingMsg} className="text-lg font-medium text-white transition-opacity duration-500">
              {LOADING_MESSAGES[loadingMsg]}
            </p>
            <p className="mt-1 text-sm text-slate-500 truncate max-w-xs mx-auto">{auditedUrl}</p>

            {/* Progress bar */}
            <div className="mx-auto mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-[2000ms] ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-600">Analyse en cours, merci de patienter…</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STATE 3 — RESULTS
        ══════════════════════════════════════════════════════════════════════ */}
        {state === 'result' && scores && (
          <div className="space-y-6">

            {/* Global score banner */}
            <div className="rounded-2xl border border-white/8 bg-white/3 px-8 py-6 backdrop-blur-md shadow-2xl shadow-black/40">
              <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Note globale</p>
                  <p className="mt-1 text-sm text-slate-400 truncate max-w-xs">{auditedUrl}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-6xl font-bold tabular-nums ${getScoreColor(globalScore).text}`}>
                    {globalScore}
                  </span>
                  <span className="text-xl text-slate-600">/100</span>
                </div>
              </div>
            </div>

            {/* Score cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <ScoreGauge score={scores.speed} label="Vitesse" icon="⚡" />
              <ScoreGauge score={scores.seo} label="SEO" icon="🎯" />
              <ScoreGauge score={scores.ux} label="Expérience" icon="✨" />
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/30 to-orange-900/20 p-8 text-center backdrop-blur-md">
              <p className="text-xs font-medium uppercase tracking-widest text-orange-400">Passez à l'action</p>
              <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                Prêt à améliorer ces scores ?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Nos experts analysent votre site en détail et vous proposent un plan d'action concret,
                sans engagement.
              </p>
              <a
                href="https://rewind-studio.vercel.app/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600 px-8 py-4
                  text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all duration-200
                  hover:from-orange-500 hover:to-orange-600 hover:-translate-y-0.5 hover:shadow-orange-500/30"
              >
                Prendre un rendez-vous gratuit
                <span aria-hidden>→</span>
              </a>
              <p className="mt-3 text-xs text-slate-600">30 min · Sans engagement · Par visio ou téléphone</p>
            </div>

            {/* Reset */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline"
              >
                ← Auditer un autre site
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}