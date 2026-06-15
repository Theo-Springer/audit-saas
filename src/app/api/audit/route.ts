// src/app/api/audit/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {

    // ── 1. Parse du body ──────────────────────────────────────────────────
    let body: Record<string, string>;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Body invalide : JSON mal formé', detail: String(e) },
        { status: 400 }
      );
    }

    const { firstName, lastName, company, email, phone, url } = body;

    if (!url)   return NextResponse.json({ error: 'Champ "url" manquant' },   { status: 400 });
    if (!email) return NextResponse.json({ error: 'Champ "email" manquant' }, { status: 400 });

    // ── 2. Calcul des scores PageSpeed ────────────────────────────────────
    const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY;
    let scores = { speed: 0, seo: 0, ux: 0 };

    if (!PAGESPEED_KEY) {
      console.warn('[audit] PAGESPEED_API_KEY absent — scores simulés');
      scores = {
        speed: Math.floor(Math.random() * 40) + 45,
        seo:   Math.floor(Math.random() * 30) + 55,
        ux:    Math.floor(Math.random() * 35) + 50,
      };
    } else {
      try {
        const psUrl =
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
          `?url=${encodeURIComponent(url)}` +
          `&strategy=mobile` +
          `&key=${PAGESPEED_KEY}` +
          `&category=PERFORMANCE` +
          `&category=SEO` +
          `&category=ACCESSIBILITY`;

        console.log('[audit] Appel PageSpeed pour :', url);
        const psRes = await fetch(psUrl);

        if (!psRes.ok) {
          const raw = await psRes.text();
          return NextResponse.json({
            error:         'PageSpeed API erreur HTTP',
            http_status:   psRes.status,
            response_body: raw.slice(0, 600),
          }, { status: 500 });
        }

        const psData = await psRes.json();
        const cats = psData?.lighthouseResult?.categories;

        if (!cats) {
          return NextResponse.json({
            error: 'Réponse PageSpeed inattendue',
            raw:   JSON.stringify(psData).slice(0, 600),
          }, { status: 500 });
        }

        scores = {
          speed: Math.round((cats.performance?.score   ?? 0) * 100),
          seo:   Math.round((cats.seo?.score           ?? 0) * 100),
          ux:    Math.round((cats.accessibility?.score ?? 0) * 100),
        };

        console.log('[audit] Scores PageSpeed :', scores);

      } catch (e) {
        return NextResponse.json(
          { error: "Erreur réseau PageSpeed", detail: String(e) },
          { status: 500 }
        );
      }
    }

    // ── 3. Insertion Supabase NON-BLOQUANTE ───────────────────────────────
    // On n'attend pas Supabase pour répondre à l'utilisateur
    // ── 3. Insertion Supabase BLOQUANTE ──
const { data, error: sbError } = await supabase
  .from('leads')
  .insert([{
    prenom:     firstName || null,
    nom:        lastName  || null,
    entreprise: company   || null,
    email,
    telephone:  phone     || null,
    url_site:   url,
    scores,
    statut:     'done',
  }])
  .select('id')
  .single()

if (sbError) {
  console.error('[audit] Échec insertion Supabase :', sbError.message)
} else {
  console.log('[audit] Lead inséré, id =', data?.id)
}

// ── 4. Réponse ──
return NextResponse.json({ success: true, scores }, { status: 200 })

    // ── 4. Réponse immédiate avec les scores ──────────────────────────────
    return NextResponse.json({ success: true, scores }, { status: 200 });

  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({
      error:  'Erreur critique',
      detail: err.message,
    }, { status: 500 });
  }
}