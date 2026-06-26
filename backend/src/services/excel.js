// backend/src/services/excel.js
// Service d'export en fichiers Excel

import ExcelJS from 'exceljs';

const STYLE_HEADER = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } },
  alignment: { horizontal: 'center', vertical: 'center' }
};

const STYLE_TOTAL = {
  font: { bold: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
};

export async function exportFiliales(filiales) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Filiales');

  // Headers
  worksheet.columns = [
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Nom', key: 'nom', width: 25 },
    { header: 'Ville', key: 'ville', width: 15 },
    { header: 'Région', key: 'region', width: 15 },
    { header: 'Téléphone', key: 'telephone', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Date Création', key: 'created_at', width: 18 }
  ];

  // Apply header style
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = STYLE_HEADER;
  });

  // Data rows
  filiales.forEach((filiale) => {
    worksheet.addRow({
      code: filiale.code,
      nom: filiale.nom,
      ville: filiale.ville,
      region: filiale.region,
      telephone: filiale.telephone,
      email: filiale.email,
      statut: filiale.statut,
      created_at: new Date(filiale.created_at).toLocaleDateString('fr-FR')
    });
  });

  // Freeze header
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function exportRecettes(recettes, filiales = []) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Recettes');

  // Headers
  worksheet.columns = [
    { header: 'Date', key: 'date_versement', width: 12 },
    { header: 'Filiale', key: 'filiale', width: 20 },
    { header: 'Montant (FCFA)', key: 'montant', width: 18 },
    { header: 'Mode Paiement', key: 'mode_paiement', width: 15 },
    { header: 'Référence', key: 'reference_paiement', width: 20 },
    { header: 'Observation', key: 'observation', width: 25 }
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = STYLE_HEADER;
  });

  // Data rows
  recettes.forEach((recette) => {
    const filiale = filiales.find((f) => f.id === recette.filiale_id);
    worksheet.addRow({
      date_versement: new Date(recette.date_versement).toLocaleDateString('fr-FR'),
      filiale: filiale?.nom || 'N/A',
      montant: recette.montant,
      mode_paiement: recette.mode_paiement,
      reference_paiement: recette.reference_paiement,
      observation: recette.observation
    });
  });

  // Format numbers
  worksheet.getColumn('montant').numFmt = '#,##0.00';

  // Total row
  const lastRow = worksheet.lastRow.number + 1;
  worksheet.getRow(lastRow).getCell(1).value = 'TOTAL';
  worksheet.getRow(lastRow).getCell(3).value = {
    formula: `SUM(C2:C${lastRow - 1})`
  };
  worksheet.getRow(lastRow).eachCell((cell) => {
    cell.style = STYLE_TOTAL;
  });

  // Freeze header
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function exportDepenses(depenses) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dépenses');

  // Headers
  worksheet.columns = [
    { header: 'Date', key: 'date_depense', width: 12 },
    { header: 'Catégorie', key: 'categorie', width: 18 },
    { header: 'Montant (FCFA)', key: 'montant', width: 18 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Responsable', key: 'responsable', width: 20 }
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = STYLE_HEADER;
  });

  // Group by category
  const categoriesMap = {};
  depenses.forEach((dep) => {
    if (!categoriesMap[dep.categorie]) {
      categoriesMap[dep.categorie] = [];
    }
    categoriesMap[dep.categorie].push(dep);
  });

  let currentRow = 2;
  let totalByCategory = {};

  Object.entries(categoriesMap).forEach(([category, items]) => {
    items.forEach((depense) => {
      worksheet.addRow(
        {
          date_depense: new Date(depense.date_depense).toLocaleDateString('fr-FR'),
          categorie: depense.categorie,
          montant: depense.montant,
          description: depense.description,
          responsable: depense.responsable
        },
        currentRow++
      );

      if (!totalByCategory[category]) {
        totalByCategory[category] = 0;
      }
      totalByCategory[category] += depense.montant;
    });

    // Subtotal by category
    const subtotalRow = currentRow++;
    worksheet.getRow(subtotalRow).getCell(2).value = `Sous-total ${category}`;
    worksheet.getRow(subtotalRow).getCell(3).value = totalByCategory[category];
    worksheet.getRow(subtotalRow).eachCell((cell) => {
      cell.style = STYLE_TOTAL;
    });
  });

  // Total
  const totalRow = currentRow + 1;
  worksheet.getRow(totalRow).getCell(2).value = 'TOTAL GÉNÉRAL';
  worksheet.getRow(totalRow).getCell(3).value = {
    formula: `SUM(C2:C${currentRow - 1})`
  };
  worksheet.getRow(totalRow).eachCell((cell) => {
    cell.style = { ...STYLE_TOTAL, font: { ...STYLE_TOTAL.font, size: 12 } };
  });

  // Format numbers
  worksheet.getColumn('montant').numFmt = '#,##0.00';

  // Freeze header
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function exportRapportMensuel(data) {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Résumé
  const summarySheet = workbook.addWorksheet('Résumé');
  summarySheet.columns = [
    { header: 'Indicateur', key: 'indicator', width: 25 },
    { header: 'Montant (FCFA)', key: 'amount', width: 18 }
  ];

  summarySheet.getRow(1).eachCell((cell) => {
    cell.style = STYLE_HEADER;
  });

  summarySheet.addRow({ indicator: 'Total Recettes', amount: data.totalRecettes });
  summarySheet.addRow({ indicator: 'Total Dépenses', amount: data.totalDepenses });
  summarySheet.addRow({ indicator: 'Bénéfice Net', amount: data.benefice });

  summarySheet.getColumn('amount').numFmt = '#,##0.00';

  // Sheet 2: Filiales
  const filialesSheet = workbook.addWorksheet('Filiales');
  filialesSheet.columns = [
    { header: 'Filiale', key: 'filiale', width: 25 },
    { header: 'Versements', key: 'count', width: 12 },
    { header: 'Total (FCFA)', key: 'total', width: 18 }
  ];

  filialesSheet.getRow(1).eachCell((cell) => {
    cell.style = STYLE_HEADER;
  });

  data.filiales.forEach((filiale) => {
    filialesSheet.addRow({
      filiale: filiale.nom,
      count: filiale.count,
      total: filiale.total
    });
  });

  filialesSheet.getColumn('total').numFmt = '#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}