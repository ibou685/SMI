// backend/src/services/pdf.js
// Service de génération de rapports PDF

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const COLORS = {
  primary: '#DC2626',    // Red
  secondary: '#1F2937',  // Gray
  success: '#10B981',    // Green
  danger: '#EF4444',     // Red light
  light: '#F3F4F6'       // Light gray
};

function addHeader(doc, title) {
  // Logo/Title
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(COLORS.primary)
    .text('SMI', 50, 40);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(COLORS.secondary)
    .text('Senegal Multiservices International', 50, 65);

  // Titre rapport
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(COLORS.secondary)
    .text(title, 50, 100);

  // Date
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(COLORS.secondary)
    .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 50, 125);

  // Ligne de séparation
  doc.strokeColor(COLORS.light).lineWidth(1).moveTo(50, 140).lineTo(550, 140).stroke();

  return 150;
}

function addFooter(doc, pageNum) {
  const pageCount = doc.bufferedPageRange().count;
  doc
    .fontSize(8)
    .fillColor(COLORS.secondary)
    .text(
      `Page ${pageNum} / ${pageCount}`,
      50,
      doc.page.height - 30,
      { align: 'center' }
    );
}

export function generateDailyReport(data) {
  const doc = new PDFDocument();

  let y = addHeader(doc, 'Rapport Journalier');

  // Stats
  const stats = [
    { label: 'Recettes', value: data.totalRecettes, color: '#10B981' },
    { label: 'Dépenses', value: data.totalDepenses, color: '#EF4444' },
    { label: 'Solde', value: data.solde, color: COLORS.primary }
  ];

  stats.forEach((stat, idx) => {
    const xPos = 50 + idx * 150;
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(COLORS.secondary)
      .text(stat.label, xPos, y);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(stat.color)
      .text(`${(stat.value / 1000000).toFixed(2)}M FCFA`, xPos, y + 20);

    doc.strokeColor(COLORS.light).lineWidth(0.5).moveTo(xPos - 5, y + 45).lineTo(xPos + 130, y + 45).stroke();
  });

  y += 80;

  // Recettes détail
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.secondary)
    .text('Recettes', 50, y);

  y += 25;

  if (data.recettes && data.recettes.length > 0) {
    const columnPositions = [50, 200, 350, 450];
    const headers = ['Filiale', 'Montant', 'Mode', 'Référence'];

    // Headers
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.primary);
    headers.forEach((header, idx) => {
      doc.text(header, columnPositions[idx], y);
    });

    y += 20;
    doc.strokeColor(COLORS.light).lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Rows
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.secondary);
    data.recettes.forEach((recette) => {
      doc.text(recette.filiale || 'N/A', columnPositions[0], y);
      doc.text(`${(recette.montant / 1000000).toFixed(2)}M`, columnPositions[1], y);
      doc.text(recette.mode_paiement || '-', columnPositions[2], y);
      doc.text(recette.reference || '-', columnPositions[3], y);
      y += 15;
    });
  } else {
    doc.fontSize(10).fillColor(COLORS.secondary).text('Aucune recette', 50, y);
    y += 20;
  }

  // Dépenses détail
  y += 30;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.secondary)
    .text('Dépenses', 50, y);

  y += 25;

  if (data.depenses && data.depenses.length > 0) {
    const columnPositions = [50, 200, 350, 450];
    const headers = ['Catégorie', 'Montant', 'Description', 'Responsable'];

    // Headers
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.primary);
    headers.forEach((header, idx) => {
      doc.text(header, columnPositions[idx], y);
    });

    y += 20;
    doc.strokeColor(COLORS.light).lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Rows
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.secondary);
    data.depenses.forEach((depense) => {
      doc.text(depense.categorie, columnPositions[0], y);
      doc.text(`${(depense.montant / 1000000).toFixed(2)}M`, columnPositions[1], y);
      doc.text(depense.description || '-', columnPositions[2], y);
      doc.text(depense.responsable || '-', columnPositions[3], y);
      y += 15;
    });
  } else {
    doc.fontSize(10).fillColor(COLORS.secondary).text('Aucune dépense', 50, y);
  }

  addFooter(doc, 1);

  return doc;
}

export function generateMonthlyReport(data) {
  const doc = new PDFDocument();

  let y = addHeader(doc, `Rapport Mensuel - ${data.month}`);

  // Résumé
  const summary = [
    { label: 'Total Recettes', value: data.totalRecettes },
    { label: 'Total Dépenses', value: data.totalDepenses },
    { label: 'Bénéfice Net', value: data.benefice }
  ];

  doc.fontSize(11).font('Helvetica').fillColor(COLORS.secondary);
  y += 30;

  summary.forEach((item) => {
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(item.label, 50, y);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(`${(item.value / 1000000).toFixed(2)}M FCFA`, 300, y);

    y += 25;
    doc.fillColor(COLORS.secondary);
  });

  // Classement filiales
  y += 20;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.secondary)
    .text('Top Filiales', 50, y);

  y += 25;

  if (data.filiales && data.filiales.length > 0) {
    const columnPositions = [50, 200, 350];
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.primary);
    doc.text('Filiale', columnPositions[0], y);
    doc.text('Versements', columnPositions[1], y);
    doc.text('Total', columnPositions[2], y);

    y += 20;
    doc.strokeColor(COLORS.light).lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    doc.fontSize(8).font('Helvetica').fillColor(COLORS.secondary);
    data.filiales.forEach((filiale) => {
      doc.text(filiale.nom, columnPositions[0], y);
      doc.text(filiale.count.toString(), columnPositions[1], y);
      doc.text(`${(filiale.total / 1000000).toFixed(2)}M`, columnPositions[2], y);
      y += 15;
    });
  }

  addFooter(doc, 1);

  return doc;
}

export function generateAnnualReport(data) {
  const doc = new PDFDocument();

  let y = addHeader(doc, `Rapport Annuel - ${data.year}`);

  // Résumé annuel
  const stats = [
    { label: 'Chiffre d\'affaires', value: data.totalRecettes },
    { label: 'Charges', value: data.totalDepenses },
    { label: 'Résultat', value: data.resultat }
  ];

  y += 30;
  stats.forEach((stat) => {
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(COLORS.secondary)
      .text(stat.label, 50, y);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(COLORS.primary)
      .text(`${(stat.value / 1000000).toFixed(2)}M FCFA`, 300, y);

    y += 25;
  });

  // Évolution mensuelle
  y += 30;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(COLORS.secondary)
    .text('Évolution Mensuelle', 50, y);

  y += 25;

  if (data.mois && data.mois.length > 0) {
    const columnPositions = [50, 150, 250, 350, 450];
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary);
    doc.text('Mois', columnPositions[0], y);
    doc.text('Recettes', columnPositions[1], y);
    doc.text('Dépenses', columnPositions[2], y);
    doc.text('Solde', columnPositions[3], y);

    y += 15;
    doc.strokeColor(COLORS.light).lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    doc.fontSize(7).font('Helvetica').fillColor(COLORS.secondary);
    data.mois.forEach((mois) => {
      doc.text(mois.nom, columnPositions[0], y);
      doc.text(`${(mois.recettes / 1000000).toFixed(1)}M`, columnPositions[1], y);
      doc.text(`${(mois.depenses / 1000000).toFixed(1)}M`, columnPositions[2], y);
      doc.text(`${(mois.solde / 1000000).toFixed(1)}M`, columnPositions[3], y);
      y += 12;
    });
  }

  addFooter(doc, 1);

  return doc;
}