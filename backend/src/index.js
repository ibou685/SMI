// backend/src/index.js - VERSION STABLE AVEC ALERTES DYNAMIQUES

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import rateLimit from 'express-rate-limit';
import schedule from 'node-schedule';

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// SUPABASE
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://smi-gamma.vercel.app'  // ✅ AJOUTE CETTE LIGNE
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(helmet());
console.log('✅ CORS & Helmet sécurisés');

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use(limiter);
console.log('✅ Rate limiting activé');

// ============================================
// FORMATAGE
// ============================================
const formatMontantPDF = (n) => {
  if (!n) return '0 FCFA';
  const str = Math.round(n).toString();
  const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' FCFA';
};

// ============================================
// ROUTES PUBLIQUES
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'SMI Backend running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('filiales')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      message: 'Supabase connected!',
      count: data?.length || 0,
      data 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES FILIALES
// ============================================

app.get('/api/filiales', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('filiales')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES FILIALES - WITH DETAILS
// ============================================

app.get('/api/filiales/with-details', async (req, res) => {
  try {
    const { data: filiales, error: err1 } = await supabase
      .from('filiales')
      .select('*')
      .order('nom');
    
    if (err1) throw err1;
    
    const filialesAvecGerants = await Promise.all(
      (filiales || []).map(async (filiale) => {
        const { data: gerants } = await supabase
          .from('gerants')
          .select('*')
          .eq('filiale_id', filiale.id);
        return { ...filiale, gerants: gerants || [] };
      })
    );
    
    res.json(filialesAvecGerants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SSE - SERVER-SENT EVENTS
// ============================================

const alerteClients = new Set();

app.get('/api/alertes/stream', (req, res) => {
  console.log(`🔗 Client connecté à SSE`);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  alerteClients.add(res);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connecté aux alertes' })}\n\n`);

  req.on('close', () => {
    clearInterval(heartbeat);
    alerteClients.delete(res);
    console.log(`🔌 Client déconnecté`);
  });
});

app.post('/api/filiales', async (req, res) => {
  try {
    const { code, nom, adresse, ville, region, latitude, longitude, telephone, email, statut = 'Active' } = req.body;

    const { data, error } = await supabase
      .from('filiales')
      .insert([{ code, nom, adresse: adresse || null, ville, region: region || null, latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null, telephone: telephone || null, email: email || null, statut }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Filiale créée: ${nom}`);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/filiales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('filiales')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/filiales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('filiales').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES FILIALES - WITH GERANTS
// ============================================

app.post('/api/filiales/with-gerants', async (req, res) => {
  try {
    const { code, nom, adresse, ville, region, latitude, longitude, telephone, email, domaine_id, activite_principale, statut = 'Active', gerants = [] } = req.body;

    if (!code || !nom || !ville) {
      return res.status(400).json({ error: 'code, nom et ville requis' });
    }

    const { data: filiale, error: err1 } = await supabase
      .from('filiales')
      .insert([{ code, nom, adresse: adresse || null, ville, region: region || null, latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null, telephone: telephone || null, email: email || null, domaine_id: domaine_id || null, activite_principale: activite_principale || null, statut }])
      .select()
      .single();

    if (err1) throw err1;

    const gerantsAvecFiliale = gerants.map(g => ({
      filiale_id: filiale.id,
      nom_complet: `${g.prenom} ${g.nom}`.trim(),
      email: g.email || null,
      telephone: g.telephone || null,
      poste: g.poste || null,
      date_embauche: g.date_embauche || null,
      statut: g.statut || 'Active'
    }));

    let gerantsCreés = [];
    if (gerantsAvecFiliale.length > 0) {
      const { data: gerantData, error: err2 } = await supabase
        .from('gerants')
        .insert(gerantsAvecFiliale)
        .select();
      if (err2) throw err2;
      gerantsCreés = gerantData || [];
    }
    res.status(201).json({ ...filiale, gerants: gerantsCreés });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}); 

app.put('/api/filiales/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, nom, adresse, ville, region, latitude, longitude, telephone, email, domaine_id, activite_principale, statut, gerants = [] } = req.body;

    const { data: filiale, error: err1 } = await supabase
      .from('filiales')
      .update({ code, nom, adresse: adresse || null, ville, region: region || null, latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null, telephone: telephone || null, email: email || null, domaine_id: domaine_id || null, activite_principale: activite_principale || null, statut, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (err1) throw err1;

    await supabase.from('gerants').delete().eq('filiale_id', id);

    let gerantsCreés = [];
    if (gerants.length > 0) {
      const gerantsAvecFiliale = gerants.map(g => ({
        filiale_id: id,
        nom_complet: `${g.prenom} ${g.nom}`.trim(),
        email: g.email || null,
        telephone: g.telephone || null,
        poste: g.poste || null,
        date_embauche: g.date_embauche || null,
        statut: g.statut || 'Active'
      }));

      const { data: gerantData, error: err2 } = await supabase
        .from('gerants')
        .insert(gerantsAvecFiliale)
        .select();
      if (err2) throw err2;
      gerantsCreés = gerantData || [];
    }

    res.json({ ...filiale, gerants: gerantsCreés });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES DOMAINES
// ============================================

app.get('/api/domaines', async (req, res) => {
  try {
    const { statut } = req.query;
    let query = supabase.from('domaines_activite').select('*').order('nom');
    if (statut) query = query.eq('statut', statut);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/domaines', async (req, res) => {
  try {
    const { nom, code, description, statut = 'Active' } = req.body;
    if (!nom) return res.status(400).json({ error: 'nom requis' });
    const { data, error } = await supabase
      .from('domaines_activite')
      .insert([{ nom, code, description, statut }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/domaines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('domaines_activite')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/domaines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('domaines_activite').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES RECETTES
// ============================================

app.get('/api/recettes', async (req, res) => {
  try {
    const { filiale_id, limit = 50 } = req.query;
    let query = supabase
      .from('recettes')
      .select('*, filiales(nom, code)')
      .order('date_versement', { ascending: false });

    if (filiale_id) query = query.eq('filiale_id', filiale_id);

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recettes', async (req, res) => {
  try {
    const { filiale_id, montant, date_versement } = req.body;

    if (!filiale_id || !montant || montant <= 0) {
      return res.status(400).json({ error: 'filiale_id et montant requis' });
    }

    const { data, error } = await supabase
      .from('recettes')
      .insert([{ filiale_id, montant: parseFloat(montant), date_versement: new Date().toISOString().split('T')[0]  }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Versement créé: ${montant}`);
    res.json({ message: 'Versement créé', recette: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/recettes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('recettes')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/recettes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('recettes').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES DÉPENSES
// ============================================

app.get('/api/depenses', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const { data, error } = await supabase
      .from('depenses')
      .select('*')
      .order('date_depense', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/depenses', async (req, res) => {
  try {
    const { montant, categorie, description, date_depense } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const { data, error } = await supabase
      .from('depenses')
      .insert([{ montant: parseFloat(montant), categorie: categorie || 'Divers', description: description || '', date_depense: date_depense || new Date().toISOString().split('T')[0] }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Dépense créée: ${montant}`);

    // ✅ LIRE LE SEUIL DYNAMIQUEMENT DES PARAMÈTRES
    const { data: params } = await supabase
      .from('parametres')
      .select('montantlimitedépense')
      .single();

    const seuilAlerte = params?.montantlimitedépense || 50000000;

    console.log(`📊 Paramètres reçus:`, params);  // ✅ AJOUTE
    console.log(`📊 Seuil alerte: ${seuilAlerte}`);  // ✅ AJOUTE

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
      
      // ✅ BROADCASTER L'ALERTE AUX CLIENTS SSE
alerteClients.forEach(client => {
  client.write(`data: ${JSON.stringify({ 
    type: 'new_alerte', 
    titre: 'Dépense inhabituelle détectée',
    description: `Dépense de ${montant} FCFA (${categorie}) dépasse le seuil de ${seuilAlerte} FCFA`,
    type_alerte: 'Dépense inhabituelle'
  })}\n\n`);
});
    }

    res.json({ message: 'Dépense créée', depense: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/depenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('depenses')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/depenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('depenses').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES ALERTES
// ============================================

app.get('/api/alertes', async (req, res) => {
  try {
    const { statut = 'Active' } = req.query;
    let query = supabase.from('alertes').select('*').order('created_at', { ascending: false });
    if (statut) query = query.eq('statut', statut);
    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alertes', async (req, res) => {
  try {
    const { titre, description, type, statut = 'Active' } = req.body;
    if (!titre || !type) return res.status(400).json({ error: 'titre et type requis' });
    const { data, error } = await supabase.from('alertes').insert([{ titre, description: description || null, type, statut }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/alertes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('alertes').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alertes/verifier', async (req, res) => {
  try {
    console.log(`\n📲 Vérification manuelle des alertes`);
    
    res.json({ 
      message: 'Vérification complétée', 
      timestamp: new Date().toLocaleString('fr-FR') 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES ALERTES - CHECK DELAYS (DYNAMIQUE)
// ============================================

app.post('/api/alertes/check-delays', async (req, res) => {
  try {
    console.log('\n🔍 Vérification des retards de versement...');

    const { data: params, error: paramError } = await supabase
      .from('parametres')
      .select('joursretardpaiement')
      .single();

    if (paramError || !params) {
      return res.status(400).json({ error: 'Paramètres non trouvés' });
    }

    const joursRetard = params.joursretardpaiement || 1;
    console.log(`📅 Seuil de retard: ${joursRetard} jours`);

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - joursRetard);
    const dateLimitISO = dateLimit.toISOString().split('T')[0];

    console.log(`📊 Cherchant les versements avant le ${dateLimitISO}...`);

    const { data: retardedRecettes, error: recetteError } = await supabase
      .from('recettes')
      .select('id, filiale_id, montant, date_versement')
      .lt('date_versement', dateLimitISO);

    if (recetteError) throw recetteError;

    console.log(`📨 Trouvé ${(retardedRecettes || []).length} versements en retard`);

    let alertesCreees = 0;

    for (const recette of retardedRecettes || []) {
      const { data: existingAlert } = await supabase
        .from('alertes')
        .select('id')
        .eq('description', `Versement en retard depuis ${joursRetard} jours - ID: ${recette.id}`)
        .single();

      if (!existingAlert) {
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

        // ✅ BROADCASTER L'ALERTE AUX CLIENTS SSE
      alerteClients.forEach(client => {
        client.write(`data: ${JSON.stringify({ 
          type: 'new_alerte', 
          titre: `Retard de versement - ${filialeName}`,
          description: `Versement en retard depuis ${joursRetard} jours`,
          type_alerte: 'Retard paiement'
        })}\n\n`);
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
// ROUTES GÉRANTS
// ============================================

app.get('/api/gerants', async (req, res) => {
  try {
    const { data, error } = await supabase.from('gerants').select('*').order('created_at');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gerants', async (req, res) => {
  try {
    const { filiale_id, nom, prenom, email, telephone, poste, date_embauche, statut = 'Active' } = req.body;
    if (!filiale_id || !nom || !prenom) return res.status(400).json({ error: 'filiale_id, nom et prenom requis' });
    const { data, error } = await supabase.from('gerants').insert([{ filiale_id, nom_complet: `${prenom} ${nom}`, email, telephone, poste, date_embauche, statut }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/gerants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('gerants').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gerants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('gerants').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES PARAMÈTRES
// ============================================

app.get('/api/parametres', async (req, res) => {
  try {
    const { data } = await supabase.from('parametres').select('*').eq('id', 1).single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parametres', async (req, res) => {
  try {
    const { data } = await supabase.from('parametres').update(req.body).eq('id', 1).select().single();
    res.json({ message: 'Paramètres sauvegardés', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ROUTES RAPPORTS - IMPORTÉES
// ============================================

import { registerPdfRoutes } from './routes-rapports-pdf.js';
import { registerExcelRoutes } from './routes-rapports-excel.js';

registerPdfRoutes(app, supabase, formatMontantPDF);
registerExcelRoutes(app, supabase, formatMontantPDF);

console.log('✅ Routes rapports (PDF + Excel) chargées');

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`✅ SMI Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health: http://localhost:${PORT}/health`);
  console.log(`📝 Test DB: http://localhost:${PORT}/api/test`);
  console.log(`🎉 All systems GO!\n`);
});