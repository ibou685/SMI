// backend/src/routes-rapports-excel.js - Toutes les routes Excel

import ExcelJS from 'exceljs';

export function registerExcelRoutes(app, supabase, formatMontantPDF) {
  
  // ========== EXCEL - RECETTES ==========
  app.get('/api/rapports/recettes-excel', async (req, res) => {
    try {
      const { dateDebut, dateFin, filialeId } = req.query;

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || { nomEntreprise: '...', adresse: '...', email: '...' };

      let query = supabase.from('recettes').select('*');
      
      if (dateDebut) query = query.gte('created_at', dateDebut);
      if (dateFin) query = query.lte('created_at', dateFin);
      if (filialeId) query = query.eq('filiale_id', filialeId);

      const { data: recettes, error } = await query;
      if (error) throw error;

      const { data: filiales } = await supabase.from('filiales').select('id, nom, code');
      const filialesMap = {};
      (filiales || []).forEach(f => {
        filialesMap[f.id] = f;
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Recettes');

      let row = 1;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Filiale', key: 'filiale', width: 25 },
        { header: 'Montant (FCFA)', key: 'montant', width: 15 },
        { header: 'Catégorie', key: 'categorie', width: 20 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Date', key: 'date', width: 12 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };

      if (recettes && recettes.length > 0) {
        recettes.forEach(r => {
          const filiale = filialesMap[r.filiale_id];
          worksheet.addRow({
            filiale: filiale?.nom || 'N/A',
            montant: r.montant || 0,
            categorie: r.categorie || 'N/A',
            description: r.description || '',
            date: new Date(r.created_at).toLocaleDateString('fr-FR')
          });
        });

        const totalRow = worksheet.addRow({});
        totalRow.getCell('filiale').value = 'TOTAL';
        totalRow.getCell('montant').value = {
          formula: `SUM(B2:B${recettes.length + 1})`
        };
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

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || { nomEntreprise: '...', adresse: '...', email: '...' };

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
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Montant (FCFA)', key: 'montant', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Date', key: 'date', width: 12 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };

      if (depenses && depenses.length > 0) {
        depenses.forEach(d => {
          worksheet.addRow({
            montant: d.montant || 0,
            type: d.type || 'N/A',
            description: d.description || '',
            date: new Date(d.created_at).toLocaleDateString('fr-FR')
          });
        });

        const totalRow = worksheet.addRow({});
        totalRow.getCell('type').value = 'TOTAL';
        totalRow.getCell('montant').value = {
          formula: `SUM(A2:A${depenses.length + 1})`
        };
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

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || { 
        nomEntreprise: '...', 
        adresse: '...', 
        email: '...',
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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bilan');

      let row = 1;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.getCell(`A${row}`).value = 'BILAN FINANCIER';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 14 };
      row++;

      worksheet.getCell(`A${row}`).value = `Genere le: ${new Date().toLocaleDateString('fr-FR')}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      row += 2;

      if (dateDebut || dateFin) {
        worksheet.getCell(`A${row}`).value = 'Periode:';
        worksheet.getCell(`A${row}`).font = { bold: true };
        row++;
        worksheet.getCell(`A${row}`).value = `${dateDebut} a ${dateFin}`;
        row += 2;
      }

      worksheet.getCell(`A${row}`).value = 'RESUME GLOBAL';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = 'Total Recettes';
      worksheet.getCell(`B${row}`).value = totalRecettes;
      worksheet.getCell(`B${row}`).numFmt = '#,##0';
      row++;

      worksheet.getCell(`A${row}`).value = 'Total Depenses';
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

      worksheet.getCell(`A${row}`).value = 'Ratio Rentabilite (%)';
      worksheet.getCell(`B${row}`).value = ratioRentabilite;
      worksheet.getCell(`B${row}`).numFmt = '0.00';
      row += 2;

      worksheet.getCell(`A${row}`).value = 'DETAILS PAR FILIALE';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
      row++;

      worksheet.getCell(`A${row}`).value = 'Filiale';
      worksheet.getCell(`B${row}`).value = 'Recettes';
      worksheet.getCell(`C${row}`).value = 'Solde';
      worksheet.getRow(row).font = { bold: true };
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
        { width: 15 },
        { width: 15 },
        { width: 15 }
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

  // ========== EXCEL - FILIALES ==========
  app.get('/api/rapports/filiales-excel', async (req, res) => {
    try {
      const { domaineId } = req.query;

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || { nomEntreprise: '...', adresse: '...', email: '...' };

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

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Nom', key: 'nom', width: 30 },
        { header: 'Domaine', key: 'domaine', width: 20 },
        { header: 'Ville', key: 'ville', width: 15 },
        { header: 'Telephone', key: 'telephone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Gerants', key: 'gerants', width: 40 },
        { header: 'Statut', key: 'statut', width: 12 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };

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
      const [filialesRes, gerantsRes] = await Promise.all([
        supabase.from('filiales').select('*').order('nom'),
        supabase.from('gerants').select('*').order('filiale_id')
      ]);

      const { data: parametres } = await supabase
        .from('parametres')
        .select('*')
        .eq('id', 1)
        .single();

      const smi = parametres || { nomEntreprise: '...', adresse: '...', email: '...' };

      const filiales = filialesRes.data || [];
      const gerants = gerantsRes.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Gerants');

      let row = 1;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = smi.nomEntreprise;
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row++;

      worksheet.mergeCells(`A${row}:D${row}`);
      worksheet.getCell(`A${row}`).value = `${smi.adresse} | ${smi.email}`;
      worksheet.getCell(`A${row}`).font = { size: 10 };
      worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      row += 2;

      worksheet.columns = [
        { header: 'Filiale', key: 'filiale', width: 25 },
        { header: 'Nom Complet', key: 'nomComplet', width: 25 },
        { header: 'Poste', key: 'poste', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Telephone', key: 'telephone', width: 15 },
        { header: 'Date Embauche', key: 'dateEmbauche', width: 15 },
        { header: 'Statut', key: 'statut', width: 12 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC41E3A' } };

      let rowNum = 2;
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
          rowNum++;
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
