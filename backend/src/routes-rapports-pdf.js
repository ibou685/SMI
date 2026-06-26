// backend/src/routes-rapports-pdf.js - Toutes les routes PDF

import PDFDocument from 'pdfkit';

export function registerPdfRoutes(app, supabase, formatMontantPDF) {
  
  // ========== PDF - RECETTES ==========
  app.get('/api/rapports/recettes-pdf', async (req, res) => {
    try {
      const { dateDebut, dateFin, filialeId, montantMin, montantMax } = req.query;

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || {
        nomEntreprise: 'Sénégal Multiservices International SARL',
        adresse: '162 Sacré Cœur III VDN, Dakar',
        email: 'contact@smi.sn',
        telephone: '+221 77 XXX XXXX'
      };

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
      doc.fontSize(12).text('Senegal Multiservices International SARL', { align: 'center' });
      doc.fontSize(12).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email}`, { align: 'center' });
      doc.fontSize(10).text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      const totalRecettes = filtered.reduce((sum, r) => sum + (r.montant || 0), 0);
      doc.fontSize(12).font('Helvetica-Bold').text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`, { color: '#10B981' });
      doc.fontSize(10).text(`Nombre de versements: ${filtered.length}`);
      if (dateDebut || dateFin) {
        doc.text(`Periode: Du ${dateDebut || '???'} au ${dateFin || '???'}`);
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

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || {
        nomEntreprise: 'Sénégal Multiservices International SARL',
        adresse: '162 Sacré Cœur III VDN, Dakar',
        email: 'contact@smi.sn',
        telephone: '+221 77 XXX XXXX'
      };

      let query = supabase.from('depenses').select('*');
      
      if (dateDebut) query = query.gte('created_at', dateDebut);
      if (dateFin) query = query.lte('created_at', dateFin);

      const { data: depenses, error } = await query;
      if (error) throw error;

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-depenses.pdf"');

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT DEPENSES SMI', { align: 'center' });
      doc.fontSize(12).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email}`, { align: 'center' });
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Periode:', { underline: true });
        doc.fontSize(9).font('Helvetica').text(`${dateDebut} au ${dateFin}`);
        doc.moveDown();
      }

      const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
      
      doc.fontSize(12).font('Helvetica-Bold').text(`Total Depenses: ${formatMontantPDF(totalDepenses)}`, { color: '#F59E0B' });
      doc.fontSize(10).text(`Nombre de transactions: ${depenses.length}`);
      doc.moveDown();

      doc.fontSize(9).font('Helvetica-Bold').text('Montant', 50, doc.y).text('Type', 200, doc.y).text('Description', 300, doc.y).text('Date', 450, doc.y);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      doc.fontSize(8).font('Helvetica');
      depenses.forEach(d => {
        if (doc.y > 750) doc.addPage();
        doc.text(formatMontantPDF(d.montant), 50, doc.y, { width: 150 });
        doc.text(d.type || 'N/A', 200, doc.y - doc.currentLineHeight(), { width: 100 });
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

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || {
        nomEntreprise: 'Sénégal Multiservices International SARL',
        adresse: '162 Sacré Cœur III VDN, Dakar',
        email: 'contact@smi.sn',
        telephone: '+221 77 XXX XXXX',
        tauxtva: 18,
        tauxis: 30
      };

      const tauxTVA = parseFloat(smi.tauxtva || 18) / 100;
      const tauxIS = parseFloat(smi.tauxis || 30) / 100;

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
      doc.fontSize(12).text('Senegal Multiservices International SARL', { align: 'center' });
      doc.fontSize(12).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email}`, { align: 'center' });
      doc.fontSize(10).text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Periode:', { underline: true });
        doc.fontSize(9).font('Helvetica').text(`${dateDebut} a ${dateFin}`);
        doc.moveDown();
      }

      doc.fontSize(11).font('Helvetica-Bold').text('RESUME GLOBAL', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`, { color: '#10B981' });
      doc.text(`Total Depenses: ${formatMontantPDF(totalDepenses)}`, { color: '#F59E0B' });
      doc.moveDown();

      doc.fontSize(10).font('Helvetica-Bold').text('CALCULS FISCAUX', { underline: true });
      doc.fontSize(9).font('Helvetica');
      doc.text(`TVA (${(tauxTVA * 100).toFixed(0)}%): ${formatMontantPDF(montantTVA)}`, { color: '#8B5CF6' });
      doc.text(`Impôt Sociétés (${(tauxIS * 100).toFixed(0)}%): ${formatMontantPDF(montantIS)}`, { color: '#EC4899' });
      doc.moveDown();

      doc.text(`Solde Net (après TVA + IS): ${formatMontantPDF(soldeNet)}`, { 
        color: soldeNet >= 0 ? '#10B981' : '#EF4444', 
        bold: true, 
        fontSize: 11 
      });
      doc.text(`Ratio Rentabilite: ${ratioRentabilite}%`, { color: '#3B82F6' });
      doc.moveDown();

      doc.fontSize(11).font('Helvetica-Bold').text('DETAILS PAR FILIALE', { underline: true });
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
        doc.text(formatMontantPDF(fSolde), 450, doc.y - doc.currentLineHeight(), { 
          width: 100, 
          color: fSolde >= 0 ? '#10B981' : '#EF4444' 
        });
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

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || {
        nomEntreprise: 'Sénégal Multiservices International SARL',
        adresse: '162 Sacré Cœur III VDN, Dakar',
        email: 'contact@smi.sn',
        telephone: '+221 77 XXX XXXX'
      };

      let filialesQuery = supabase.from('filiales').select('*, domaines_activite(nom), gerants(*)');
      if (filialeId) filialesQuery = filialesQuery.eq('id', filialeId);

      let recettesQuery = supabase.from('recettes').select('*');
      if (filialeId) recettesQuery = recettesQuery.eq('filiale_id', filialeId);
      if (dateDebut) recettesQuery = recettesQuery.gte('created_at', dateDebut);
      if (dateFin) recettesQuery = recettesQuery.lte('created_at', dateFin);

      const [filialesRes, recettesRes] = await Promise.all([
        filialesQuery,
        recettesQuery,
      ]);

      const filiales = filialesRes.data || [];
      const recettes = recettesRes.data || [];

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${filialeId ? 'filiale' : 'complet'}.pdf"`);

      doc.pipe(res);

      doc.fontSize(22).font('Helvetica-Bold').text(filialeId ? 'RAPPORT FILIALE' : 'RAPPORT COMPLET SMI', { align: 'center' });
      doc.fontSize(12).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email}`, { align: 'center' });
      doc.fontSize(10).text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Periode:', { underline: true });
        if (dateDebut && dateFin) {
          doc.fontSize(9).font('Helvetica').text(`Du ${dateDebut} au ${dateFin}`);
        } else if (dateDebut) {
          doc.fontSize(9).font('Helvetica').text(`A partir du ${dateDebut}`);
        } else if (dateFin) {
          doc.fontSize(9).font('Helvetica').text(`Jusqu au ${dateFin}`);
        }
        doc.moveDown();
      }

      const totalRecettes = recettes.reduce((sum, r) => sum + (r.montant || 0), 0);

      doc.fontSize(11).font('Helvetica-Bold').text('STATISTIQUES GLOBALES', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Filiales: ${filiales.length}`);
      doc.text(`Total Recettes: ${formatMontantPDF(totalRecettes)}`);
      doc.moveDown();

      doc.fontSize(11).font('Helvetica-Bold').text('DETAILS PAR FILIALE', { underline: true });
      doc.moveDown();

      filiales.forEach((filiale, idx) => {
        const fRec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);

        doc.fontSize(10).font('Helvetica-Bold').text(`${idx + 1}. ${filiale.nom} (${filiale.code})`);
        doc.fontSize(9).font('Helvetica');
        doc.text(`   Recettes: ${formatMontantPDF(fRec)}`);
        
        if (filiale.gerants?.length > 0) {
          const gerants = filiale.gerants.map(g => g.nom_complet || `${g.prenom} ${g.nom}`).join(', ');
          doc.text(`   Gerants: ${gerants}`);
        }
        doc.moveDown(0.3);
      });

      doc.end();
    } catch (err) {
      console.error('❌ Erreur complet-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PDF - PAR FILIALE ==========
  app.get('/api/rapports/par-filiale-pdf', async (req, res) => {
    try {
      const { filialeId, dateDebut, dateFin } = req.query;

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || {
        nomEntreprise: 'Sénégal Multiservices International SARL',
        adresse: '162 Sacré Cœur III VDN, Dakar',
        email: 'contact@smi.sn',
        telephone: '+221 77 XXX XXXX'
      };

      if (!filialeId) {
        return res.status(400).json({ error: 'filialeId est requis' });
      }

      const [filialeRes, recettesRes] = await Promise.all([
        supabase.from('filiales').select('*, domaines_activite(nom), gerants(*)').eq('id', filialeId).single(),
        supabase.from('recettes').select('*').eq('filiale_id', filialeId).gte('created_at', dateDebut || '1900-01-01')
          .lte('created_at', dateFin || '2100-01-01')
      ]);

      const filiale = filialeRes.data;
      const recettes = recettesRes.data || [];

      if (!filiale) {
        return res.status(404).json({ error: 'Filiale non trouvée' });
      }

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${filiale.code}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text(`RAPPORT: ${filiale.nom}`, { align: 'center' });
      doc.fontSize(12).text(filiale.code, { align: 'center' });
      doc.fontSize(12).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email}`, { align: 'center' }); 
      doc.moveDown();

      if (dateDebut || dateFin) {
        doc.fontSize(9).font('Helvetica-Bold').text('Periode:', { underline: true });
        doc.fontSize(9).font('Helvetica').text(`Du ${dateDebut} au ${dateFin}`);
        doc.moveDown();
      }

      const totalRec = recettes.reduce((sum, r) => sum + (r.montant || 0), 0);

      doc.fontSize(11).font('Helvetica-Bold').text('Résumé Financier:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Recettes: ${formatMontantPDF(totalRec)}`, { color: '#10B981' });

      if (filiale.gerants?.length > 0) {
        doc.moveDown();
        doc.fontSize(11).font('Helvetica-Bold').text('Gérants:', { underline: true });
        filiale.gerants.forEach(g => {
          doc.fontSize(9).font('Helvetica').text(`${g.nom_complet || `${g.prenom} ${g.nom}`}`);
        });
      }

      doc.end();
    } catch (err) {
      console.error('❌ Erreur par-filiale-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== PDF - GÉRANTS ==========
  app.get('/api/rapports/gerants-pdf', async (req, res) => {
    try {
      const [filialesRes, gerantsRes] = await Promise.all([
        supabase.from('filiales').select('*').order('nom'),
        supabase.from('gerants').select('*').order('filiale_id')
      ]);

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || {
        nomEntreprise: 'Sénégal Multiservices International SARL',
        adresse: '162 Sacré Cœur III VDN, Dakar',
        email: 'contact@smi.sn',
        telephone: '+221 77 XXX XXXX'
      };

      const filiales = filialesRes.data || [];
      const gerants = gerantsRes.data || [];

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-gerants.pdf"');

      doc.pipe(res);

      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT DES GERANTS', { align: 'center' });
      doc.fontSize(12).text('Senegal Multiservices International SARL', { align: 'center' });
      doc.fontSize(12).text(smi.nomEntreprise, { align: 'center' });
      doc.fontSize(9).text(`${smi.adresse} | ${smi.email}`, { align: 'center' });
      doc.fontSize(10).text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).font('Helvetica-Bold').text(`Total Gerants: ${gerants.length}`);
      doc.moveDown();

      filiales.forEach((filiale) => {
        const filialeGerants = gerants.filter(g => g.filiale_id === filiale.id);

        if (filialeGerants.length === 0) return;

        doc.fontSize(11).font('Helvetica-Bold').text(`${filiale.nom} (${filiale.code})`, { underline: true });
        doc.moveDown(0.2);

        filialeGerants.forEach((gerant, idx) => {
          doc.fontSize(10).font('Helvetica-Bold').text(`${idx + 1}. ${gerant.nom_complet || `${gerant.prenom} ${gerant.nom}`}`);
          doc.fontSize(9).font('Helvetica');
          if (gerant.poste) doc.text(`   Poste: ${gerant.poste}`);
          if (gerant.email) doc.text(`   Email: ${gerant.email}`);
          if (gerant.telephone) doc.text(`   Telephone: ${gerant.telephone}`);
          if (gerant.date_embauche) doc.text(`   Date embauche: ${new Date(gerant.date_embauche).toLocaleDateString('fr-FR')}`);
          doc.text(`   Statut: ${gerant.statut || 'Active'}`);
          doc.moveDown(0.3);
        });

        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      console.error('❌ Erreur gerants-pdf:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  console.log('✅ Routes rapports PDF chargées');
}
