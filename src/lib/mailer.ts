import nodemailer from 'nodemailer'

// ─── Palette (cohérente avec le site) ────────────────────────────────────────
const C = {
  bg:      '#0B0F0E',
  surface: '#111815',
  kw:      '#7C9E8F',   // vert sauge
  str:     '#B8CDB3',   // vert pâle
  fn:      '#C4714A',   // terra cotta CTA
  var:     '#C9A96E',   // or
  key:     '#A89DB0',   // mauve grisé
  border:  '#1E2B27',
}

// ─── Commentaires par score et catégorie ─────────────────────────────────────
function getComment(category: 'speed' | 'seo' | 'ux', score: number): { headline: string; body: string } {
  if (category === 'speed') {
    if (score >= 80) return {
      headline: 'Votre site charge vite — c\'est un vrai avantage.',
      body: 'La vitesse est souvent négligée. Vos visiteurs restent, vos concurrents perdent les leurs. Mais maintenir ce niveau demande une attention régulière.',
    }
    if (score >= 50) return {
      headline: 'Chaque seconde de délai vous coûte des clients.',
      body: 'À ce niveau de performance, environ 1 visiteur sur 4 quitte votre site avant même de voir votre offre. Ce n\'est pas une hypothèse — c\'est ce que Google mesure sur des milliards de sessions.',
    }
    return {
      headline: 'Votre site est trop lent pour convertir.',
      body: 'En dessous de 50/100, les pertes sont massives : taux de rebond élevé, positions Google en chute, et prospects qui partent chez un concurrent plus rapide. C\'est le problème le plus rentable à corriger en premier.',
    }
  }

  if (category === 'seo') {
    if (score >= 80) return {
      headline: 'Votre SEO technique est solide.',
      body: 'Google peut lire, indexer et comprendre votre site correctement. C\'est la base. La prochaine étape, c\'est travailler la stratégie de contenu pour aller chercher plus de trafic qualifié.',
    }
    if (score >= 50) return {
      headline: 'Google vous voit, mais pas assez bien.',
      body: 'Des signaux techniques manquants ou mal configurés limitent votre visibilité. Des corrections ciblées peuvent vous faire remonter plusieurs positions sans changer une ligne de contenu.',
    }
    return {
      headline: 'Votre site est quasiment invisible sur Google.',
      body: 'En dessous de 50/100 en SEO technique, les moteurs de recherche ont du mal à comprendre et référencer vos pages. Vous produisez du contenu que personne ne trouve. C\'est une fuite silencieuse mais constante.',
    }
  }

  // ux
  if (score >= 80) return {
    headline: 'L\'expérience utilisateur est au niveau.',
    body: 'Votre site est accessible, lisible et agréable à naviguer. C\'est ce qui transforme un visiteur curieux en prospect convaincu. Continuez à le faire évoluer avec votre audience.',
  }
  if (score >= 50) return {
    headline: 'Des frictions invisibles freinent vos conversions.',
    body: 'Contrastes insuffisants, navigation hésitante, éléments mal adaptés au mobile — ces détails paraissent mineurs mais ils créent une impression de manque de soin. Et un prospect qui doute ne signe pas.',
  }
  return {
    headline: 'L\'expérience utilisateur pénalise votre image.',
    body: 'À ce niveau, une partie de vos visiteurs abandonne simplement parce que le site est difficile à utiliser. Sur mobile, c\'est encore plus marqué. Corriger cela, c\'est récupérer des leads que vous perdez sans le savoir.',
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return C.kw
  if (score >= 50) return C.var
  return C.fn
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Bon'
  if (score >= 50) return 'À améliorer'
  return 'Critique'
}

// ─── Bloc score HTML ──────────────────────────────────────────────────────────
function scoreBlock(
  category: 'speed' | 'seo' | 'ux',
  score: number,
  label: string,
  icon: string,
): string {
  const color = scoreColor(score)
  const badge = scoreLabel(score)
  const { headline, body } = getComment(category, score)

  return `
  <div style="background:${C.surface};border:1px solid ${C.border};border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">${icon}</span>
        <span style="font-family:monospace;font-size:13px;color:${C.key};letter-spacing:0.05em;">${label}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:4px;">
        <span style="font-family:monospace;font-size:32px;font-weight:700;color:${color};">${score}</span>
        <span style="font-family:monospace;font-size:14px;color:${C.key};">/100</span>
        <span style="font-family:monospace;font-size:11px;color:${color};background:${color}18;border-radius:6px;padding:2px 8px;margin-left:8px;">${badge}</span>
      </div>
    </div>
    <div style="border-left:2px solid ${color}40;padding-left:14px;">
      <p style="font-family:monospace;font-size:13px;font-weight:600;color:${C.str};margin:0 0 6px 0;">${headline}</p>
      <p style="font-size:13px;color:${C.key};line-height:1.7;margin:0;">${body}</p>
    </div>
  </div>`
}

// ─── Template email complet ───────────────────────────────────────────────────
function buildEmailHtml(opts: {
  firstName: string
  url: string
  scores: { speed: number; seo: number; ux: number }
}): string {
  const { firstName, url, scores } = opts
  const global = Math.round((scores.speed + scores.seo + scores.ux) / 3)
  const globalColor = scoreColor(global)

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060908;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:36px;">
      <span style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
        <span style="color:${C.kw};">Rewind</span><span style="color:${C.str};">Insights</span><span style="color:${C.key}40;">_</span>
      </span>
      <p style="font-family:monospace;font-size:11px;color:${C.key};margin:8px 0 0;letter-spacing:0.12em;">// rapport d'audit web</p>
    </div>

    <!-- Intro -->
    <div style="background:${C.surface};border:1px solid ${C.border};border-radius:12px;padding:28px;margin-bottom:20px;">
      <p style="color:${C.str};font-size:15px;line-height:1.7;margin:0 0 12px;">
        Bonjour ${firstName},
      </p>
      <p style="color:${C.key};font-size:14px;line-height:1.7;margin:0;">
        Votre audit est prêt. Voici les résultats pour <span style="font-family:monospace;color:${C.kw};">${url}</span> — analysé en temps réel via Google PageSpeed Insights.
      </p>
    </div>

    <!-- Score global -->
    <div style="background:${C.surface};border:1px solid ${globalColor}30;border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
      <p style="font-family:monospace;font-size:11px;color:${C.key};letter-spacing:0.1em;margin:0 0 12px;">// note globale</p>
      <div style="display:inline-flex;align-items:baseline;gap:4px;">
        <span style="font-family:monospace;font-size:56px;font-weight:700;color:${globalColor};">${global}</span>
        <span style="font-family:monospace;font-size:20px;color:${C.key};">/100</span>
      </div>
      <p style="font-family:monospace;font-size:12px;color:${C.key};margin:8px 0 0;">${url}</p>
    </div>

    <!-- Scores détaillés -->
    ${scoreBlock('speed', scores.speed, 'Vitesse', '⚡')}
    ${scoreBlock('seo',   scores.seo,   'SEO',     '🎯')}
    ${scoreBlock('ux',    scores.ux,    'Expérience utilisateur', '✨')}

    <!-- CTA -->
    <div style="background:linear-gradient(135deg,rgba(196,113,74,0.15),rgba(196,113,74,0.05));border:1px solid ${C.fn}30;border-radius:12px;padding:28px;margin-top:8px;text-align:center;">
      <p style="font-family:monospace;font-size:11px;color:${C.fn};letter-spacing:0.1em;margin:0 0 10px;">// passez à l'action</p>
      <p style="font-size:17px;font-weight:600;color:${C.str};margin:0 0 8px;">Prêt à corriger ça ?</p>
      <p style="font-size:13px;color:${C.key};line-height:1.7;margin:0 0 20px;">
        On analyse votre site en profondeur et on vous propose un plan d'action concret. 30 minutes, sans engagement.
      </p>
      <a href="https://rewind-studio.vercel.app/"
         style="display:inline-block;background:linear-gradient(135deg,#C4714A,#a85a36);color:#fff;text-decoration:none;font-family:monospace;font-size:13px;font-weight:600;padding:12px 28px;border-radius:8px;">
        prendre_rdv --gratuit →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-family:monospace;font-size:11px;color:${C.key}40;margin:0;">
        // propulsé par <a href="https://rewind-studio.vercel.app/" style="color:${C.kw}60;text-decoration:none;">Rewind Studio</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

// ─── Transporter Nodemailer ───────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// ─── Fonction principale ──────────────────────────────────────────────────────
export async function sendAuditEmail(opts: {
  firstName: string
  lastName: string
  email: string
  url: string
  scores: { speed: number; seo: number; ux: number }
}) {
  const { firstName, lastName, email, url, scores } = opts
  const html = buildEmailHtml({ firstName, url, scores })
  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"Rewind Insights" <${process.env.GMAIL_USER}>`,
    to: email,
    bcc: process.env.GMAIL_USER, // copie à vous-même
    subject: `Votre audit web — ${url}`,
    html,
  })
}