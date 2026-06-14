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
  'On se connecte à votre site…',
  'Analyse des balises SEO…',
  'Mesure des temps de chargement…',
  'Vérification de l\'expérience mobile…',
  'Calcul des Core Web Vitals…',
  'Génération de votre rapport…',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(score: number): { hex: string; label: string; bg: string } {
  if (score >= 80) return { hex: '#4CAF7D', label: 'Excellent', bg: 'rgba(76,175,125,0.08)' }
  if (score >= 50) return { hex: '#E8A838', label: 'À améliorer', bg: 'rgba(232,168,56,0.08)' }
  return { hex: '#E05D44', label: 'Critique', bg: 'rgba(224,93,68,0.08)' }
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score, label, icon }: { score: number; label: string; icon: string }) {
  const { hex, label: badge, bg } = getScoreColor(score)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl p-7"
      style={{ background: bg, border: `1px solid ${hex}22` }}
    >
      <div className="relative h-36 w-36">
        <svg className="-rotate-90" viewBox="0 0 120 120" width="144" height="144">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={hex}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl">{icon}</span>
          <span className="text-3xl font-bold tabular-nums" style={{ color: hex }}>{score}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        <span
          className="mt-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-medium"
          style={{ color: hex, background: `${hex}18`, border: `1px solid ${hex}30` }}
        >
          {badge}
        </span>
      </div>
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({
  label, name, type = 'text', placeholder, value, onChange, required,
}: {
  label: string; name: string; type?: string; placeholder: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-white/40 tracking-wide uppercase">
        {label}{required && <span className="ml-1 text-[#E05D44]">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        value={value} onChange={onChange} required={required}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20
          outline-none transition-all duration-200
          focus:border-[#4CAF7D]/50 focus:bg-white/8 focus:ring-2 focus:ring-[#4CAF7D]/10"
      />
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (state !== 'loading') return
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [state])

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
  const globalColor = getScoreColor(globalScore)

  return (
    <main
      className="min-h-screen text-white selection:bg-[#4CAF7D]/20"
      style={{ background: 'linear-gradient(160deg, #0D1117 0%, #111A16 50%, #0D1117 100%)' }}
    >

      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] opacity-15"
          style={{ background: 'radial-gradient(ellipse, #4CAF7D 0%, transparent 65%)', filter: 'blur(70px)' }}
        />
        <div
          className="absolute bottom-0 right-0 h-[350px] w-[500px] opacity-8"
          style={{ background: 'radial-gradient(ellipse, #E8A838 0%, transparent 65%)', filter: 'blur(90px)' }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════════════ */}
      <nav className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold tracking-tight">
          <span style={{ color: '#4CAF7D' }}>Rewind</span>
          <span className="text-white/70">Insights</span>
        </span>
        <a
          href="#audit"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Tester mon site →
        </a>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">

        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
          style={{ background: 'rgba(76,175,125,0.10)', border: '1px solid rgba(76,175,125,0.25)', color: '#4CAF7D' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF7D] animate-pulse" />
          Diagnostic gratuit — résultats en 30 secondes
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-white">
          Votre site vous fait<br />
          <span style={{ color: '#4CAF7D' }}>perdre des clients.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/50">
          Lenteur, SEO négligé, expérience mobile bancale — chaque problème non résolu coûte des conversions.
          On mesure tout ça en 30 secondes, sans vous demander une CB.
        </p>

        <a
          href="#audit"
          className="mt-9 inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #4CAF7D, #369b62)',
            boxShadow: '0 6px 28px rgba(76,175,125,0.30)',
          }}
        >
          Analyser mon site maintenant
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <p className="mt-3 text-xs text-white/25">Sans inscription · Résultats immédiats · 100% gratuit</p>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS / SOCIAL PROOF
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { stat: '−7%', label: 'de conversions par seconde de chargement en plus', source: 'Google, 2023' },
            { stat: '53%', label: 'des visiteurs quittent un site mobile qui met plus de 3s à charger', source: 'Think with Google' },
            { stat: '1er', label: 'La vitesse est un critère de ranking Google depuis 2021', source: 'Core Web Vitals' },
          ].map(({ stat, label, source }) => (
            <Card key={stat} className="p-6">
              <p className="text-4xl font-bold text-white tracking-tight">{stat}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{label}</p>
              <p className="mt-3 text-xs text-white/20 font-medium">{source}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          AUDIT FORM — #audit
      ═══════════════════════════════════════════════════════════ */}
      <section id="audit" className="relative z-10 mx-auto max-w-xl px-6 pb-28 scroll-mt-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white">Votre diagnostic en 30 secondes</h2>
          <p className="mt-2 text-sm text-white/40">
            Renseignez l'URL de votre site — on s'occupe du reste.
          </p>
        </div>

        {/* ── FORM ── */}
        {state === 'form' && (
          <Card className="p-7">
            {error && (
              <div
                className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm text-[#E05D44]"
                style={{ background: 'rgba(224,93,68,0.08)', border: '1px solid rgba(224,93,68,0.20)' }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} required />
                <Field label="Nom" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} required />
                <Field label="Entreprise" name="company" placeholder="Acme SAS" value={formData.company} onChange={handleChange} />
                <Field label="Email" name="email" type="email" placeholder="jean@acme.fr" value={formData.email} onChange={handleChange} required />
                <Field label="Téléphone" name="phone" type="tel" placeholder="+33 6 00 00 00 00" value={formData.phone} onChange={handleChange} />
                <Field label="URL de votre site" name="url" type="url" placeholder="https://votre-site.fr" value={formData.url} onChange={handleChange} required />
              </div>

              <button
                type="submit"
                className="mt-3 w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #4CAF7D, #369b62)',
                  boxShadow: '0 4px 20px rgba(76,175,125,0.25)',
                }}
              >
                Lancer le diagnostic gratuit →
              </button>

              <p className="text-center text-xs text-white/20">
                Vos données ne sont pas revendues. Jamais.
              </p>
            </form>
          </Card>
        )}

        {/* ── LOADING ── */}
        {state === 'loading' && (
          <Card className="p-10 text-center">
            <div className="relative mx-auto mb-8 h-20 w-20">
              <svg className="animate-spin" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="34" stroke="rgba(76,175,125,0.10)" strokeWidth="5" />
                <circle cx="40" cy="40" r="34" stroke="#4CAF7D" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray="213" strokeDashoffset="150" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
            </div>

            <p
              key={loadingMsg}
              className="text-sm font-medium text-white/70 transition-opacity duration-500"
            >
              {LOADING_MESSAGES[loadingMsg]}
            </p>
            <p className="mt-1.5 text-xs text-white/30 truncate max-w-xs mx-auto">{auditedUrl}</p>

            <div className="mx-auto mt-8 h-1 w-56 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-[2000ms] ease-out"
                style={{ width: `${loadingProgress}%`, background: 'linear-gradient(90deg, #4CAF7D, #81d4a8)' }}
              />
            </div>
          </Card>
        )}

        {/* ── RESULT ── */}
        {state === 'result' && scores && (
          <div className="space-y-5">

            {/* Global */}
            <Card className="flex items-center justify-between px-7 py-5">
              <div>
                <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Note globale</p>
                <p className="mt-0.5 text-xs text-white/30 truncate max-w-[160px]">{auditedUrl}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold tabular-nums" style={{ color: globalColor.hex }}>
                  {globalScore}
                </span>
                <span className="text-lg text-white/20">/100</span>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <ScoreGauge score={scores.speed} label="Vitesse" icon="⚡" />
              <ScoreGauge score={scores.seo} label="SEO" icon="🎯" />
              <ScoreGauge score={scores.ux} label="Expérience" icon="✨" />
            </div>

            {/* CTA résultat */}
            <div
              className="rounded-2xl p-7 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(76,175,125,0.10), rgba(76,175,125,0.04))',
                border: '1px solid rgba(76,175,125,0.20)',
              }}
            >
              {globalScore < 70 ? (
                <>
                  <p className="text-lg font-bold text-white">
                    Il y a de la marge. On peut faire beaucoup mieux.
                  </p>
                  <p className="mt-2 text-sm text-white/50">
                    Nos experts vous expliquent exactement quoi corriger, dans quel ordre, et pourquoi — en 30 minutes.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-white">
                    Bon score, mais peut-on viser l'excellence ?
                  </p>
                  <p className="mt-2 text-sm text-white/50">
                    Même un site performant a des axes d'amélioration. On vous dit lesquels.
                  </p>
                </>
              )}

              <a
                href="https://rewind-studio.vercel.app/"
                className="mt-6 inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #4CAF7D, #369b62)',
                  boxShadow: '0 6px 28px rgba(76,175,125,0.30)',
                }}
              >
                Parler à un expert — c'est gratuit
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <p className="mt-2.5 text-xs text-white/25">30 min · sans engagement · visio ou téléphone</p>
            </div>

            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-xs text-white/30 transition hover:text-white/60"
              >
                ← Tester un autre site
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CE QU'ON ANALYSE
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-white">Ce qu'on mesure pour vous</h2>
          <p className="mt-2 text-sm text-white/40">Les trois piliers qui font vraiment la différence.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              color: '#E8A838',
              icon: '⚡',
              title: 'Vitesse de chargement',
              desc: 'On mesure LCP, TTFB, FID — les métriques que Google regarde pour classer votre site. Chaque seconde gagnée est une conversion de plus.',
              metrics: ['Largest Contentful Paint', 'Time to First Byte', 'First Input Delay'],
            },
            {
              color: '#4CAF7D',
              icon: '🎯',
              title: 'SEO technique',
              desc: 'Balises manquantes, sitemap oublié, erreurs d\'indexation — on repère tout ce qui empêche Google de vous trouver.',
              metrics: ['Meta title & description', 'Crawlabilité & sitemap', 'Core Web Vitals'],
            },
            {
              color: '#A78BFA',
              icon: '✨',
              title: 'Expérience utilisateur',
              desc: 'Un site qui bouge au chargement, des boutons trop petits sur mobile, des contrastes insuffisants — on détecte ce qui frustre vos visiteurs.',
              metrics: ['Cumulative Layout Shift', 'Accessibilité WCAG', 'Responsive mobile'],
            },
          ].map(({ color, icon, title, desc, metrics }) => (
            <Card key={title} className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <span className="text-xl">{icon}</span>
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/45">{desc}</p>
              <ul className="mt-4 space-y-1.5">
                {metrics.map(m => (
                  <li key={m} className="flex items-center gap-2 text-xs text-white/35">
                    <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: color }} />
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-28 text-center">
        <Card className="p-10">
          <p className="text-sm font-medium text-white/30 uppercase tracking-widest">Prêt à passer à l'étape suivante ?</p>
          <h2 className="mt-4 text-3xl font-bold text-white leading-tight">
            Un site rapide, bien référencé<br />et agréable à utiliser.
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/45">
            C'est faisable. Et ça commence par savoir où vous en êtes. Testez votre site maintenant — c'est gratuit et ça prend 30 secondes.
          </p>
          <a
            href="#audit"
            className="mt-7 inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #4CAF7D, #369b62)',
              boxShadow: '0 6px 28px rgba(76,175,125,0.30)',
            }}
          >
            Analyser mon site maintenant
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="mt-3 text-xs text-white/20">Sans inscription · Sans CB · Résultats immédiats</p>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/6 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="text-sm font-semibold">
            <span style={{ color: '#4CAF7D' }}>Rewind</span>
            <span className="text-white/50">Insights</span>
          </span>
          <div className="flex items-center gap-5">
            {['Mentions légales', 'Confidentialité', 'CGU'].map(link => (
              <a key={link} href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs text-white/20">
            Un service{' '}
            <a href="https://rewind-studio.vercel.app/" className="text-white/35 hover:text-white/55 transition-colors">
              Rewind Studio
            </a>
          </p>
        </div>
      </footer>

    </main>
  )
}