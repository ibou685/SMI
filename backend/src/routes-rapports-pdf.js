// backend/src/routes-rapports-pdf.js - VERSION CORRIGÉE
// RÉSOUD LE BUG : smi.nomEntreprise était undefined car Supabase renvoie "nomentreprise"
//
// Changements :
// 1) Utilise getParametres(supabase) qui normalise tous les noms de champs
// 2) Utilise maybeSingle() au lieu de single() pour ne pas planter si aucun paramètre
// 3) Toutes les références smi.xxx sont maintenant valides

import PDFDocument from 'pdfkit';
import { getParametres } from './services/parametres-helper.js';

export function registerPdfRoutes(app, supabase, formatMontantPDF) {

  // ========== PDF - RECETTES ==========
  app.get('/api/rapports/recettes-pdf', async (req, res) => {
    try {
      const { dateDebut, dateFin, filialeId, montantMin, montantMax } = req.query;

      // ✅ Utilisation du helper (normalise les noms de champs)
      const smi = await getParametres(supabase);

      let query = supabase.from('recettes').select('*, filiales(nom, code)');

      if (dateDebut) query = query.gte('created_at', dateDebut);
      if (dateFin) query = query.lte('created_at', dateFin);
      if (filialeId) query = query.eq('filiale_id', filialeId);
      if (montantMin) query = query.gte('montant', parseFloat(montantMin));
      if (montantMax) query = query.lte('montant', parseFloat(montantMax));

      const { data: recettes, error } = await query;
      if (error) throw error;

      let filtered = recettes || [];
      if (montantMin) filtered = filtered.filter(r => r.montant >= parseFloat(montantMin));
      if (montantMax) filtered = filtered.filter(r => r.montant <= parseFloat(montantMax));

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-recettes.pdf"');

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT RECETTES', { align: 'center' });
      doc.fontSize(14).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email} | ${smi.telephone}`, { align: 'center' });
      doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      const totalRecettes = filtered.reduce((sum, r) => sum + (r.montant || 0), 0);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#10B981').text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`);
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica').text(`Nombre de versements: ${filtered.length}`);
      if (dateDebut || dateFin) {
        doc.text(`Période: Du ${dateDebut || '???'} au ${dateFin || '???'}`);
      }
      doc.moveDown();

      const y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').text('Filiale', 50, y).text('Montant', 250, y).text('Date', 450, y);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      doc.fontSize(8).font('Helvetica');
      filtered.forEach(r => {
        if (doc.y > 750) doc.addPage();
        doc.text(r.filiales?.nom || 'N/A', 50, doc.y, { width: 200 });
        doc.text(formatMontantPDF(r.montant), 250, doc.y - doc.currentLineHeight(), { width: 200 });
        doc.text(new Date(r.created_at).toLocaleDateString('fr-FR'), 450, doc.y - doc.currentLineHeight());
        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      console.error('❌ Erreur recettes-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PDF - DÉPENSES ==========
  app.get('/api/rapports/depenses-pdf', async (req, res) => {
    try {
      const { dateDebut, dateFin } = req.query;

      const smi = await getParametres(supabase);

      let query = supabase.from('depenses').select('*');
      if (dateDebut) query = query.gte('created_at', dateDebut);
      if (dateFin) query = query.lte('created_at', dateFin);

      const { data: depenses, error } = await query;
      if (error) throw error;

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-depenses.pdf"');

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT DÉPENSES', { align: 'center' });
      doc.fontSize(14).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email} | ${smi.telephone}`, { align: 'center' });
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Période:', { underline: true });
        doc.fontSize(9).font('Helvetica').text(`${dateDebut} au ${dateFin}`);
        doc.moveDown();
      }

      const totalDepenses = (depenses || []).reduce((sum, d) => sum + (d.montant || 0), 0);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#F59E0B').text(`Total Dépenses: ${formatMontantPDF(totalDepenses)}`);
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica').text(`Nombre de transactions: ${(depenses || []).length}`);
      doc.moveDown();

      doc.fontSize(9).font('Helvetica-Bold').text('Montant', 50, doc.y).text('Type', 200, doc.y).text('Description', 300, doc.y).text('Date', 450, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      doc.fontSize(8).font('Helvetica');
      (depenses || []).forEach(d => {
        if (doc.y > 750) doc.addPage();
        doc.text(formatMontantPDF(d.montant), 50, doc.y, { width: 150 });
        doc.text(d.type || d.categorie || 'N/A', 200, doc.y - doc.currentLineHeight(), { width: 100 });
        doc.text(d.description || '', 300, doc.y - doc.currentLineHeight(), { width: 150 });
        doc.text(new Date(d.created_at).toLocaleDateString('fr-FR'), 450, doc.y - doc.currentLineHeight());
        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      console.error('❌ Erreur depenses-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PDF - BILAN (AVEC TVA + IS) ==========
  app.get('/api/rapports/bilan-pdf', async (req, res) => {
    try {
      const { filialeId, dateDebut, dateFin } = req.query;

      const smi = await getParametres(supabase);

      const tauxTVA = parseFloat(smi.tauxTva || 18) / 100;
      const tauxIS = parseFloat(smi.tauxIs || 30) / 100;

      let recettesQuery = supabase.from('recettes').select('*');
      if (filialeId) recettesQuery = recettesQuery.eq('filiale_id', filialeId);
      if (dateDebut) recettesQuery = recettesQuery.gte('created_at', dateDebut);
      if (dateFin) recettesQuery = recettesQuery.lte('created_at', dateFin);

      let depensesQuery = supabase.from('depenses').select('*');
      if (dateDebut) depensesQuery = depensesQuery.gte('created_at', dateDebut);
      if (dateFin) depensesQuery = depensesQuery.lte('created_at', dateFin);

      const [recettesRes, depensesRes, filialesRes] = await Promise.all([
        recettesQuery,
        depensesQuery,
        supabase.from('filiales').select('*')
      ]);

      const recettes = recettesRes.data || [];
      const depenses = depensesRes.data || [];
      const allFiliales = filialesRes.data || [];
      const filiales = filialeId ? allFiliales.filter(f => f.id === filialeId) : allFiliales;

      const totalRecettes = recettes.reduce((sum, r) => sum + (r.montant || 0), 0);
      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);

      const montantTVA = totalRecettes * tauxTVA;
      const baseIS = totalRecettes - montantTVA - totalDepenses;
      const montantIS = Math.max(baseIS, 0) * tauxIS;
      const soldeNet = totalRecettes - montantTVA - totalDepenses - montantIS;
      const ratioRentabilite = totalRecettes > 0 ? ((totalRecettes / (totalRecettes + totalDepenses)) * 100).toFixed(2) : 0;

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-bilan.pdf"');

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('BILAN FINANCIER', { align: 'center' });
      doc.fontSize(14).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email} | ${smi.telephone}`, { align: 'center' });
      doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Période:', { underline: true });
        doc.fontSize(9).font('Helvetica').text(`${dateDebut} à ${dateFin}`);
        doc.moveDown();
      }

      doc.fontSize(11).font('Helvetica-Bold').text('RÉSUMÉ GLOBAL', { underline: true });
      doc.fontSize(10).font('Helvetica').fillColor('#10B981').text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`);
      doc.fillColor('#F59E0B').text(`Total Dépenses: ${formatMontantPDF(totalDepenses)}`);
      doc.fillColor('black');
      doc.moveDown();

      doc.fontSize(10).font('Helvetica-Bold').text('CALCULS FISCAUX', { underline: true });
      doc.fontSize(9).font('Helvetica').fillColor('#8B5CF6').text(`TVA (${(tauxTVA * 100).toFixed(0)}%): ${formatMontantPDF(montantTVA)}`);
      doc.fillColor('#EC4899').text(`Impôt Sociétés (${(tauxIS * 100).toFixed(0)}%): ${formatMontantPDF(montantIS)}`);
      doc.fillColor('black');
      doc.moveDown();

      doc.fillColor(soldeNet >= 0 ? '#10B981' : '#EF4444');
      doc.fontSize(11).font('Helvetica-Bold').text(`Solde Net (après TVA + IS): ${formatMontantPDF(soldeNet)}`);
      doc.fillColor('#3B82F6').fontSize(10).text(`Ratio Rentabilité: ${ratioRentabilite}%`);
      doc.fillColor('black');
      doc.moveDown();

      doc.fontSize(11).font('Helvetica-Bold').text('DÉTAILS PAR FILIALE', { underline: true });
      doc.moveDown();

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Filiale', 50, doc.y).text('Recettes', 300, doc.y).text('Solde', 450, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      doc.fontSize(8).font('Helvetica');
      filiales.forEach(filiale => {
        const fRec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);
        const fSolde = fRec;
        doc.text(filiale.nom, 50, doc.y, { width: 250 });
        doc.text(formatMontantPDF(fRec), 300, doc.y - doc.currentLineHeight(), { width: 150 });
        doc.fillColor(fSolde >= 0 ? '#10B981' : '#EF4444').text(formatMontantPDF(fSolde), 450, doc.y - doc.currentLineHeight(), { width: 100 });
        doc.fillColor('black');
        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      console.error('❌ Erreur bilan-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PDF - RAPPORT COMPLET ==========
  app.get('/api/rapports/complet-pdf', async (req, res) => {
    try {
      const { filialeId, dateDebut, dateFin } = req.query;

      const smi = await getParametres(supabase);

      const tauxTVA = parseFloat(smi.tauxTva || 18) / 100;
      const tauxIS = parseFloat(smi.tauxIs || 30) / 100;

      let recettesQuery = supabase.from('recettes').select('*, filiales(nom, code)');
      if (filialeId) recettesQuery = recettesQuery.eq('filiale_id', filialeId);
      if (dateDebut) recettesQuery = recettesQuery.gte('created_at', dateDebut);
      if (dateFin) recettesQuery = recettesQuery.lte('created_at', dateFin);

      let depensesQuery = supabase.from('depenses').select('*');
      if (dateDebut) depensesQuery = depensesQuery.gte('created_at', dateDebut);
      if (dateFin) depensesQuery = depensesQuery.lte('created_at', dateFin);

      const [recettesRes, depensesRes, filialesRes] = await Promise.all([
        recettesQuery,
        depensesQuery,
        supabase.from('filiales').select('*')
      ]);

      const recettes = recettesRes.data || [];
      const depenses = depensesRes.data || [];
      const filiales = filialesRes.data || [];

      const totalRecettes = recettes.reduce((sum, r) => sum + (r.montant || 0), 0);
      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
      const montantTVA = totalRecettes * tauxTVA;
      const baseIS = totalRecettes - montantTVA - totalDepenses;
      const montantIS = Math.max(baseIS, 0) * tauxIS;
      const soldeNet = totalRecettes - montantTVA - totalDepenses - montantIS;

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-complet.pdf"');

      doc.pipe(res);

      // En-tête entreprise
      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT COMPLET', { align: 'center' });
      doc.fontSize(14).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(`${smi.adresse} | ${smi.email} | ${smi.telephone}`, { align: 'center' });
      doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Période:', { underline: true });
        doc.fontSize(9).font('Helvetica').text(`${dateDebut || 'Début'} à ${dateFin || 'Aujourd\'hui'}`);
        doc.moveDown();
      }

      // Résumé
      doc.fontSize(11).font('Helvetica-Bold').text('RÉSUMÉ EXÉCUTIF', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.fillColor('#10B981').text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`);
      doc.fillColor('#F59E0B').text(`Total Dépenses: ${formatMontantPDF(totalDepenses)}`);
      doc.fillColor('#8B5CF6').text(`TVA (${(tauxTVA * 100).toFixed(0)}%): ${formatMontantPDF(montantTVA)}`);
      doc.fillColor('#EC4899').text(`IS (${(tauxIS * 100).toFixed(0)}%): ${formatMontantPDF(montantIS)}`);
      doc.fillColor(soldeNet >= 0 ? '#10B981' : '#EF4444').fontSize(11).font('Helvetica-Bold').text(`Solde Net: ${formatMontantPDF(soldeNet)}`);
      doc.fillColor('black');
      doc.moveDown();

      // Détail par filiale
      doc.fontSize(11).font('Helvetica-Bold').text('DÉTAILS PAR FILIALE', { underline: true });
      doc.moveDown();

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Filiale', 50, doc.y).text('Recettes', 250, doc.y).text('Dépenses', 350, doc.y).text('Solde', 450, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      doc.fontSize(8).font('Helvetica');
      filiales.forEach(filiale => {
        if (doc.y > 750) doc.addPage();
        const fRec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);
        const fDep = depenses.filter(d => d.filiale_id === filiale.id).reduce((sum, d) => sum + (d.montant || 0), 0);
        const fSolde = fRec - fDep;
        doc.text(filiale.nom, 50, doc.y, { width: 200 });
        doc.text(formatMontantPDF(fRec), 250, doc.y - doc.currentLineHeight(), { width: 100 });
        doc.text(formatMontantPDF(fDep), 350, doc.y - doc.currentLineHeight(), { width: 100 });
        doc.fillColor(fSolde >= 0 ? '#10B981' : '#EF4444').text(formatMontantPDF(fSolde), 450, doc.y - doc.currentLineHeight(), { width: 100 });
        doc.fillColor('black');
        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      console.error('❌ Erreur complet-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PDF - RAPPORT PAR FILIALE ==========
  app.get('/api/rapports/par-filiale-pdf', async (req, res) => {
    try {
      const { filialeId, dateDebut, dateFin } = req.query;

      if (!filialeId) {
        return res.status(400).json({ error: 'filialeId requis' });
      }

      const smi = await getParametres(supabase);

      const { data: filiale } = await supabase
        .from('filiales')
        .select('*, domaines_activite(nom)')
        .eq('id', filialeId)
        .single();

      let recettesQuery = supabase.from('recettes').select('*').eq('filiale_id', filialeId);
      if (dateDebut) recettesQuery = recettesQuery.gte('created_at', dateDebut);
      if (dateFin) recettesQuery = recettesQuery.lte('created_at', dateFin);

      let depensesQuery = supabase.from('depenses').select('*').eq('filiale_id', filialeId);
      if (dateDebut) depensesQuery = depensesQuery.gte('created_at', dateDebut);
      if (dateFin) depensesQuery = depensesQuery.lte('created_at', dateFin);

      const [recettesRes, depensesRes, gerantsRes] = await Promise.all([
        recettesQuery,
        depensesQuery,
        supabase.from('gerants').select('*').eq('filiale_id', filialeId)
      ]);

      const recettes = recettesRes.data || [];
      const depenses = depensesRes.data || [];
      const gerants = gerantsRes.data || [];

      const totalRecettes = recettes.reduce((sum, r) => sum + (r.montant || 0), 0);
      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
      const solde = totalRecettes - totalDepenses;

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-filiale-${filiale?.nom || filialeId}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT FILIALE', { align: 'center' });
      doc.fontSize(14).text(filiale?.nom || 'N/A', { align: 'center' });
      doc.fontSize(12).text(`Code: ${filiale?.code || 'N/A'}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).font('Helvetica').text(`Édité par: ${smi.nomEntreprise}`, { align: 'center' });
      doc.text(`${smi.adresse} | ${smi.email} | ${smi.telephone}`, { align: 'center' });
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      // Infos filiale
      doc.fontSize(11).font('Helvetica-Bold').text('INFORMATIONS', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Domaine: ${filiale?.domaines_activite?.nom || 'N/A'}`);
      doc.text(`Ville: ${filiale?.ville || 'N/A'}`);
      doc.text(`Statut: ${filiale?.statut || 'N/A'}`);
      doc.text(`Email: ${filiale?.email || 'N/A'}`);
      doc.text(`Téléphone: ${filiale?.telephone || 'N/A'}`);
      doc.moveDown();

      // Gérants
      if (gerants.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('GÉRANTS', { underline: true });
        doc.fontSize(10).font('Helvetica');
        gerants.forEach(g => {
          doc.text(`• ${g.nom_complet || 'N/A'} - ${g.poste || 'N/A'} (${g.telephone || 'N/A'})`);
        });
        doc.moveDown();
      }

      // Résumé financier
      doc.fontSize(11).font('Helvetica-Bold').text('RÉSUMÉ FINANCIER', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.fillColor('#10B981').text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`);
      doc.fillColor('#F59E0B').text(`Total Dépenses: ${formatMontantPDF(totalDepenses)}`);
      doc.fillColor(solde >= 0 ? '#10B981' : '#EF4444').fontSize(11).font('Helvetica-Bold').text(`Solde: ${formatMontantPDF(solde)}`);
      doc.fillColor('black');

      doc.end();
    } catch (err) {
      console.error('❌ Erreur par-filiale-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  console.log('✅ Routes rapports PDF chargées');
}
