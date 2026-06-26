// backend/src/routes/rapports.js
// Routes pour générer rapports et exports

import express from 'express';
import { generateDailyReport, generateMonthlyReport, generateAnnualReport } from '../services/pdf.js';
import { exportFiliales, exportRecettes, exportDepenses, exportRapportMensuel } from '../services/excel.js';
import { verifyAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware pour vérifier autorisation
router.use(verifyAuth);

// ============================================
// RAPPORTS PDF
// ============================================

// GET /api/rapports/daily - Rapport journalier PDF
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Récupérer données du jour
    const { data: recettes } = await supabase
      .from('recettes')
      .select('*')
      .eq('date_versement', targetDate);

    const { data: depenses } = await supabase
      .from('depenses')
      .select('*')
      .eq('date_depense', targetDate);

    const totalRecettes = (recettes || []).reduce((sum, r) => sum + r.montant, 0);
    const totalDepenses = (depenses || []).reduce((sum, d) => sum + d.montant, 0);

    const reportData = {
      date: targetDate,
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      recettes: recettes || [],
      depenses: depenses || []
    };

    const doc = generateDailyReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapport-journalier-${targetDate}.pdf"`
    );

    doc.pipe(res);
  } catch (err) {
    logger.error(`Erreur rapport daily: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rapports/monthly - Rapport mensuel PDF
router.get('/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    const [year, monthNum] = month.split('-');

    // Recettes du mois
    const { data: recettes } = await supabase
      .from('recettes')
      .select('*, filiales(nom)')
      .gte('date_versement', `${month}-01`)
      .lt('date_versement', `${year}-${parseInt(monthNum) + 1}-01`);

    // Dépenses du mois
    const { data: depenses } = await supabase
      .from('depenses')
      .select('*')
      .gte('date_depense', `${month}-01`)
      .lt('date_depense', `${year}-${parseInt(monthNum) + 1}-01`);

    const totalRecettes = (recettes || []).reduce((sum, r) => sum + r.montant, 0);
    const totalDepenses = (depenses || []).reduce((sum, d) => sum + d.montant, 0);

    // Filiales ranking
    const filialesMap = {};
    (recettes || []).forEach((r) => {
      if (!filialesMap[r.filiale_id]) {
        filialesMap[r.filiale_id] = { nom: r.filiales?.nom, count: 0, total: 0 };
      }
      filialesMap[r.filiale_id].count++;
      filialesMap[r.filiale_id].total += r.montant;
    });

    const filiales = Object.values(filialesMap).sort((a, b) => b.total - a.total);

    const reportData = {
      month: `${monthNum}/${year}`,
      totalRecettes,
      totalDepenses,
      benefice: totalRecettes - totalDepenses,
      filiales
    };

    const doc = generateMonthlyReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapport-mensuel-${month}.pdf"`
    );

    doc.pipe(res);
  } catch (err) {
    logger.error(`Erreur rapport monthly: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rapports/annual - Rapport annuel PDF
router.get('/annual/:year', async (req, res) => {
  try {
    const { year } = req.params;

    // Recettes de l'année
    const { data: recettes } = await supabase
      .from('recettes')
      .select('*')
      .gte('date_versement', `${year}-01-01`)
      .lt('date_versement', `${parseInt(year) + 1}-01-01`);

    // Dépenses de l'année
    const { data: depenses } = await supabase
      .from('depenses')
      .select('*')
      .gte('date_depense', `${year}-01-01`)
      .lt('date_depense', `${parseInt(year) + 1}-01-01`);

    const totalRecettes = (recettes || []).reduce((sum, r) => sum + r.montant, 0);
    const totalDepenses = (depenses || []).reduce((sum, d) => sum + d.montant, 0);

    // Évolution mensuelle
    const monthData = {};
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      monthData[monthStr] = { recettes: 0, depenses: 0, solde: 0, nom: `Mois ${m}` };
    }

    (recettes || []).forEach((r) => {
      const m = r.date_versement.split('-')[1];
      monthData[m].recettes += r.montant;
      monthData[m].solde = monthData[m].recettes - monthData[m].depenses;
    });

    (depenses || []).forEach((d) => {
      const m = d.date_depense.split('-')[1];
      monthData[m].depenses += d.montant;
      monthData[m].solde = monthData[m].recettes - monthData[m].depenses;
    });

    const reportData = {
      year,
      totalRecettes,
      totalDepenses,
      resultat: totalRecettes - totalDepenses,
      mois: Object.values(monthData)
    };

    const doc = generateAnnualReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapport-annuel-${year}.pdf"`
    );

    doc.pipe(res);
  } catch (err) {
    logger.error(`Erreur rapport annual: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EXPORTS EXCEL
// ============================================

// GET /api/export/excel/filiales
router.get('/excel/filiales', async (req, res) => {
  try {
    const { data: filiales } = await supabase.from('filiales').select('*');

    const buffer = await exportFiliales(filiales || []);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="filiales.xlsx"');
    res.send(buffer);
  } catch (err) {
    logger.error(`Erreur export filiales: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/excel/recettes
router.get('/excel/recettes', async (req, res) => {
  try {
    const { dateMin, dateMax } = req.query;

    let query = supabase.from('recettes').select('*');
    if (dateMin) query = query.gte('date_versement', dateMin);
    if (dateMax) query = query.lte('date_versement', dateMax);

    const { data: recettes } = await query;
    const { data: filiales } = await supabase.from('filiales').select('*');

    const buffer = await exportRecettes(recettes || [], filiales || []);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="recettes.xlsx"');
    res.send(buffer);
  } catch (err) {
    logger.error(`Erreur export recettes: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/excel/depenses
router.get('/excel/depenses', async (req, res) => {
  try {
    const { dateMin, dateMax, categorie } = req.query;

    let query = supabase.from('depenses').select('*');
    if (dateMin) query = query.gte('date_depense', dateMin);
    if (dateMax) query = query.lte('date_depense', dateMax);
    if (categorie) query = query.eq('categorie', categorie);

    const { data: depenses } = await query;

    const buffer = await exportDepenses(depenses || []);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="depenses.xlsx"');
    res.send(buffer);
  } catch (err) {
    logger.error(`Erreur export depenses: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;