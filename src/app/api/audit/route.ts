import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. On essaie de lire les données reçues
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Le Front-end n'a pas envoyé un JSON valide." }, { status: 400 });
    }

    const { prenom, nom, entreprise, email, telephone, url_site } = body;

    // 2. On vérifie si le client Supabase existe bien
    if (!supabase) {
      return NextResponse.json({ error: "Le client Supabase n'est pas initialisé (il vaut undefined)." }, { status: 500 });
    }

    console.log("Tentative d'insertion...", { prenom, nom, email, url_site });

    // 3. On tente l'insertion avec un try/catch dédié pour chasser le bug
    let newLead;
    try {
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .insert([
          {
            prenom: prenom || 'Test',
            nom: nom || 'Test',
            entreprise: entreprise || null,
            email: email || 'test@test.fr',
            telephone: telephone || null,
            url_site: url_site || 'https://test.com',
            statut: 'pending'
          }
        ])
        .select()
        .single();

      if (supabaseError) {
        return NextResponse.json({ error: "Supabase a refusé l'insertion", details: supabaseError }, { status: 500 });
      }
      newLead = data;
    } catch (sbException: any) {
      return NextResponse.json({ error: "Crash total pendant l'appel Supabase", details: sbException.message }, { status: 500 });
    }

    // 4. Si on arrive ici, l'insertion a marché ! On simule les scores
    return NextResponse.json({
      success: true,
      leadId: newLead?.id,
      scores: { vitesse: 85, seo: 90, ux: 75, globale: 83 }
    });

  } catch (globalError: any) {
    return NextResponse.json({
      error: "Erreur critique inconnue dans la route",
      details: globalError.message,
      stack: globalError.stack
    }, { status: 500 });
  }
}