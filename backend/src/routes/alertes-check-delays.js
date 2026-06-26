// backend/src/routes/alertes-check-delays.js
// Vérification des retards de versement

import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// ============================================
// POST /api/alertes/check-delays - Vérifier retards
// ============================================
router.post('/check-delays', async (req, res) => {
  try {
    console.log('\n🔍 Vérification des retards de versement...');

    // ✅ LIRE LES PARAMÈTRES DYNAMIQUES
    const { data: params, error: paramError } = await supabase
      .from('parametres')
      .select('joursretardpaiement')
      .single();

    if (paramError || !params) {
      return res.status(400).json({ error: 'Paramètres non trouvés' });
    }

    const joursRetard = params.joursretardpaiement || 1;
    console.log(`📅 Seuil de retard: ${joursRetard} jours`);

    // Calculer la date limite
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - joursRetard);
    const dateLimitISO = dateLimit.toISOString().split('T')[0];

    console.log(`📊 Cherchant les versements avant le ${dateLimitISO}...`);

    // Chercher les recettes (versements) qui n'ont pas été payées et qui sont en retard
    const { data: retardedRecettes, error: recetteError } = await supabase
      .from('recettes')
      .select('id, filiale_id, montant, date_versement')
      .lt('date_versement', dateLimitISO);

    if (recetteError) throw recetteError;

    console.log(`📨 Trouvé ${(retardedRecettes || []).length} versements en retard`);

    let alertesCreees = 0;

    // Créer une alerte pour chaque versement en retard
    for (const recette of retardedRecettes || []) {
      // Vérifier qu'une alerte n'existe pas déjà pour ce versement
      const { data: existingAlert } = await supabase
        .from('alertes')
        .select('id')
        .eq('description', `Versement en retard depuis ${joursRetard} jours - ID: ${recette.id}`)
        .single();

      if (!existingAlert) {
        // Chercher la filiale pour avoir le nom
        const { data: filiale } = await supabase
          .from('filiales')
          .select('nom')
          .eq('id', recette.filiale_id)
          .single();

        const filialeName = filiale?.nom || 'Filiale inconnue';

        await supabase.from('alertes').insert({
          titre: `Retard de versement - ${filialeName}`,
          description: `Versement en retard depuis ${joursRetard} jours - ID: ${recette.id}`,
          type: 'Retard paiement',
          statut: 'Active',
          created_by: 'system'
        });

        alertesCreees++;
        console.log(`✅ Alerte créée pour versement ${recette.id} (${recette.montant} FCFA)`);
      }
    }

    console.log(`\n✅ ${alertesCreees} alerte(s) de retard créée(s)\n`);

    res.json({
      message: 'Vérification complétée',
      joursRetard,
      retardsDetectes: (retardedRecettes || []).length,
      alertesCreees,
      timestamp: new Date().toLocaleString('fr-FR')
    });
  } catch (err) {
    console.error('❌ Erreur check-delays:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /api/alertes/check-delays - Version GET (pour les tests)
// ============================================
router.get('/check-delays', async (req, res) => {
  // Redirect to POST
  return router._router.stack.find(layer => layer.route?.path === '/check-delays' && layer.route?.methods?.post)
    ? await router._router.stack.find(layer => layer.route?.path === '/check-delays' && layer.route?.methods?.post)(req, res)
    : res.status(405).json({ error: 'Utilise POST /api/alertes/check-delays' });
});

export default router;
