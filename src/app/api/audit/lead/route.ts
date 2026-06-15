// src/app/api/audit/lead/route.ts
//
// Étape 2 du tunnel bifurqué :
//   - Reçoit les infos lead (nom, prénom, email…) + l'URL + le leadId du scan
//   - Met à jour le row Supabase existant avec toutes les infos (statut: "done")
//   - Si le leadId est absent (cas rare), insère un nouveau row complet
//   - Retourne { success, leadId, scores }

import { NextResponse } from 'next/server'
import { supabase }     from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface LeadPayload {
  // Infos du formulaire de capture
  firstName?: string
  lastName?:  string
  company?:   string
  email:      string
  phone?:     string
  // Passées depuis le frontend
  url:        string
  leadId?:    string | null
  scores?:    { speed: number; seo: number; ux: number } | null
}

export async function POST(request: Request) {
  try {

    // ── 1. Parse & validation ─────────────────────────────────────────────
    let body: LeadPayload
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body invalide : JSON mal formé' }, { status: 400 })
    }

    const { firstName, lastName, company, email, phone, url, leadId, scores } = body

    if (!email) return NextResponse.json({ error: 'Champ "email" manquant' }, { status: 400 })
    if (!url)   return NextResponse.json({ error: 'Champ "url" manquant' },   { status: 400 })

    let finalLeadId = leadId ?? null

    // ── 2. Mise à jour ou insertion ───────────────────────────────────────
    if (finalLeadId) {
      // Cas nominal : on complète le row créé lors du scan
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          prenom:     firstName  || null,
          nom:        lastName   || null,
          entreprise: company    || null,
          email,
          telephone:  phone      || null,
          scores:     scores     || null,
          statut:     'done',
          converted_at: new Date().toISOString(),
        })
        .eq('id', finalLeadId)

      if (updateError) {
        console.error('[lead] Supabase update error:', updateError.message)
        return NextResponse.json({
          error:            'Échec mise à jour Supabase',
          supabase_message: updateError.message,
        }, { status: 500 })
      }

      console.log('[lead] Row mis à jour, id =', finalLeadId)

    } else {
      // Cas de secours : leadId absent (scan n'a pas pu pré-insérer)
      // On crée un row complet directement
      const { data, error: insertError } = await supabase
        .from('leads')
        .insert([{
          prenom:     firstName  || null,
          nom:        lastName   || null,
          entreprise: company    || null,
          email,
          telephone:  phone      || null,
          url_site:   url,
          scores:     scores     || null,
          statut:     'done',
          converted_at: new Date().toISOString(),
        }])
        .select('id')
        .single()

      if (insertError) {
        console.error('[lead] Supabase insert error:', insertError.message)
        return NextResponse.json({
          error:            'Échec insertion Supabase',
          supabase_message: insertError.message,
        }, { status: 500 })
      }

      finalLeadId = data?.id ?? null
      console.log('[lead] Nouveau row inséré, id =', finalLeadId)
    }

    // ── 3. Réponse ────────────────────────────────────────────────────────
    return NextResponse.json({ success: true, leadId: finalLeadId, scores }, { status: 200 })

  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
