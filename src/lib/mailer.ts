import nodemailer from 'nodemailer'

// ─── Commentaires par score et catégorie ─────────────────────────────────────
function getComment(category: 'speed' | 'seo' | 'ux', score: number): { headline: string; body: string } {
  if (category === 'speed') {
    if (score >= 80) return {
      headline: 'Votre site charge vite — c\'est un vrai avantage.',
      body: 'La vitesse est souvent négligée par vos concurrents. Vos visiteurs restent, les leurs partent. Maintenir ce niveau demande une attention régulière.',
    }
    if (score >= 50) return {
      headline: 'Chaque seconde de délai vous coûte des clients.',
      body: 'À ce niveau, environ 1 visiteur sur 4 quitte votre site avant même de voir votre offre. Ce n\'est pas une estimation — c\'est ce que Google mesure sur des milliards de sessions.',
    }
    return {
      headline: 'Votre site est trop lent pour convertir.',
      body: 'En dessous de 50/100, les pertes sont massives : taux de rebond élevé, positions Google en chute, prospects qui filent chez un concurrent plus rapide. C\'est le problème le plus rentable à corriger en premier.',
    }
  }

  if (category === 'seo') {
    if (score >= 80) return {
      headline: 'Votre SEO technique est solide.',
      body: 'Google peut lire, indexer et comprendre vos pages correctement. La prochaine étape, c\'est travailler la stratégie de contenu pour aller chercher plus de trafic qualifié.',
    }
    if (score >= 50) return {
      headline: 'Google vous voit, mais pas assez bien.',
      body: 'Des signaux techniques manquants limitent votre visibilité. Des corrections ciblées peuvent vous faire remonter plusieurs positions sans toucher une ligne de contenu.',
    }
    return {
      headline: 'Votre site est quasiment invisible sur Google.',
      body: 'En dessous de 50/100, les moteurs ont du mal à comprendre et référencer vos pages. Vous produisez du contenu que personne ne trouve. Une fuite silencieuse mais constante.',
    }
  }

  if (score >= 80) return {
    headline: 'L\'expérience utilisateur est au niveau.',
    body: 'Votre site est accessible, lisible et agréable à naviguer. C\'est ce qui transforme un visiteur curieux en prospect convaincu.',
  }
  if (score >= 50) return {
    headline: 'Des frictions invisibles freinent vos conversions.',
    body: 'Contrastes insuffisants, navigation hésitante, éléments mal adaptés au mobile — ces détails créent une impression de manque de soin. Un prospect qui doute ne signe pas.',
  }
  return {
    headline: 'L\'expérience utilisateur pénalise votre image.',
    body: 'Une partie de vos visiteurs abandonne simplement parce que le site est difficile à utiliser. Sur mobile, c\'est encore plus marqué. Corriger cela, c\'est récupérer des leads que vous perdez sans le savoir.',
  }
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Bon'
  if (score >= 50) return 'À améliorer'
  return 'Critique'
}

function scoreColor(score: number): string {
  if (score >= 80) return '#1a7a4a'
  if (score >= 50) return '#b45309'
  return '#c0392b'
}

// ─── Template HTML sobre ──────────────────────────────────────────────────────
function buildEmailHtml(opts: {
  firstName: string
  url: string
  scores: { speed: number; seo: number; ux: number }
}): string {
  const { firstName, url, scores } = opts
  const global = Math.round((scores.speed + scores.seo + scores.ux) / 3)

  const row = (label: string, score: number, cat: 'speed' | 'seo' | 'ux') => {
    const { headline, body } = getComment(cat, score)
    const color = scoreColor(score)
    const badge = scoreLabel(score)
    return `
      <tr>
        <td style="padding:0 0 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:16px 20px;background:#f9f9f9;border-radius:6px;border-left:3px solid ${color};">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <span style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
                    </td>
                    <td align="right">
                      <span style="font-size:22px;font-weight:700;color:${color};">${score}<span style="font-size:13px;font-weight:400;color:#aaa;">/100</span></span>
                      <span style="margin-left:8px;font-size:11px;color:${color};background:${color}18;border-radius:4px;padding:2px 8px;">${badge}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:12px;">
                      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a1a1a;">${headline}</p>
                      <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${body}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Votre audit web — Rewind Insights</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #eeeeee;">
              <span style="font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.02em;">
                Rewind<span style="color:#2d6a4f;">Insights</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Intro -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 8px;font-size:16px;color:#1a1a1a;">Bonjour ${firstName},</p>
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
                      Votre audit est prêt. Voici les résultats pour <strong>${url}</strong>, analysés en temps réel via notre outil.
                    </p>
                  </td>
                </tr>

                <!-- Score global -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:20px 24px;background:#f9f9f9;border-radius:6px;text-align:center;">
                          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.08em;">Note globale</p>
                          <p style="margin:0;font-size:48px;font-weight:700;color:${scoreColor(global)};">${global}<span style="font-size:18px;color:#aaa;font-weight:400;">/100</span></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Scores détail -->
                ${row('Vitesse', scores.speed, 'speed')}
                ${row('SEO', scores.seo, 'seo')}
                ${row('Expérience utilisateur', scores.ux, 'ux')}

                <!-- CTA -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:24px;background:#f9f9f9;border-radius:6px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#1a1a1a;">Prêt à corriger ça ?</p>
                          <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.6;">
                            On analyse votre site en profondeur et on vous propose un plan d'action concret.<br>15/20 minutes, sans engagement.
                          </p>
                          <a href="https://rewind-studio.vercel.app/"
                             style="display:inline-block;background:#2d6a4f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;">
                            Prendre rendez-vous gratuitement
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                Rewind Studio · <a href="https://rewind-studio.vercel.app/" style="color:#aaa;">rewind-studio.vercel.app</a>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#ccc;">
                Vous recevez cet email car vous avez demandé un audit sur notre site.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Version texte brut (anti-spam essentiel) ────────────────────────────────
function buildEmailText(opts: {
  firstName: string
  url: string
  scores: { speed: number; seo: number; ux: number }
}): string {
  const { firstName, url, scores } = opts
  const global = Math.round((scores.speed + scores.seo + scores.ux) / 3)

  return `Bonjour ${firstName},

Votre audit est prêt pour ${url}.

NOTE GLOBALE : ${global}/100

VITESSE : ${scores.speed}/100 — ${scoreLabel(scores.speed)}
${getComment('speed', scores.speed).headline}
${getComment('speed', scores.speed).body}

SEO : ${scores.seo}/100 — ${scoreLabel(scores.seo)}
${getComment('seo', scores.seo).headline}
${getComment('seo', scores.seo).body}

EXPÉRIENCE UTILISATEUR : ${scores.ux}/100 — ${scoreLabel(scores.ux)}
${getComment('ux', scores.ux).headline}
${getComment('ux', scores.ux).body}

---

Prêt à corriger ça ?
On analyse votre site en profondeur et on vous propose un plan d'action concret.
30 minutes, sans engagement.

Prendre rendez-vous : https://rewind-studio.vercel.app/

--
Rewind Studio
https://rewind-studio.vercel.app/`
}

// ─── Transporter ─────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// ─── Export principal ─────────────────────────────────────────────────────────
export async function sendAuditEmail(opts: {
  firstName: string
  lastName: string
  email: string
  url: string
  scores: { speed: number; seo: number; ux: number }
}) {
  const { firstName, lastName, email, url, scores } = opts
  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"Rewind Insights" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.GMAIL_USER,
    to: `${firstName} ${lastName} <${email}>`,
    bcc: process.env.GMAIL_USER,
    subject: `Votre audit web — ${url}`,
    text: buildEmailText({ firstName, url, scores }),   // texte brut = clé anti-spam
    html: buildEmailHtml({ firstName, url, scores }),
  })
}