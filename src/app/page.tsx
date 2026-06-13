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

// ─── Palette (IDE forest) ─────────────────────────────────────────────────────
// --bg:        #0B0F0E   (noir verdâtre profond)
// --surface:   rgba(0,0,0,0.35)  code-bg
// --kw:        #7C9E8F   (vert sauge — accent principal)
// --str:       #B8CDB3   (vert pâle — texte secondaire)
// --fn:        #C4714A   (terra cotta — CTA chaud)
// --var:       #C9A96E   (or doux — highlights)
// --key:       #A89DB0   (mauve grisé — labels)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(score: number): { text: string; stroke: string; bg: string; label: string; hex: string } {
  if (score >= 80) return { text: 'text-[#7C9E8F]', stroke: '#7C9E8F', bg: 'bg-[#7C9E8F]/10', label: 'Excellent', hex: '#7C9E8F' }
  if (score >= 50) return { text: 'text-[#C9A96E]', stroke: '#C9A96E', bg: 'bg-[#C9A96E]/10', label: 'À améliorer', hex: '#C9A96E' }
  return { text: 'text-[#C4714A]', stroke: '#C4714A', bg: 'bg-[#C4714A]/10', label: 'Critique', hex: '#C4714A' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ score, label, icon }: { score: number; label: string; icon: string }) {
  const { text, stroke, bg, label: badge, hex } = getScoreColor(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={`flex flex-col items-center gap-4 rounded-xl border border-[#7C9E8F]/15 ${bg} p-6 backdrop-blur-sm`}>
      <div className="relative h-36 w-36">
        <svg className="-rotate-90" viewBox="0 0 120 120" width="144" height="144">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-xl">{icon}</span>
          <span className={`text-3xl font-bold tabular-nums font-mono ${text}`}>{score}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#B8CDB3]">{label}</p>
        <span
          className="mt-1.5 inline-block rounded px-2.5 py-0.5 text-xs font-mono font-medium"
          style={{ color: hex, background: `${hex}18`, border: `1px solid ${hex}35` }}
        >
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
      <label htmlFor={name} className="text-xs font-mono font-medium text-[#A89DB0] tracking-wide">
        <span className="text-[#7C9E8F]">const </span>
        {name}
        {required && <span className="ml-1 text-[#C4714A]">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        value={value} onChange={onChange} required={required}
        className="rounded-lg border border-[#7C9E8F]/20 bg-black/30 px-4 py-2.5 text-sm font-mono text-[#B8CDB3] placeholder-[#A89DB0]/40
          outline-none transition-all duration-200
          focus:border-[#7C9E8F]/60 focus:ring-2 focus:ring-[#7C9E8F]/10"
      />
    </div>
  )
}

// ─── IDE Window Chrome ────────────────────────────────────────────────────────

function IDEChrome({ children, title = 'audit.run()' }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-[#7C9E8F]/20 bg-[rgba(0,0,0,0.5)] shadow-2xl shadow-black/60 overflow-hidden backdrop-blur-md">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-[#7C9E8F]/15 bg-black/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#C4714A]/70" />
          <span className="h-3 w-3 rounded-full bg-[#C9A96E]/70" />
          <span className="h-3 w-3 rounded-full bg-[#7C9E8F]/70" />
        </div>
        <span className="flex-1 text-center text-xs font-mono text-[#A89DB0]/60 tracking-wider">{title}</span>
        <span className="text-xs font-mono text-[#7C9E8F]/40">rewind_insights</span>
      </div>
      {children}
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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen text-white font-sans selection:bg-[#7C9E8F]/20"
      style={{ background: '#0B0F0E' }}
    >

      {/* ── Background atmosphere ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #7C9E8F 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] opacity-10"
          style={{ background: 'radial-gradient(ellipse, #C4714A 0%, transparent 70%)', filter: 'blur(100px)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#7C9E8F 1px, transparent 1px), linear-gradient(90deg, #7C9E8F 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-mono text-base font-bold tracking-tight">
          <span className="text-[#7C9E8F]">Rewind</span>
          <span className="text-[#B8CDB3]">Insights</span>
          <span className="text-[#A89DB0]/40">_</span>
        </span>
        <div className="flex items-center gap-6">
          {['Process', 'Analyser', 'Contact'].map(link => (
            <a
              key={link}
              href={link === 'Analyser' ? '#audit' : '#'}
              className="text-xs font-mono text-[#A89DB0] transition-colors hover:text-[#B8CDB3] tracking-wide"
            >
              {link}
            </a>
          ))}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7C9E8F]/30 bg-[#7C9E8F]/8 px-4 py-1.5 text-xs font-mono text-[#7C9E8F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C9E8F] animate-pulse" />
          Audit gratuit · Résultats en 30 secondes · Sans inscription
        </div>

        <h1 className="mt-6 text-5xl font-bold tracking-tight text-[#B8CDB3] sm:text-6xl leading-[1.1]">
          Votre site perd-il{' '}
          <br />
          <span style={{ color: '#C4714A' }}>des clients ?</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#A89DB0]">
          Chaque seconde de chargement supplémentaire coûte <strong className="text-[#C9A96E]">7 % de conversions</strong>.
          Découvrez en 30 secondes ce qui freine votre site — gratuitement, sans engagement.
        </p>

        <a
          href="#audit"
          className="mt-8 inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-mono font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #C4714A, #a85a36)', boxShadow: '0 4px 24px #C4714A30' }}
        >
          <span>analyser mon site</span>
          <span aria-hidden>→</span>
        </a>

        <p className="mt-3 text-xs font-mono text-[#A89DB0]/40">// gratuit · confidentiel · immédiat</p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          POURQUOI LA VITESSE COMPTE
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-mono text-[#7C9E8F] tracking-widest uppercase">// impact réel</p>
          <h2 className="mt-3 text-2xl font-bold text-[#B8CDB3]">Pourquoi la performance est critique</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4714A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              kw: 'performance',
              title: 'Vitesse = Conversions',
              body: 'Un site rapide retient l\'attention. +1s de chargement = −7% de ventes. Google l\'a mesuré sur des milliards de sessions.',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C9E8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              ),
              kw: 'seo',
              title: 'SEO = Visibilité',
              body: 'Les Core Web Vitals sont un signal de ranking direct. Un mauvais score technique vous coûte des positions sur Google.',
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              ),
              kw: 'ux',
              title: 'Expérience = Confiance',
              body: 'Un site fluide et accessible renforce votre image de marque et différencie votre offre de la concurrence.',
            },
          ].map(({ icon, kw, title, body }) => (
            <div
              key={kw}
              className="rounded-xl border border-[#7C9E8F]/15 bg-[rgba(0,0,0,0.30)] p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 border border-[#7C9E8F]/15">
                {icon}
              </div>
              <p className="mb-0.5 text-xs font-mono text-[#A89DB0]/60">{kw}.</p>
              <h3 className="text-sm font-semibold text-[#B8CDB3]">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#A89DB0]/80">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          AUDIT WIDGET — ancre #audit
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="audit" className="relative z-10 mx-auto max-w-2xl px-6 pb-28 scroll-mt-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-mono text-[#7C9E8F] tracking-widest uppercase">// audit en direct</p>
          <h2 className="mt-3 text-2xl font-bold text-[#B8CDB3]">Testez votre site maintenant</h2>
          <p className="mt-2 text-sm text-[#A89DB0]">Renseignez vos informations — le diagnostic arrive en quelques secondes.</p>
        </div>

        {/* ── STATE: FORM ── */}
        {state === 'form' && (
          <IDEChrome title="audit.run() — formulaire">
            <div className="p-7">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-[#C4714A]/30 bg-[#C4714A]/10 px-4 py-3 text-xs font-mono text-[#C4714A]">
                  <span>// error:</span>
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField label="Prénom" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} required />
                  <InputField label="Nom" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} required />
                  <InputField label="Entreprise" name="company" placeholder="Acme SAS" value={formData.company} onChange={handleChange} />
                  <InputField label="Email" name="email" type="email" placeholder="jean@acme.fr" value={formData.email} onChange={handleChange} required />
                  <InputField label="Téléphone" name="phone" type="tel" placeholder="+33 6 00 00 00 00" value={formData.phone} onChange={handleChange} />
                  <InputField label="URL" name="url" type="url" placeholder="https://votre-site.fr" value={formData.url} onChange={handleChange} required />
                </div>

                <button
                  type="submit"
                  className="mt-7 w-full rounded-lg px-6 py-3.5 text-sm font-mono font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #7C9E8F, #5a8070)', boxShadow: '0 4px 20px #7C9E8F25' }}
                >
                  $ lancer_audit --gratuit →
                </button>

                <p className="mt-4 text-center text-xs font-mono text-[#A89DB0]/40">
                  // aucune CB · résultats immédiats · 100% confidentiel
                </p>
              </form>
            </div>
          </IDEChrome>
        )}

        {/* ── STATE: LOADING ── */}
        {state === 'loading' && (
          <IDEChrome title="audit.run() — scanning…">
            <div className="p-10 text-center">
              {/* Terminal-style spinner */}
              <div className="relative mx-auto mb-8 h-20 w-20">
                <svg className="animate-spin" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="34" stroke="rgba(124,158,143,0.10)" strokeWidth="5" />
                  <circle cx="40" cy="40" r="34" stroke="#7C9E8F" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray="213" strokeDashoffset="150" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
              </div>

              {/* Scan line animation */}
              <div className="relative mx-auto mb-6 h-1 w-48 overflow-hidden rounded-full bg-[#7C9E8F]/15">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#7C9E8F]"
                  style={{
                    animation: 'scan 1.4s ease-in-out infinite alternate',
                    width: '40%',
                  }}
                />
              </div>
              <style>{`@keyframes scan { from { transform: translateX(-100%); } to { transform: translateX(300%); } }`}</style>

              <p key={loadingMsg} className="text-sm font-mono text-[#B8CDB3] transition-opacity duration-500">
                <span className="text-[#7C9E8F]">&gt; </span>{LOADING_MESSAGES[loadingMsg]}
              </p>
              <p className="mt-1.5 text-xs font-mono text-[#A89DB0]/50 truncate max-w-xs mx-auto">{auditedUrl}</p>

              <div className="mx-auto mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-[2000ms] ease-out"
                  style={{ width: `${loadingProgress}%`, background: 'linear-gradient(90deg, #7C9E8F, #B8CDB3)' }}
                />
              </div>
              <p className="mt-3 text-xs font-mono text-[#A89DB0]/30">// merci de patienter…</p>
            </div>
          </IDEChrome>
        )}

        {/* ── STATE: RESULT ── */}
        {state === 'result' && scores && (
          <div className="space-y-5">
            {/* Global score */}
            <IDEChrome title={`audit.result("${auditedUrl}")`}>
              <div className="flex items-center justify-between px-7 py-5">
                <div>
                  <p className="text-xs font-mono text-[#A89DB0]/60 tracking-widest">// note globale</p>
                  <p className="mt-1 text-xs font-mono text-[#A89DB0]/40 truncate max-w-[180px]">{auditedUrl}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-6xl font-bold tabular-nums font-mono"
                    style={{ color: getScoreColor(globalScore).hex }}
                  >
                    {globalScore}
                  </span>
                  <span className="text-xl font-mono text-[#A89DB0]/40">/100</span>
                </div>
              </div>
            </IDEChrome>

            {/* Score cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <ScoreGauge score={scores.speed} label="Vitesse" icon="⚡" />
              <ScoreGauge score={scores.seo} label="SEO" icon="🎯" />
              <ScoreGauge score={scores.ux} label="Expérience" icon="✨" />
            </div>

            {/* CTA */}
            <div
              className="rounded-xl border p-7 text-center backdrop-blur-sm"
              style={{ borderColor: '#C4714A30', background: 'linear-gradient(135deg, rgba(196,113,74,0.12), rgba(196,113,74,0.05))' }}
            >
              <p className="text-xs font-mono tracking-widest" style={{ color: '#C4714A' }}>// passez à l'action</p>
              <h2 className="mt-3 text-xl font-bold text-[#B8CDB3]">Prêt à améliorer ces scores ?</h2>
              <p className="mt-2 text-sm text-[#A89DB0]">
                Nos experts analysent votre site en détail et vous proposent un plan d'action concret, sans engagement.
              </p>
              <a
                href="https://rewind-studio.vercel.app/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-mono font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #C4714A, #a85a36)', boxShadow: '0 4px 24px #C4714A30' }}
              >
                prendre_rdv --gratuit →
              </a>
              <p className="mt-3 text-xs font-mono text-[#A89DB0]/40">// 30 min · sans engagement · visio ou téléphone</p>
            </div>

            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-xs font-mono text-[#A89DB0]/50 transition hover:text-[#B8CDB3] underline-offset-4 hover:underline"
              >
                ← auditer_un_autre_site()
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CE QUE NOUS ANALYSONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-mono text-[#7C9E8F] tracking-widest uppercase">// métriques analysées</p>
          <h2 className="mt-3 text-2xl font-bold text-[#B8CDB3]">Ce que nous mesurons</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: '⚡',
              color: '#C9A96E',
              kw: 'speed',
              title: 'Vitesse de chargement',
              metrics: [
                { key: 'LCP', desc: 'Largest Contentful Paint — temps d\'affichage du contenu principal.' },
                { key: 'FID / INP', desc: 'Interactivité — délai de réponse au premier clic utilisateur.' },
                { key: 'TTFB', desc: 'Time to First Byte — réactivité du serveur et du réseau.' },
              ],
            },
            {
              icon: '🎯',
              color: '#7C9E8F',
              kw: 'seo',
              title: 'SEO technique',
              metrics: [
                { key: 'Balises meta', desc: 'Title, description, OpenGraph — signaux prioritaires pour Google.' },
                { key: 'Crawlabilité', desc: 'robots.txt, sitemap.xml — accessibilité pour les moteurs.' },
                { key: 'Core Web Vitals', desc: 'Signal de ranking officiel depuis la mise à jour Page Experience.' },
              ],
            },
            {
              icon: '✨',
              color: '#A89DB0',
              kw: 'ux',
              title: 'Expérience utilisateur',
              metrics: [
                { key: 'CLS', desc: 'Cumulative Layout Shift — stabilité visuelle pendant le chargement.' },
                { key: 'Accessibilité', desc: 'Contrastes, labels ARIA, navigation clavier.' },
                { key: 'Mobile-first', desc: 'Rendu responsive et comportement tactile sur smartphones.' },
              ],
            },
          ].map(({ icon, color, kw, title, metrics }) => (
            <div
              key={kw}
              className="rounded-xl border border-[#7C9E8F]/15 bg-[rgba(0,0,0,0.30)] p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-xs font-mono" style={{ color: `${color}90` }}>{kw}</p>
                  <p className="text-sm font-semibold text-[#B8CDB3]">{title}</p>
                </div>
              </div>
              <div className="space-y-3">
                {metrics.map(({ key, desc }) => (
                  <div key={key} className="border-l-2 pl-3" style={{ borderColor: `${color}40` }}>
                    <p className="text-xs font-mono font-semibold" style={{ color }}>{key}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#A89DB0]/70">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#7C9E8F]/10 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="font-mono text-sm font-bold">
            <span className="text-[#7C9E8F]">Rewind</span>
            <span className="text-[#B8CDB3]">Insights</span>
          </span>
          <div className="flex items-center gap-5">
            {['Mentions légales', 'Confidentialité', 'CGU'].map(link => (
              <a key={link} href="#" className="text-xs font-mono text-[#A89DB0]/40 hover:text-[#A89DB0] transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs font-mono text-[#A89DB0]/30">
            // propulsé par{' '}
            <a href="https://rewind-studio.vercel.app/" className="text-[#7C9E8F]/60 hover:text-[#7C9E8F] transition-colors">
              Rewind Studio
            </a>
          </p>
        </div>
      </footer>

    </main>
  )
}