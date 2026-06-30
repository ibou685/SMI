// backend/src/routes-rapports-excel.js - VERSION CORRIGÉE
//
// Corrections :
// 1) Utilise getParametres(supabase) pour normaliser les noms de champs (smi.nomEntreprise, smi.tauxTva, smi.tauxIs)
// 2) maybeSingle() au lieu de single() pour ne pas planter si aucun paramètre
// 3) AJOUT de la route /api/rapports/complet-excel qui était MANQUANTE (le frontend l'appelle mais elle n'existait pas !)

import ExcelJS from 'exceljs';
import { getParametres } from './services/parametres-helper.js';

export function registerExcelRoutes(app, supabase, formatMontantPDF) {

  // ========== EXCEL - RECETTES ==========
  app.get('/api/rapports/recettes-excel', async (req, res) => {
    try {
      const { dateDebut, dateFin, filialeId } = req.query;

      const smi = await getParametres(supabase);

      let query = supabase.from('recettes').select('*, filiales(nom, code)');
      if (dateDebut) query = query.gte('created_at', dateDebut);
      if (dateFin) query = query.lte('created_at', dateFin);
      if (filialeId) query = query.eq('filiale_id', filialeId);

      const { data: recettes, error } = await query;
      if (error) throw error;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Recettes');

      let row = 1;

      // ✅ En-tête entreprise avec valeurs valides
      worksheet.mergeCells(`A${row}:E${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:E${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email} | ${smi.telephone}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:E${row}`);
      worksheet.getCell(`A${row}`).value = `Rapport des Recettes - Généré le ${new Date().toLocaleDateString('fr-FR')}`;
      worksheet.getCell(`A${row}`).font = { italic: true, size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Filiale', key: 'filiale', width: 25 },
        { header: 'Code', key: 'code', width: 12 },
        { header: 'Montant (FCFA)', key: 'montant', width: 18 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Date', key: 'date', width: 14 }
      ];

      const headerRow = worksheet.getRow(row);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };
      row++;

      const startDataRow = row;
      if (recettes && recettes.length > 0) {
        recettes.forEach(r => {
          worksheet.addRow({
            filiale: r.filiales?.nom || 'N/A',
            code: r.filiales?.code || 'N/A',
            montant: r.montant || 0,
            description: r.description || '',
            date: new Date(r.created_at).toLocaleDateString('fr-FR')
          });
          row++;
        });

        const totalRow = worksheet.addRow({});
        totalRow.getCell('filiale').value = 'TOTAL';
        totalRow.getCell('montant').value = {
          formula: `SUM(C${startDataRow}:C${row - 1})`
        };
        totalRow.getCell('montant').numFmt = '#,##0';
        totalRow.font = { bold: true };
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-recettes.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Erreur recettes-excel:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== EXCEL - DÉPENSES ==========
  app.get('/api/rapports/depenses-excel', async (req, res) => {
    try {
      const { dateDebut, dateFin } = req.query;

      const smi = await getParametres(supabase);

      let query = supabase.from('depenses').select('*');
      if (dateDebut) query = query.gte('created_at', dateDebut);
      if (dateFin) query = query.lte('created_at', dateFin);

      const { data: depenses, error } = await query;
      if (error) throw error;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Depenses');

      let row = 1;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email} | ${smi.telephone}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `Rapport des Dépenses - Généré le ${new Date().toLocaleDateString('fr-FR')}`;
      worksheet.getCell(`A${row}`).font = { italic: true, size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Montant (FCFA)', key: 'montant', width: 18 },
        { header: 'Catégorie', key: 'categorie', width: 22 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Date', key: 'date', width: 14 }
      ];

      const headerRow = worksheet.getRow(row);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };
      row++;

      const startDataRow = row;
      if (depenses && depenses.length > 0) {
        depenses.forEach(d => {
          worksheet.addRow({
            montant: d.montant || 0,
            categorie: d.categorie || d.type || 'N/A',
            description: d.description || '',
            date: new Date(d.created_at).toLocaleDateString('fr-FR')
          });
          row++;
        });

        const totalRow = worksheet.addRow({});
        totalRow.getCell('categorie').value = 'TOTAL';
        totalRow.getCell('montant').value = {
          formula: `SUM(A${startDataRow}:A${row - 1})`
        };
        totalRow.getCell('montant').numFmt = '#,##0';
        totalRow.font = { bold: true };
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-depenses.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Erreur depenses-excel:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== EXCEL - BILAN (AVEC TVA + IS) ==========
  app.get('/api/rapports/bilan-excel', async (req, res) => {
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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bilan');

      let row = 1;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email} | ${smi.telephone}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.getCell(`A${row}`).value = 'BILAN FINANCIER';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 14 };
      row++;

      worksheet.getCell(`A${row}`).value = `Généré le: ${new Date().toLocaleDateString('fr-FR')}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      row += 2;

      if (dateDebut || dateFin) {
        worksheet.getCell(`A${row}`).value = 'Période:';
        worksheet.getCell(`A${row}`).font = { bold: true };
        row++;
        worksheet.getCell(`A${row}`).value = `${dateDebut || 'Début'} à ${dateFin || 'Aujourd\'hui'}`;
        row += 2;
      }

      worksheet.getCell(`A${row}`).value = 'RÉSUMÉ GLOBAL';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = 'Total Recettes';
      worksheet.getCell(`B${row}`).value = totalRecettes;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = 'Total Dépenses';
      worksheet.getCell(`B${row}`).value = totalDepenses;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row += 2;

      worksheet.getCell(`A${row}`).value = 'CALCULS FISCAUX';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = `TVA (${(tauxTVA * 100).toFixed(0)}%)`;
      worksheet.getCell(`B${row}`).value = montantTVA;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = `Impôt Sociétés (${(tauxIS * 100).toFixed(0)}%)`;
      worksheet.getCell(`B${row}`).value = montantIS;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row += 2;

      worksheet.getCell(`A${row}`).value = 'Solde Net (après TVA + IS)';
      worksheet.getCell(`B${row}`).value = soldeNet;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      worksheet.getCell(`B${row}`).font = { bold: true };
      row++;

      worksheet.getCell(`A${row}`).value = 'Ratio Rentabilité (%)';
      worksheet.getCell(`B${row}`).value = parseFloat(ratioRentabilite);
      worksheet.getCell(`B${row}`).numFmt = '0.00';
      row += 2;

      worksheet.getCell(`A${row}`).value = 'DÉTAILS PAR FILIALE';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = 'Filiale';
      worksheet.getCell(`B${row}`).value = 'Recettes';
      worksheet.getCell(`C${row}`).value = 'Solde';
      worksheet.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };
      worksheet.getRow(row).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row++;

      filiales.forEach(filiale => {
        const fRec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);
        const fSolde = fRec;

        worksheet.getCell(`A${row}`).value = filiale.nom;
        worksheet.getCell(`B${row}`).value = fRec;
        worksheet.getCell(`B${row}`).numFmt = '#,##0';
        worksheet.getCell(`C${row}`).value = fSolde;
        worksheet.getCell(`C${row}`).numFmt = '#,##0';
        row++;
      });

      worksheet.columns = [
        { width: 35 },
        { width: 18 },
        { width: 18 },
        { width: 18 }
      ];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-bilan.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Erreur bilan-excel:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== EXCEL - RAPPORT COMPLET (NOUVELLE ROUTE - était manquante !) ==========
  // Le frontend l'appelait mais elle n'existait pas → 404 quand on choisissait "Complet" + Excel
  app.get('/api/rapports/complet-excel', async (req, res) => {
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
        supabase.from('filiales').select('*, domaines_activite(nom)')
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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rapport Complet');

      let row = 1;

      // En-tête entreprise
      worksheet.mergeCells(`A${row}:E${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:E${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email} | ${smi.telephone}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:E${row}`);
      worksheet.getCell(`A${row}`).value = `RAPPORT COMPLET - Généré le ${new Date().toLocaleDateString('fr-FR')}`;
      worksheet.getCell(`A${row}`).font = { italic: true, size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      // Résumé exécutif
      worksheet.getCell(`A${row}`).value = 'RÉSUMÉ EXÉCUTIF';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = 'Total Recettes';
      worksheet.getCell(`B${row}`).value = totalRecettes;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = 'Total Dépenses';
      worksheet.getCell(`B${row}`).value = totalDepenses;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = `TVA (${(tauxTVA * 100).toFixed(0)}%)`;
      worksheet.getCell(`B${row}`).value = montantTVA;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = `Impôt Sociétés (${(tauxIS * 100).toFixed(0)}%)`;
      worksheet.getCell(`B${row}`).value = montantIS;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = 'Solde Net (après TVA + IS)';
      worksheet.getCell(`B${row}`).value = soldeNet;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      worksheet.getCell(`B${row}`).font = { bold: true };
      row += 2;

      // Détail par filiale
      worksheet.getCell(`A${row}`).value = 'DÉTAILS PAR FILIALE';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = 'Filiale';
      worksheet.getCell(`B${row}`).value = 'Domaine';
      worksheet.getCell(`C${row}`).value = 'Recettes';
      worksheet.getCell(`D${row}`).value = 'Dépenses';
      worksheet.getCell(`E${row}`).value = 'Solde';
      worksheet.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };
      worksheet.getRow(row).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row++;

      filiales.forEach(filiale => {
        const fRec = recettes.filter(r => r.filiale_id === filiale.id).reduce((sum, r) => sum + (r.montant || 0), 0);
        const fDep = depenses.filter(d => d.filiale_id === filiale.id).reduce((sum, d) => sum + (d.montant || 0), 0);
        const fSolde = fRec - fDep;

        worksheet.getCell(`A${row}`).value = filiale.nom || 'N/A';
        worksheet.getCell(`B${row}`).value = filiale.domaines_activite?.nom || 'N/A';
        worksheet.getCell(`C${row}`).value = fRec;
        worksheet.getCell(`C${row}`).numFmt = '#,##0';
        worksheet.getCell(`D${row}`).value = fDep;
        worksheet.getCell(`D${row}`).numFmt = '#,##0';
        worksheet.getCell(`E${row}`).value = fSolde;
        worksheet.getCell(`E${row}`).numFmt = '#,##0';
        row++;
      });

      worksheet.columns = [
        { width: 30 },
        { width: 22 },
        { width: 18 },
        { width: 18 },
        { width: 18 }
      ];

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-complet.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Erreur complet-excel:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== EXCEL - FILIALES ==========
  app.get('/api/rapports/filiales-excel', async (req, res) => {
    try {
      const { domaineId } = req.query;

      const smi = await getParametres(supabase);

      let query = supabase.from('filiales').select('*, domaines_activite(nom)');
      if (domaineId) query = query.eq('domaine_id', domaineId);

      const { data: filiales, error } = await query;
      if (error) throw error;

      const filialesAvecGerants = await Promise.all(
        (filiales || []).map(async (filiale) => {
          const { data: gerants } = await supabase
            .from('gerants')
            .select('*')
            .eq('filiale_id', filiale.id);
          return { ...filiale, gerants: gerants || [] };
        })
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Filiales');

      let row = 1;

      worksheet.mergeCells(`A${row}:H${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:H${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email} | ${smi.telephone}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Nom', key: 'nom', width: 30 },
        { header: 'Domaine', key: 'domaine', width: 20 },
        { header: 'Ville', key: 'ville', width: 15 },
        { header: 'Téléphone', key: 'telephone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Gérants', key: 'gerants', width: 40 },
        { header: 'Statut', key: 'statut', width: 12 }
      ];

      worksheet.getRow(row).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };
      row++;

      if (filialesAvecGerants && filialesAvecGerants.length > 0) {
        filialesAvecGerants.forEach(filiale => {
          const gerantsText = filiale.gerants
            .map(g => g.nom_complet || `${g.prenom} ${g.nom}`)
            .join(', ');

          worksheet.addRow({
            code: filiale.code || 'N/A',
            nom: filiale.nom || 'N/A',
            domaine: filiale.domaines_activite?.nom || 'N/A',
            ville: filiale.ville || 'N/A',
            telephone: filiale.telephone || 'N/A',
            email: filiale.email || 'N/A',
            gerants: gerantsText || 'N/A',
            statut: filiale.statut || 'Active'
          });
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-filiales.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Erreur filiales-excel:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ========== EXCEL - GÉRANTS ==========
  app.get('/api/rapports/gerants-excel', async (req, res) => {
    try {
      const smi = await getParametres(supabase);

      const [filialesRes, gerantsRes] = await Promise.all([
        supabase.from('filiales').select('*').order('nom'),
        supabase.from('gerants').select('*').order('filiale_id')
      ]);

      const filiales = filialesRes.data || [];
      const gerants = gerantsRes.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Gerants');

      let row = 1;

      worksheet.mergeCells(`A${row}:G${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:G${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email} | ${smi.telephone}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Filiale', key: 'filiale', width: 25 },
        { header: 'Nom Complet', key: 'nomComplet', width: 25 },
        { header: 'Poste', key: 'poste', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Téléphone', key: 'telephone', width: 15 },
        { header: 'Date Embauche', key: 'dateEmbauche', width: 15 },
        { header: 'Statut', key: 'statut', width: 12 }
      ];

      worksheet.getRow(row).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };
      row++;

      filiales.forEach((filiale) => {
        const filialeGerants = gerants.filter(g => g.filiale_id === filiale.id);
        if (filialeGerants.length === 0) return;

        filialeGerants.forEach((gerant) => {
          worksheet.addRow({
            filiale: filiale.nom,
            nomComplet: gerant.nom_complet || `${gerant.prenom} ${gerant.nom}`,
            poste: gerant.poste || 'N/A',
            email: gerant.email || 'N/A',
            telephone: gerant.telephone || 'N/A',
            dateEmbauche: gerant.date_embauche ? new Date(gerant.date_embauche).toLocaleDateString('fr-FR') : 'N/A',
            statut: gerant.statut || 'Active'
          });
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="rapport-gerants.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Erreur gerants-excel:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  console.log('✅ Routes rapports Excel chargées');
}
