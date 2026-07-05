const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const locales = ['fr', 'en', 'ar'];
const texts = {
  fr: {
    title: 'ASSURINI - Police d\'Assurance',
    lines: [
      'Ce document est une simulation.',
      '',
      'Police d\'assurance voyage fictive.',
      '',
      `Date: ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      'Merci de votre confiance.',
    ],
  },
  en: {
    title: 'ASSURINI - Insurance Policy',
    lines: [
      'This document is a simulation.',
      '',
      'Fictitious travel insurance policy.',
      '',
      `Date: ${new Date().toLocaleDateString('en-US')}`,
      '',
      'Thank you for your trust.',
    ],
  },
  ar: {
    title: 'ASSURINI - وثيقة التأمين',
    lines: [
      'هذا المستند هو محاكاة.',
      '',
      'وثيقة تأمين سفر افتراضية.',
      '',
      `التاريخ: ${new Date().toLocaleDateString('ar-DZ')}`,
      '',
      'شكراً لثقتكم.',
    ],
  },
};

for (const locale of locales) {
  const { title, lines } = texts[locale];
  const filePath = path.join('public', 'documents', `mock-policy-${locale}.pdf`);
  const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(22).text(title, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).text(lines.join('\n'), { align: 'left' });
  doc.end();
  console.log(`Created: ${filePath}`);
}

console.log('All PDFs created successfully.');
