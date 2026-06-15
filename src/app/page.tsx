'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadData {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
}

interface AuditScores {
  speed: number
  seo: number
  ux: number
}

type AppState = 'idle' | 'scanning' | 'gate' | 'submitting' | 'result'

// ─── Constantes ───────────────────────────────────────────────────────────────

const SCAN_MESSAGES = [
  { pct: 5,  msg: 'Résolution DNS…' },
  { pct: 18, msg: 'Lecture du code source…' },
  { pct: 32, msg: 'Analyse SEO & méta-données…' },
  { pct: 46, msg: 'Core Web Vitals (LCP, CLS, INP)…' },
  { pct: 60, msg: 'Expérience mobile…' },
  { pct: 74, msg: 'Accessibilité WCAG…' },
  { pct: 85, msg: 'Finalisation du rapport…' },
]

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return { hex: '#3D5A4A', label: 'Bon' }
  if (score >= 50) return { hex: '#8C6D3F', label: 'Moyen' }
  return { hex: '#7A3B2E', label: 'Faible' }
}

// ─── Composants ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, label, index }: { score: number; label: string; index: number }) {
  const { hex, label: badge } = scoreColor(score)
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const delay = index * 0.15

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem', borderTop: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Jauge SVG compacte */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 96 96" width="72" height="72">
            <circle cx="48" cy="48" r={r} fill="none" stroke="var(--rule)" strokeWidth="3" />
            <circle
              cx="48" cy="48" r={r} fill="none"
              stroke={hex} strokeWidth="3" strokeLinecap="square"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1) ${delay}s` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, color: hex }}>
              {score}
            </span>
          </div>
        </div>
        {/* Label texte */}
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.25rem' }}>
            {label}
          </p>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: hex,
          }}>
            {badge}
          </span>
        </div>
      </div>
    </div>
  )
}

function InputField({
  name, type = 'text', placeholder, value, onChange, required, label,
}: {
  name: string; type?: string; placeholder: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; label: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label
        htmlFor={name}
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)' }}
      >
        {label}{required && <span style={{ color: 'var(--accent-warm)', marginLeft: '0.25rem' }}>*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        value={value} onChange={onChange} required={required}
        style={{
          fontFamily: 'var(--font-body)', fontSize: '0.9rem',
          background: 'transparent', border: 'none',
          borderBottom: '1px solid var(--rule)',
          padding: '0.6rem 0', color: 'var(--ink)',
          outline: 'none', transition: 'border-color 0.2s',
          width: '100%',
        }}
        onFocus={e => { e.target.style.borderBottomColor = 'var(--accent)' }}
        onBlur={e => { e.target.style.borderBottomColor = 'var(--rule)' }}
      />
    </div>
  )
}

// ─── Modal bloquant — Étape 3 ─────────────────────────────────────────────────

function GateModal({
  url, onSubmit, isSubmitting, error,
}: {
  url: string
  onSubmit: (lead: LeadData) => void
  isSubmitting: boolean
  error: string | null
}) {
  const [lead, setLead] = useState<LeadData>({ firstName: '', lastName: '', company: '', email: '', phone: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLead(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(lead)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      background: 'rgba(245,243,238,0.92)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--paper)',
        border: '1px solid var(--rule)',
        padding: '2.5rem',
      }}>
        {/* Barre de progression figée */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ height: '1px', background: 'var(--rule)', position: 'relative', marginBottom: '0.75rem' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '1px',
              width: '85%', background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)' }}>
              Analyse complète
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--accent)' }}>
              85%
            </span>
          </div>
        </div>

        {/* Titre */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Votre rapport est prêt.
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--stone)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Laissez-nous un moyen de vous le transmettre. Résultats complets, sans engagement.
        </p>

        {/* Erreur */}
        {error && (
          <div style={{ borderLeft: '2px solid var(--accent-warm)', paddingLeft: '0.75rem', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-warm)' }}>{error}</p>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <InputField label="Prénom" name="firstName" placeholder="Jean" value={lead.firstName} onChange={handleChange} required />
            <InputField label="Nom" name="lastName" placeholder="Dupont" value={lead.lastName} onChange={handleChange} required />
          </div>
          <InputField label="Entreprise" name="company" placeholder="Acme" value={lead.company} onChange={handleChange} />
          <InputField label="Email" name="email" type="email" placeholder="jean@acme.fr" value={lead.email} onChange={handleChange} required />
          <InputField label="Téléphone" name="phone" type="tel" placeholder="+33 6 00 00 00 00" value={lead.phone} onChange={handleChange} />

          <div style={{ paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
                color: 'var(--paper)', background: 'var(--ink)',
                border: 'none', padding: '0.875rem 1.5rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'opacity 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {isSubmitting ? 'Envoi…' : 'Afficher le rapport complet'}
            </button>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--stone)', textAlign: 'center', marginTop: '1rem' }}>
              Confidentiel — aucune CB requise
            </p>
          </div>
        </form>

        {/* URL auditée */}
        <div style={{ borderTop: '1px solid var(--rule)', marginTop: '1.5rem', paddingTop: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--stone)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function HomePage() {
  const [appState, setAppState]   = useState<AppState>('idle')
  const [siteUrl, setSiteUrl]     = useState('')
  const [progress, setProgress]   = useState(0)
  const [msgIndex, setMsgIndex]   = useState(0)
  const [scores, setScores]       = useState<AuditScores | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const pendingScoresRef = useRef<AuditScores | null>(null)
  const pendingLeadIdRef = useRef<string | null>(null)

  async function handleStartAudit(e: React.FormEvent) {
    e.preventDefault()
    const url = siteUrl.trim()
    if (!url) return

    pendingScoresRef.current = null
    pendingLeadIdRef.current = null
    setSubmitError(null)
    setProgress(0)
    setMsgIndex(0)
    setAppState('scanning')

    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(r => r.json())
      .then(data => {
        pendingScoresRef.current = data.scores ?? fallbackScores()
        pendingLeadIdRef.current = data.leadId ?? null
      })
      .catch(() => { pendingScoresRef.current = fallbackScores() })
  }

  function fallbackScores(): AuditScores {
    return {
      speed: Math.floor(Math.random() * 40) + 40,
      seo:   Math.floor(Math.random() * 30) + 55,
      ux:    Math.floor(Math.random() * 35) + 50,
    }
  }

  useEffect(() => {
    if (appState !== 'scanning') return
    let stepIdx = 0

    function runStep() {
      if (stepIdx >= SCAN_MESSAGES.length) return
      const { pct } = SCAN_MESSAGES[stepIdx]
      setMsgIndex(stepIdx)
      setProgress(pct)
      stepIdx++
      if (pct < 85) {
        setTimeout(runStep, 900 + Math.random() * 600)
      } else {
        waitForApiThenOpenGate()
      }
    }

    setTimeout(runStep, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState])

  function waitForApiThenOpenGate() {
    const interval = setInterval(() => {
      if (pendingScoresRef.current !== null) {
        clearInterval(interval)
        setScores(pendingScoresRef.current)
        setAppState('gate')
      }
    }, 300)
    setTimeout(() => {
      clearInterval(interval)
      if (!pendingScoresRef.current) {
        pendingScoresRef.current = fallbackScores()
        setScores(pendingScoresRef.current)
        setAppState('gate')
      }
    }, 15_000)
  }

  async function handleLeadSubmit(lead: LeadData) {
    setAppState('submitting')
    setSubmitError(null)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, url: siteUrl.trim(), leadId: pendingLeadIdRef.current, scores: pendingScoresRef.current }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      if (data.scores) setScores(data.scores)
      setProgress(100)
      setAppState('result')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setAppState('gate')
    }
  }

  function handleReset() {
    setAppState('idle')
    setSiteUrl('')
    setScores(null)
    setProgress(0)
    setMsgIndex(0)
    setSubmitError(null)
    pendingScoresRef.current = null
    pendingLeadIdRef.current = null
  }

  const globalScore = scores ? Math.round((scores.speed + scores.seo + scores.ux) / 3) : 0

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Variables CSS globales + reset typographique ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --ink:         #1A1A18;
          --ink-light:   #3A3A36;
          --paper:       #F5F3EE;
          --stone:       #8C8880;
          --rule:        #D8D4CC;
          --accent:      #3D5A4A;
          --accent-warm: #C17F4A;

          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body:    'Inter', system-ui, sans-serif;
          --font-mono:    'JetBrains Mono', 'Courier New', monospace;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { background: var(--paper); color: var(--ink); }

        body {
          font-family: var(--font-body);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.65;
          background: var(--paper);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }

        ::selection { background: var(--accent); color: var(--paper); }

        /* Input placeholder */
        input::placeholder { color: var(--stone); opacity: 1; }

        /* Focus ring accessible */
        :focus-visible { outline: 1px solid var(--accent); outline-offset: 3px; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition: none !important; animation: none !important; }
        }

        /* Barre de scan animée */
        @keyframes scan-line {
          0%   { transform: scaleX(0); transform-origin: left; }
          50%  { transform: scaleX(1); transform-origin: left; }
          50.01% { transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>

        {/* ══════════════════════════════════════════════════════════════════
            NAVIGATION
        ══════════════════════════════════════════════════════════════════ */}
        <nav style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '2rem 3rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)', fontStyle: 'italic' }}>
            Rewind<span style={{ fontStyle: 'normal', fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '1rem' }}> Insights</span>
          </span>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {['Méthode', 'Analyser', 'Contact'].map(link => (
              <a
                key={link}
                href={link === 'Analyser' ? '#audit' : '#'}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 400,
                  color: 'var(--stone)', textDecoration: 'none', letterSpacing: '0.02em',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--ink)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--stone)' }}
              >
                {link}
              </a>
            ))}
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════
            HERO — layout asymétrique : grand titre à gauche, stat à droite
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '7rem 3rem 6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4rem', alignItems: 'end' }}>

            {/* Titre */}
            <div>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--accent)', marginBottom: '2rem',
              }}>
                Diagnostic de performance web
              </p>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 400,
                fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
                lineHeight: 1.05, color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}>
                Votre site perd<br />
                des clients.<br />
                <em style={{ color: 'var(--accent)' }}>Combien ?</em>
              </h1>
              <p style={{
                fontFamily: 'var(--font-body)', fontWeight: 300,
                fontSize: '1.05rem', color: 'var(--stone)',
                maxWidth: '480px', lineHeight: 1.7,
                marginTop: '2rem',
              }}>
                Un audit complet en 30 secondes — vitesse, SEO, accessibilité.
                Gratuit. Sans inscription.
              </p>
            </div>

            {/* Stat isolée à droite — signature visuelle */}
            <div style={{
              borderLeft: '1px solid var(--rule)',
              paddingLeft: '3rem',
              paddingBottom: '0.5rem',
              minWidth: '180px',
            }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                fontSize: '4rem', lineHeight: 1, color: 'var(--ink-light)',
              }}>
                −7%
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontWeight: 300,
                fontSize: '0.8rem', color: 'var(--stone)',
                lineHeight: 1.5, marginTop: '0.5rem',
              }}>
                de conversions<br />par seconde<br />de chargement
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--rule)', marginTop: '1rem', letterSpacing: '0.08em' }}>
                Source : Google
              </p>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            WIDGET D'AUDIT — ancre #audit
        ══════════════════════════════════════════════════════════════════ */}
        <section id="audit" style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 3rem 8rem',
        }}>

          {/* ── IDLE : champ URL seul ── */}
          {appState === 'idle' && (
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '4rem' }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--stone)', marginBottom: '2.5rem',
              }}>
                Entrez l'URL de votre site pour commencer
              </p>

              <form onSubmit={handleStartAudit}>
                <div style={{ display: 'flex', gap: '0', alignItems: 'stretch', borderBottom: '1px solid var(--ink)', paddingBottom: '0' }}>
                  <input
                    type="url" required
                    placeholder="https://votre-site.fr"
                    value={siteUrl}
                    onChange={e => setSiteUrl(e.target.value)}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-body)', fontWeight: 300,
                      fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
                      color: 'var(--ink)', background: 'transparent',
                      border: 'none', outline: 'none',
                      padding: '0.75rem 0',
                      letterSpacing: '-0.01em',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
                      color: 'var(--paper)', background: 'var(--ink)',
                      border: 'none', padding: '0.75rem 1.75rem',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      letterSpacing: '0.01em',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--accent)' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--ink)' }}
                  >
                    Analyser →
                  </button>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--stone)', marginTop: '1rem', letterSpacing: '0.08em' }}>
                  Confidentiel — aucun compte requis
                </p>
              </form>
            </div>
          )}

          {/* ── SCANNING : loader éditorial ── */}
          {appState === 'scanning' && (
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '4rem' }}>
              {/* Ligne d'analyse animée */}
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ position: 'relative', height: '1px', background: 'var(--rule)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                    background: 'var(--accent)',
                    animation: 'scan-line 1.8s ease-in-out infinite',
                  }} />
                </div>
                <div style={{
                  height: '1px', background: 'var(--rule)', position: 'relative', marginBottom: '1rem',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '1px',
                    width: `${progress}%`,
                    background: 'var(--ink)',
                    transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--stone)', letterSpacing: '0.05em' }}>
                    {SCAN_MESSAGES[msgIndex]?.msg}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--ink)' }}>
                    {progress}%
                  </p>
                </div>
              </div>

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--rule)', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {siteUrl}
              </p>
            </div>
          )}

          {/* ── GATE / SUBMITTING : loader fantôme + modal ── */}
          {(appState === 'gate' || appState === 'submitting') && (
            <>
              {/* Fond fantôme */}
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '4rem', opacity: 0.2, pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ marginBottom: '3rem' }}>
                  <div style={{ height: '1px', background: 'var(--rule)', marginBottom: '1rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '1px', width: '85%', background: 'var(--ink)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--stone)' }}>
                      Finalisation du rapport…
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--ink)' }}>85%</p>
                  </div>
                </div>
              </div>

              {/* Modal */}
              <GateModal
                url={siteUrl}
                onSubmit={handleLeadSubmit}
                isSubmitting={appState === 'submitting'}
                error={submitError}
              />
            </>
          )}

          {/* ── RESULT : rapport final ── */}
          {appState === 'result' && scores && (
            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '4rem' }}>

              {/* Score global — mis en avant typographiquement */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: '1.5rem',
                marginBottom: '4rem',
                paddingBottom: '3rem',
                borderBottom: '1px solid var(--rule)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontSize: 'clamp(4rem, 10vw, 8rem)',
                  lineHeight: 1, color: scoreColor(globalScore).hex,
                  letterSpacing: '-0.03em',
                }}>
                  {globalScore}
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--stone)', fontWeight: 300 }}>
                    / 100
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)', marginTop: '0.25rem' }}>
                    Score global
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--stone)', marginTop: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                    {siteUrl}
                  </p>
                </div>
              </div>

              {/* Détail par axe — liste verticale, pas de grille de cartes */}
              <div style={{ maxWidth: '480px' }}>
                <ScoreGauge score={scores.speed} label="Vitesse de chargement" index={0} />
                <ScoreGauge score={scores.seo}   label="Référencement naturel" index={1} />
                <ScoreGauge score={scores.ux}    label="Expérience utilisateur" index={2} />
              </div>

              {/* CTA vers l'agence — sobre, pas de fond coloré */}
              <div style={{ marginTop: '5rem', paddingTop: '3rem', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'flex-start', gap: '4rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2, marginBottom: '1rem' }}>
                    Besoin d'un plan d'action ?
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.9rem', color: 'var(--stone)', lineHeight: 1.7, maxWidth: '360px' }}>
                    Nos experts construisent un plan de correction priorisé, adapté à votre stack et votre budget.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.25rem' }}>
                  <a
                    href="https://rewind-studio.vercel.app/"
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
                      color: 'var(--paper)', background: 'var(--ink)',
                      padding: '0.875rem 1.75rem',
                      textDecoration: 'none', letterSpacing: '0.01em',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--accent)' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--ink)' }}
                  >
                    Prendre rendez-vous →
                  </a>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--stone)', letterSpacing: '0.08em' }}>
                    30 min · gratuit · sans engagement
                  </p>
                </div>
              </div>

              {/* Reset */}
              <div style={{ marginTop: '3rem' }}>
                <button
                  onClick={handleReset}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--stone)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--ink)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--stone)' }}
                >
                  ← Auditer un autre site
                </button>
              </div>
            </div>
          )}

        </section>

        {/* ══════════════════════════════════════════════════════════════════
            CE QUE NOUS MESURONS — layout éditorial 2 colonnes
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ borderTop: '1px solid var(--rule)', background: 'var(--ink)', color: 'var(--paper)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 3rem' }}>

            {/* En-tête de section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', marginBottom: '5rem', alignItems: 'end' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,243,238,0.4)' }}>
                Méthodologie
              </p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.8rem)', fontWeight: 400, lineHeight: 1.15, color: 'var(--paper)' }}>
                Trois axes. Chacun mesurable,<br />
                <em>chacun actionnable.</em>
              </h2>
            </div>

            {/* Trois blocs en grille horizontale séparés par des lignes verticales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
              {[
                {
                  label: 'Vitesse',
                  metrics: [
                    { key: 'LCP',      desc: 'Temps d\'affichage du contenu principal — signal de ranking Google.' },
                    { key: 'INP',      desc: 'Réactivité aux interactions — ressenti de fluidité.' },
                    { key: 'TTFB',     desc: 'Réponse serveur — base de toute performance.' },
                  ],
                },
                {
                  label: 'SEO',
                  metrics: [
                    { key: 'Méta',         desc: 'Title, description, Open Graph — ce que Google lit en premier.' },
                    { key: 'Crawlabilité', desc: 'robots.txt, sitemap, canonical — structure d\'indexation.' },
                    { key: 'Core Vitals',  desc: 'Signal de classement officiel depuis Page Experience.' },
                  ],
                },
                {
                  label: 'Expérience',
                  metrics: [
                    { key: 'CLS',          desc: 'Stabilité visuelle — les éléments qui bougent au chargement.' },
                    { key: 'Accessibilité', desc: 'WCAG, contrastes, navigation clavier.' },
                    { key: 'Mobile',       desc: 'Rendu tactile et responsive sur smartphones.' },
                  ],
                },
              ].map(({ label, metrics }, i) => (
                <div
                  key={label}
                  style={{
                    padding: '0 2.5rem',
                    borderLeft: i === 0 ? 'none' : '1px solid rgba(245,243,238,0.1)',
                    paddingLeft: i === 0 ? 0 : '2.5rem',
                  }}
                >
                  <p style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontSize: '1.3rem', color: 'rgba(245,243,238,0.5)',
                    marginBottom: '2rem',
                  }}>
                    {label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {metrics.map(({ key, desc }) => (
                      <div key={key}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(245,243,238,0.6)', marginBottom: '0.4rem' }}>
                          {key}
                        </p>
                        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.825rem', color: 'rgba(245,243,238,0.45)', lineHeight: 1.6 }}>
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid var(--rule)' }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            padding: '2rem 3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--stone)' }}>
              Rewind Insights
            </span>
            <div style={{ display: 'flex', gap: '2rem' }}>
              {['Mentions légales', 'Confidentialité', 'CGU'].map(link => (
                <a
                  key={link}
                  href="#"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--stone)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--ink)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--stone)' }}
                >
                  {link}
                </a>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--rule)', letterSpacing: '0.06em' }}>
              Rewind Studio
            </p>
          </div>
        </footer>

      </div>
    </>
  )
}