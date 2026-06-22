# Rewind Insights

**Outil d'audit web gratuit** — analysez la performance, le SEO et l'expérience utilisateur de n'importe quel site en moins d'une minute, sans inscription.

🔗 **[Accéder à l'outil](https://rewind-insights.vercel.app/)**

---

## Aperçu

![Résultat d'audit — score global](./docs/screenshot-score.png)
![Détail des métriques](./docs/screenshot-detail.png)

---

## Fonctionnalités

- **Score global /100** sur trois axes : Vitesse, SEO, Expérience utilisateur
- **Métriques Google officielles** : LCP, INP, TTFB, CLS, Core Vitals
- **Analyse SEO technique** : balises meta, Open Graph, robots.txt, sitemap, canonical
- **Rapport par email** envoyé automatiquement après l'audit
- **Historique des audits** sauvegardé en base de données
- **Capture de leads** : les informations clients sont stockées pour un suivi commercial
- Aucune inscription requise, 100% gratuit

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript 5 |
| Style | Tailwind CSS 4 |
| Base de données | Supabase (PostgreSQL) |
| Scraping SEO | Cheerio |
| APIs externes | Google PageSpeed Insights |
| Emails | Resend |
| Déploiement | Vercel |

---

## Installation locale

### Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com)
- Une clé API [Google PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started)
- Un compte [Resend](https://resend.com) pour les emails

### 1. Cloner le repo

```bash
git clone https://github.com/Theo-Springer/audit-saas.git
cd audit-saas
npm install
```

### 2. Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_PAGESPEED_API_KEY=your_google_api_key
RESEND_API_KEY=your_resend_api_key
```

### 3. Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
src/
├── app/
│   ├── api/          # Routes API Next.js (audit, email, leads)
│   ├── audit/        # Page de résultats
│   └── page.tsx      # Landing page
├── components/       # Composants React
└── lib/              # Supabase client, helpers
```

---

## Auteur

**Théo Springer** — [github.com/Theo-Springer](https://github.com/Theo-Springer)
