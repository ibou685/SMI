// backend/src/routes/depenses.js
// Routes de gestion des dépenses - AVEC PARAMÈTRES DYNAMIQUES

import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const CATEGORIES = [
  'Salaires',
  'Eau',
  'Électricité',
  'Carburant',
  'Loyer',
  'Maintenance',
  'Fournitures',
  'Communication',
  'Divers'
];

// ============================================
// GET /api/depenses - Lister dépenses avec filtres
// ============================================
router.get(
  '/',
  [
    query('categorie').optional().isIn(CATEGORIES),
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
      const { categorie, date_min, date_max, limit = 50 } = req.query;

      let queryBuilder = supabase
        .from('depenses')
        .select('*')
        .order('date_depense', { ascending: false });

      if (categorie) {
        queryBuilder = queryBuilder.eq('categorie', categorie);
      }

      if (date_min) {
        queryBuilder = queryBuilder.gte('date_depense', date_min);
      }

      if (date_max) {
        queryBuilder = queryBuilder.lte('date_depense', date_max);
      }

      const { data, error } = await queryBuilder.limit(limit);

      if (error) throw error;

      res.json(data || []);
    } catch (err) {
      console.error('Erreur GET /depenses:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// GET /api/depenses/categories - Lister catégories
// ============================================
router.get('/categories', async (req, res) => {
  res.json(CATEGORIES);
});

// ============================================
// GET /api/depenses/:id - Détail dépense
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('depenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Erreur GET /depenses/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /api/depenses - Créer dépense
// ============================================
router.post(
  '/',
  [
    body('montant')
      .isFloat({ min: 0.01 })
      .withMessage('Montant doit être > 0'),
    body('date_depense')
      .isISO8601()
      .withMessage('Date format invalide'),
    body('categorie')
      .isIn(CATEGORIES)
      .withMessage('Catégorie invalide'),
    body('description')
      .optional()
      .trim(),
    body('piece_justificative_url')
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
        montant,
        date_depense,
        categorie,
        description,
        piece_justificative_url
      } = req.body;

      const { data, error } = await supabase
        .from('depenses')
        .insert([
          {
            montant: parseFloat(montant),
            date_depense,
            categorie,
            description: description || null,
            piece_justificative_url: piece_justificative_url || null,
            created_by: 'system'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Dépense créée: ${montant} FCFA - ${categorie}`);

      // ✅ LIRE LE SEUIL DYNAMIQUEMENT DES PARAMÈTRES
      const { data: params, error: paramError } = await supabase
        .from('parametres')
        .select('montantlimitedépense')
        .single();

      const seuilAlerte = params?.montantlimitedépense || 50000000;

      console.log(`📊 Paramètres reçus:`, params);  // ✅ AJOUTE CETTE LIGNE
      console.log(`📊 Seuil alerte: ${seuilAlerte}`);  // ✅ ET CELLE-CI    

      // Vérifier si dépense dépasse le seuil
      if (montant > seuilAlerte) {
        console.log(`🚨 Alerte: Dépense de ${montant} dépasse le seuil de ${seuilAlerte}`);
        
        await supabase.from('alertes').insert({
          titre: 'Dépense inhabituelle détectée',
          description: `Dépense de ${montant} FCFA (${categorie}) dépasse le seuil de ${seuilAlerte} FCFA`,
          type: 'Dépense inhabituelle',
          statut: 'Active',
          created_by: 'system'
        });
      }

      res.status(201).json(data);
    } catch (err) {
      console.error('❌ Erreur POST /depenses:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// PUT /api/depenses/:id - Modifier dépense
// ============================================
router.put(
  '/:id',
  [
    body('montant').optional().isFloat({ min: 0.01 }),
    body('categorie').optional().isIn(CATEGORIES),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('depenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Dépense modifiée: ${id}`);

      res.json(data);
    } catch (err) {
      console.error('❌ Erreur PUT /depenses/:id:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// DELETE /api/depenses/:id - Supprimer dépense
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('depenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Dépense supprimée: ${id}`);

    res.json({ message: 'Dépense supprimée' });
  } catch (err) {
    console.error('❌ Erreur DELETE /depenses/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /api/depenses/stats/by-category - Stats par catégorie
// ============================================
router.get('/stats/by-category', async (req, res) => {
  try {
    const { date_min, date_max } = req.query;

    let queryBuilder = supabase.from('depenses').select('*');

    if (date_min) {
      queryBuilder = queryBuilder.gte('date_depense', date_min);
    }
    if (date_max) {
      queryBuilder = queryBuilder.lte('date_depense', date_max);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    // Grouper par catégorie
    const byCategory = {};
    (data || []).forEach((d) => {
      if (!byCategory[d.categorie]) {
        byCategory[d.categorie] = { count: 0, total: 0 };
      }
      byCategory[d.categorie].count++;
      byCategory[d.categorie].total += d.montant;
    });

    const totalDepenses = (data || []).reduce((sum, d) => sum + d.montant, 0);

    res.json({
      total: totalDepenses,
      byCategory: Object.entries(byCategory).map(([categorie, stats]) => ({
        categorie,
        ...stats,
        percentage: totalDepenses > 0 ? ((stats.total / totalDepenses) * 100).toFixed(1) : 0
      })),
      count: data?.length || 0
    });
  } catch (err) {
    console.error('❌ Erreur stats by-category:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;