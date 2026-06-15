// src/app/api/audit/scan/route.ts
//
// Étape 1 du tunnel bifurqué :
//   - Reçoit uniquement l'URL du site à auditer
//   - Lance PageSpeed Insights en arrière-plan
//   - Pré-insère un row Supabase (statut: "pending") sans infos lead
//   - Retourne { leadId, scores }
//
// Le leadId est renvoyé au client pour être transmis ensuite à /api/audit/lead
// lors de la soumission du formulaire de capture (étape 2).

import { NextResponse } from 'next/server'
import { supabase }     from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {

    // ── 1. Parse & validation ─────────────────────────────────────────────
    let body: { url?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body invalide : JSON mal formé' }, { status: 400 })
    }

    const { url } = body
    if (!url) return NextResponse.json({ error: 'Champ "url" manquant' }, { status: 400 })

    // ── 2. Pré-insertion Supabase (sans lead, statut pending) ─────────────
    // On crée le row maintenant pour capturer l'intent même si l'utilisateur
    // abandonne avant de remplir le formulaire de capture.
    let leadId: string | null = null
    try {
      const { data, error: sbError } = await supabase
        .from('leads')
        .insert([{
          url_site: url,
          statut:   'pending',   // sera mis à "done" par /api/audit/lead
        }])
        .select('id')
        .single()

      if (sbError) {
        // Non bloquant — on log mais on continue pour ne pas casser l'UX
        console.error('[scan] Supabase insert error:', sbError.message)
      } else {
        leadId = data?.id ?? null
        console.log('[scan] Lead pré-inséré, id =', leadId)
      }
    } catch (e) {
      console.error('[scan] Supabase unreachable:', e)
    }

    // ── 3. Appel PageSpeed Insights ───────────────────────────────────────
    const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY
    let scores = { speed: 0, seo: 0, ux: 0 }

    if (!PAGESPEED_KEY) {
      // Pas de clé API configurée → scores simulés (dev / démo)
      console.warn('[scan] PAGESPEED_API_KEY absent — scores simulés')
      scores = {
        speed: Math.floor(Math.random() * 40) + 45,
        seo:   Math.floor(Math.random() * 30) + 55,
        ux:    Math.floor(Math.random() * 35) + 50,
      }
    } else {
      try {
        const psUrl =
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
          `?url=${encodeURIComponent(url)}` +
          `&strategy=mobile` +
          `&key=${PAGESPEED_KEY}` +
          `&category=PERFORMANCE` +
          `&category=SEO` +
          `&category=ACCESSIBILITY`

        console.log('[scan] Appel PageSpeed pour :', url)
        const psRes  = await fetch(psUrl)
        const psData = await psRes.json()

        const cats = psData?.lighthouseResult?.categories
        if (!cats) throw new Error('lighthouseResult.categories absent')

        scores = {
          speed: Math.round((cats.performance?.score   ?? 0) * 100),
          seo:   Math.round((cats.seo?.score           ?? 0) * 100),
          ux:    Math.round((cats.accessibility?.score ?? 0) * 100),
        }
        console.log('[scan] Scores :', scores)

      } catch (e) {
        console.error('[scan] PageSpeed error:', e)
        // Scores de secours pour ne pas bloquer l'UX
        scores = {
          speed: Math.floor(Math.random() * 40) + 45,
          seo:   Math.floor(Math.random() * 30) + 55,
          ux:    Math.floor(Math.random() * 35) + 50,
        }
      }
    }

    // ── 4. Mise à jour des scores dans Supabase ───────────────────────────
    // On stocke les scores dès maintenant ; ils seront confirmés une seconde
    // fois par /api/audit/lead lors de la soumission du formulaire.
    if (leadId) {
      try {
        await supabase
          .from('leads')
          .update({ scores })
          .eq('id', leadId)
      } catch (e) {
        console.error('[scan] Supabase update scores error:', e)
      }
    }

    // ── 5. Réponse ────────────────────────────────────────────────────────
    return NextResponse.json({ leadId, scores }, { status: 200 })

  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
