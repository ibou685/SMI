// backend/src/routes/recettes.js
// Routes de gestion des recettes (versements) - Jour 3

import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();


// ============================================
// GET /api/recettes - Lister recettes avec filtres
// ============================================
router.get(
  '/',
  verifyAuth,
  [
    query('filiale_id').optional().isUUID(),
    query('date_min').optional().isISO8601(),
    query('date_max').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { filiale_id, date_min, date_max, limit = 50 } = req.query;

      let query = supabase
        .from('recettes')
        .select('*, filiales(nom, code)')
        .order('date_versement', { ascending: false });

      if (filiale_id) {
        query = query.eq('filiale_id', filiale_id);
      }

      if (date_min) {
        query = query.gte('date_versement', date_min);
      }

      if (date_max) {
        query = query.lte('date_versement', date_max);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;

      res.json(data || []);
    } catch (err) {
      console.error('Erreur GET /recettes:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// GET /api/recettes/:id - Détail recette
// ============================================
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('recettes')
      .select('*, filiales(nom, code)')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erreur GET /recettes/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /api/recettes - Créer recette (versement)
// ============================================
router.post(
  '/',
  verifyAuth,
  [
    body('filiale_id').isUUID('Invalid filiale ID'),
    body('montant')
      .isFloat({ min: 0.01 })
      .withMessage('Montant doit être > 0'),
    body('date_versement')
      .isISO8601()
      .withMessage('Date format invalide'),
    body('mode_paiement')
      .optional()
      .trim(),
    body('reference_paiement')
      .optional()
      .trim(),
    body('observation')
      .optional()
      .trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        filiale_id,
        montant,
        date_versement,
        periode_concernee,
        mode_paiement,
        reference_paiement,
        observation
      } = req.body;

      const { data, error } = await supabase
        .from('recettes')
        .insert([
          {
            filiale_id,
            montant: parseFloat(montant),
            date_versement,
            periode_concernee: periode_concernee || null,
            mode_paiement: mode_paiement || null,
            reference_paiement: reference_paiement || null,
            observation: observation || null,
            created_by: req.auth?.userId || 'unknown'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log(`Recette créée: ${montant} FCFA de ${filiale_id}`);

      // Log audit
      await supabase.from('audit_log').insert({
        utilisateur_id: req.auth?.userId || 'unknown',
        action: 'CREATE',
        type_entite: 'recettes',
        entite_id: data.id,
        description: `Création recette: ${montant} FCFA`,
        adresse_ip: req.ip
      });

      // Vérifier si écheance complétée
      const { data: echeance } = await supabase
        .from('echeances_versements')
        .select('*')
        .eq('filiale_id', filiale_id)
        .eq('date_limite', date_versement)
        .gt('montant_attendu', 0)
        .single();

      if (echeance) {
        const newMontantRecu = (echeance.montant_recu || 0) + montant;
        const newStatut = newMontantRecu >= echeance.montant_attendu ? 'Payé' : 'Partiellement payé';

        await supabase
          .from('echeances_versements')
          .update({
            montant_recu: newMontantRecu,
            statut: newStatut
          })
          .eq('id', echeance.id);
      }

      res.status(201).json(data);
    } catch (err) {
      console.error('Erreur POST /recettes:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// PUT /api/recettes/:id - Modifier recette
// ============================================
router.put(
  '/:id',
  verifyAuth,
  [
    body('montant').optional().isFloat({ min: 0.01 }),
    body('observation').optional().trim()
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('recettes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`Recette modifiée: ${id}`);

      // Log audit
      await supabase.from('audit_log').insert({
        utilisateur_id: req.auth?.userId || 'unknown',
        action: 'UPDATE',
        type_entite: 'recettes',
        entite_id: id,
        description: 'Modification recette',
        adresse_ip: req.ip
      });

      res.json(data);
    } catch (err) {
      console.error('Erreur PUT /recettes/:id:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// DELETE /api/recettes/:id - Supprimer recette
// ============================================
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('recettes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`Recette supprimée: ${id}`);

    // Log audit
    await supabase.from('audit_log').insert({
      utilisateur_id: req.auth?.userId || 'unknown',
      action: 'DELETE',
      type_entite: 'recettes',
      entite_id: id,
      description: 'Suppression recette',
      adresse_ip: req.ip
    });

    res.json({ message: 'Recette supprimée' });
  } catch (err) {
    console.error('Erreur DELETE /recettes/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /api/recettes/stats/today - Stats journalières
// ============================================
router.get('/stats/today', verifyAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: recettes, error: recError } = await supabase
      .from('recettes')
      .select('montant')
      .eq('date_versement', today);

    if (recError) throw recError;

    const total = (recettes || []).reduce((sum, r) => sum + r.montant, 0);

    res.json({
      date: today,
      totalRecettes: total,
      nbRecettes: recettes?.length || 0,
      moyenneRecette: recettes?.length > 0 ? total / recettes.length : 0
    });
  } catch (err) {
    console.error('Erreur stats today:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /api/recettes/stats/month/:month - Stats mensuelles
// ============================================
router.get('/stats/month/:month', verifyAuth, async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    const [year, monthNum] = month.split('-');

    const dateMin = `${month}-01`;
    const dateMax = `${year}-${(parseInt(monthNum) + 1).toString().padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('recettes')
      .select('*, filiales(nom)')
      .gte('date_versement', dateMin)
      .lt('date_versement', dateMax)
      .order('date_versement', { ascending: false });

    if (error) throw error;

    const totalRecettes = (data || []).reduce((sum, r) => sum + r.montant, 0);

    // Grouper par filiale
    const byFiliale = {};
    (data || []).forEach((r) => {
      if (!byFiliale[r.filiale_id]) {
        byFiliale[r.filiale_id] = {
          nom: r.filiales?.nom,
          count: 0,
          total: 0
        };
      }
      byFiliale[r.filiale_id].count++;
      byFiliale[r.filiale_id].total += r.montant;
    });

    res.json({
      month,
      totalRecettes,
      nbRecettes: data?.length || 0,
      byFiliale: Object.values(byFiliale),
      recettes: data || []
    });
  } catch (err) {
    console.error('Erreur stats month:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;