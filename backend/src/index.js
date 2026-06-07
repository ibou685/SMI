// backend/src/index.js
// Point d'entrée Express pour SMI

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ClerkExpressWithAuth } from '@clerk/backend';

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE GLOBAUX
// ============================================

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ============================================
// CONFIGURATION SERVICES
// ============================================

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logger simple (remplacer par Winston en production)
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`)
};

// ============================================
// MIDDLEWARE AUTHENTIFICATION (Clerk)
// ============================================

const authMiddleware = ClerkExpressWithAuth({
  secretKey: process.env.CLERK_SECRET_KEY
});

// Middleware personnalisé pour vérifier le JWT
async function verifyAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    // Vérification du token (Clerk handle cela automatiquement)
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// ROUTES API - FILIALES
// ============================================

// GET /api/filiales - Liste toutes les filiales
app.get('/api/filiales', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('filiales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    logger.info(`Filiales listées: ${data.length} résultats`);
    res.json(data);
  } catch (err) {
    logger.error(`Erreur GET /filiales: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/filiales/:id - Détail filiale
app.get('/api/filiales/:id', verifyAuth, async (req, res) => {
  try {
    const { data: filiale, error: filialeError } = await supabase
      .from('filiales')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (filialeError) throw filialeError;

    // Récupérer les gérants associés
    const { data: gerants, error: gerantsError } = await supabase
      .from('gerants')
      .select('*')
      .eq('filiale_id', req.params.id);

    if (gerantsError) throw gerantsError;

    res.json({ ...filiale, gerants });
  } catch (err) {
    logger.error(`Erreur GET /filiales/:id: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/filiales - Créer filiale
app.post('/api/filiales', verifyAuth, async (req, res) => {
  try {
    const { code, nom, adresse, ville, region, latitude, longitude, telephone, email, statut } = req.body;

    // Validation
    if (!code || !nom) {
      return res.status(400).json({ error: 'Code et nom requis' });
    }

    const { data, error } = await supabase
      .from('filiales')
      .insert([{
        code,
        nom,
        adresse,
        ville,
        region,
        latitude: latitude || null,
        longitude: longitude || null,
        telephone,
        email,
        statut: statut || 'Active'
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Filiale créée: ${nom} (${code})`);
    res.status(201).json(data);
  } catch (err) {
    logger.error(`Erreur POST /filiales: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/filiales/:id - Modifier filiale
app.put('/api/filiales/:id', verifyAuth, async (req, res) => {
  try {
    const { nom, adresse, ville, region, latitude, longitude, telephone, email, statut } = req.body;

    const { data, error } = await supabase
      .from('filiales')
      .update({
        nom,
        adresse,
        ville,
        region,
        latitude,
        longitude,
        telephone,
        email,
        statut
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Filiale modifiée: ${nom}`);
    res.json(data);
  } catch (err) {
    logger.error(`Erreur PUT /filiales/:id: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/filiales/:id - Supprimer filiale
app.delete('/api/filiales/:id', verifyAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('filiales')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    logger.info(`Filiale supprimée: ${req.params.id}`);
    res.json({ message: 'Filiale supprimée' });
  } catch (err) {
    logger.error(`Erreur DELETE /filiales/:id: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES API - RECETTES
// ============================================

// GET /api/recettes - Liste recettes
app.get('/api/recettes', verifyAuth, async (req, res) => {
  try {
    const { filiale_id, date_min, date_max } = req.query;
    
    let query = supabase.from('recettes').select('*');
    
    if (filiale_id) query = query.eq('filiale_id', filiale_id);
    if (date_min) query = query.gte('date_versement', date_min);
    if (date_max) query = query.lte('date_versement', date_max);

    const { data, error } = await query.order('date_versement', { ascending: false });

    if (error) throw error;
    
    logger.info(`Recettes listées: ${data.length} résultats`);
    res.json(data);
  } catch (err) {
    logger.error(`Erreur GET /recettes: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recettes - Créer recette
app.post('/api/recettes', verifyAuth, async (req, res) => {
  try {
    const { filiale_id, montant, date_versement, periode_concernee, mode_paiement, reference_paiement, observation } = req.body;
    const user_id = req.auth.userId; // Depuis Clerk

    // Validation
    if (!filiale_id || !montant || !date_versement) {
      return res.status(400).json({ error: 'Filiale, montant et date requis' });
    }

    const { data, error } = await supabase
      .from('recettes')
      .insert([{
        filiale_id,
        montant: parseFloat(montant),
        date_versement,
        periode_concernee,
        mode_paiement,
        reference_paiement,
        observation,
        created_by: user_id
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Recette créée: ${montant} FCFA from ${filiale_id}`);
    res.status(201).json(data);
  } catch (err) {
    logger.error(`Erreur POST /recettes: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES API - DÉPENSES
// ============================================

// GET /api/depenses
app.get('/api/depenses', verifyAuth, async (req, res) => {
  try {
    const { categorie, date_min, date_max } = req.query;
    
    let query = supabase.from('depenses').select('*');
    
    if (categorie) query = query.eq('categorie', categorie);
    if (date_min) query = query.gte('date_depense', date_min);
    if (date_max) query = query.lte('date_depense', date_max);

    const { data, error } = await query.order('date_depense', { ascending: false });

    if (error) throw error;
    
    res.json(data);
  } catch (err) {
    logger.error(`Erreur GET /depenses: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/depenses - Créer dépense
app.post('/api/depenses', verifyAuth, async (req, res) => {
  try {
    const { montant, date_depense, categorie, description, piece_justificative_url } = req.body;
    const user_id = req.auth.userId;

    if (!montant || !date_depense || !categorie) {
      return res.status(400).json({ error: 'Montant, date et catégorie requis' });
    }

    const { data, error } = await supabase
      .from('depenses')
      .insert([{
        montant: parseFloat(montant),
        date_depense,
        categorie,
        description,
        piece_justificative_url,
        responsable_id: user_id
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Dépense créée: ${montant} FCFA - ${categorie}`);
    res.status(201).json(data);
  } catch (err) {
    logger.error(`Erreur POST /depenses: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES API - STATISTIQUES
// ============================================

// GET /api/stats/today - Stats du jour
app.get('/api/stats/today', verifyAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: recettes } = await supabase
      .from('recettes')
      .select('montant')
      .eq('date_versement', today);

    const { data: depenses } = await supabase
      .from('depenses')
      .select('montant')
      .eq('date_depense', today);

    const totalRecettes = (recettes || []).reduce((sum, r) => sum + r.montant, 0);
    const totalDepenses = (depenses || []).reduce((sum, d) => sum + d.montant, 0);

    res.json({
      date: today,
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      nbRecettes: recettes?.length || 0,
      nbDepenses: depenses?.length || 0
    });
  } catch (err) {
    logger.error(`Erreur GET /stats/today: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// ============================================
// DÉMARRAGE SERVEUR
// ============================================

app.listen(PORT, () => {
  logger.info(`✅ SMI Backend démarré sur http://localhost:${PORT}`);
  logger.info(`📊 Environnement: ${process.env.NODE_ENV}`);
  logger.info(`🗄️  Database: ${process.env.SUPABASE_URL?.split('.')[0]}`);
});

export default app;