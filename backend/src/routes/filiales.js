// backend/src/routes/filiales.js
// Routes de gestion des filiales (CRUD complet) - Jour 2

import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();


// ============================================
// GET /api/filiales - Lister toutes filiales
// ============================================
router.get('/', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('filiales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Erreur GET /filiales:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET /api/filiales/:id - Détail filiale
// ============================================
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: filiale, error: filialeError } = await supabase
      .from('filiales')
      .select('*')
      .eq('id', id)
      .single();

    if (filialeError) throw filialeError;

    // Récupérer gérants
    const { data: gerants } = await supabase
      .from('gerants')
      .select('*')
      .eq('filiale_id', id);

    // Récupérer recettes derniers 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentes } = await supabase
      .from('recettes')
      .select('*')
      .eq('filiale_id', id)
      .gte('date_versement', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date_versement', { ascending: false })
      .limit(10);

    res.json({
      ...filiale,
      gerants: gerants || [],
      recentRecettes: recentes || []
    });
  } catch (err) {
    console.error('Erreur GET /filiales/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /api/filiales - Créer filiale
// ============================================
router.post(
  '/',
  verifyAuth,
  [
    body('code').trim().notEmpty().withMessage('Code requis'),
    body('nom').trim().notEmpty().withMessage('Nom requis'),
    body('ville').trim().notEmpty().withMessage('Ville requise'),
    body('telephone').optional().trim(),
    body('email').optional().isEmail(),
    body('statut')
      .optional()
      .isIn(['Active', 'Suspendue', 'Fermée'])
      .withMessage('Statut invalide')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        code,
        nom,
        adresse,
        ville,
        region,
        latitude,
        longitude,
        telephone,
        email,
        statut = 'Active'
      } = req.body;

      // Vérifier que le code est unique
      const { data: existing } = await supabase
        .from('filiales')
        .select('id')
        .eq('code', code)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Code déjà utilisé' });
      }

      const { data, error } = await supabase
        .from('filiales')
        .insert([
          {
            code,
            nom,
            adresse: adresse || null,
            ville,
            region: region || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            telephone: telephone || null,
            email: email || null,
            statut
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log(`Filiale créée: ${nom} (${code})`);

      // Log audit
      await supabase.from('audit_log').insert({
        utilisateur_id: req.auth?.userId || 'unknown',
        action: 'CREATE',
        type_entite: 'filiales',
        entite_id: data.id,
        description: `Création filiale: ${nom}`,
        adresse_ip: req.ip
      });

      res.status(201).json(data);
    } catch (err) {
      console.error('Erreur POST /filiales:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// PUT /api/filiales/:id - Modifier filiale
// ============================================
router.put(
  '/:id',
  verifyAuth,
  [
    param('id').isUUID('Invalid filiale ID'),
    body('nom').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('telephone').optional().trim(),
    body('statut')
      .optional()
      .isIn(['Active', 'Suspendue', 'Fermée'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('filiales')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`Filiale modifiée: ${data.nom}`);

      // Log audit
      await supabase.from('audit_log').insert({
        utilisateur_id: req.auth?.userId || 'unknown',
        action: 'UPDATE',
        type_entite: 'filiales',
        entite_id: id,
        description: `Modification filiale`,
        adresse_ip: req.ip
      });

      res.json(data);
    } catch (err) {
      console.error('Erreur PUT /filiales/:id:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ============================================
// DELETE /api/filiales/:id - Supprimer filiale
// ============================================
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier qu'il n'y a pas de recettes
    const { data: recettes } = await supabase
      .from('recettes')
      .select('id')
      .eq('filiale_id', id)
      .limit(1);

    if (recettes && recettes.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer: filiale a des versements'
      });
    }

    const { error } = await supabase
      .from('filiales')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`Filiale supprimée: ${id}`);

    // Log audit
    await supabase.from('audit_log').insert({
      utilisateur_id: req.auth?.userId || 'unknown',
      action: 'DELETE',
      type_entite: 'filiales',
      entite_id: id,
      description: 'Suppression filiale',
      adresse_ip: req.ip
    });

    res.json({ message: 'Filiale supprimée' });
  } catch (err) {
    console.error('Erreur DELETE /filiales/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// POST /api/filiales/:id/gerants - Ajouter gérant
// ============================================
router.post('/:id/gerants', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_complet, telephone, email, adresse, numero_identification } = req.body;

    if (!nom_complet) {
      return res.status(400).json({ error: 'Nom complet requis' });
    }

    const { data, error } = await supabase
      .from('gerants')
      .insert([
        {
          filiale_id: id,
          nom_complet,
          telephone: telephone || null,
          email: email || null,
          adresse: adresse || null,
          numero_identification: numero_identification || null,
          date_nomination: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log(`Gérant ajouté: ${nom_complet}`);

    res.status(201).json(data);
  } catch (err) {
    console.error('Erreur POST gerants:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;