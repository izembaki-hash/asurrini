"use client";

import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { useLocale, useTranslations } from "next-intl";
import type { MockUser, ContractPlanDetails } from "@/lib/types";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { QRCodeCanvas } from 'qrcode.react';
import { format, parseISO } from "date-fns";
import { fr, enUS, ar } from "date-fns/locale";

const dateLocaleMap: Record<string, Locale> = {
  fr,
  en: enUS,
  ar,
};

interface DownloadContractButtonProps {
  user: MockUser;
  planDetails: ContractPlanDetails;
}

export function DownloadContractButton({ user, planDetails }: DownloadContractButtonProps) {
  const locale = useLocale();
  const t = useTranslations('contract');
  const dateLocale = dateLocaleMap[locale] || fr;

  const policyNumber = planDetails.policyNumber;

  const qrCodeData = useMemo(() => {
    const startDateFormatted = planDetails.startDate ? format(parseISO(planDetails.startDate), "dd/MM/yy", { locale: dateLocale }) : 'N/A';
    const endDateFormatted = planDetails.endDate ? format(parseISO(planDetails.endDate), "dd/MM/yy", { locale: dateLocale }) : 'N/A';
    let qrData = `${t('policyNumber')}: ${policyNumber}\n${t('fullName')}: ${planDetails.userFullName || user.fullName || user.email}\n${t('passportNumber')}: ${planDetails.userPassportNumber || user.passportNumber || 'N/A'}\n${t('planName')}: ${planDetails.planName}\n${t('coveragePeriod')}: ${startDateFormatted} - ${endDateFormatted}\n${t('destination')}: ${planDetails.destination || 'N/A'}`;
    if (planDetails.lastModifiedDate) {
      qrData += `\n${t('lastModified')}: ${format(parseISO(planDetails.lastModifiedDate), "dd/MM/yy HH:mm", { locale: dateLocale })}`;
    }
    qrData += `\n${t('planPrice')}: ${planDetails.price} ${planDetails.currency}`;
    return qrData;
  }, [policyNumber, user, planDetails, t, dateLocale]);

  const handleDownloadPdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const FONT_FAMILY = "helvetica";

    const insurerName = APP_NAME;
    const insurerAddress = t('insurerAddress');
    const insurerContact = `support@${APP_NAME.toLowerCase().replace(/\s+/g, '')}.dz / +213 (0)XX XX XX XX`;

    const issueDateToDisplay = planDetails.issueDate ? format(parseISO(planDetails.issueDate), "dd MMMM yyyy", { locale: dateLocale }) : format(new Date(), "dd MMMM yyyy", { locale: dateLocale });
    const lastModifiedDateDisplay = planDetails.lastModifiedDate ? format(parseISO(planDetails.lastModifiedDate), "dd MMMM yyyy HH:mm", { locale: dateLocale }) : null;

    let qrDataUrl = "";
    const canvasElement = document.getElementById('qr-canvas-for-pdf-hidden') as HTMLCanvasElement | null;

    if (canvasElement) {
      try {
        qrDataUrl = canvasElement.toDataURL('image/png');
      } catch (e) {
        console.error("Error generating QR data URL from canvas:", e);
      }
    }

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(18);
    pdf.text(insurerName, pageWidth / 2, y, { align: "center" });
    y += 7;
    pdf.setFontSize(12);
    pdf.text(t('pdfTitle'), pageWidth / 2, y, { align: "center" });
    y += 10;

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(9);
    pdf.text(insurerAddress, margin, y);
    y += 4;
    pdf.text(insurerContact, margin, y);

    if (qrDataUrl) {
      try {
        const qrSize = 30;
        const qrX = pageWidth - margin - qrSize;
        const qrY = y - 10;
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (e) {
        console.error("Error adding QR code image to PDF:", e);
        const qrErrorY = margin + 15;
        pdf.setFont(FONT_FAMILY, "italic");
        pdf.setFontSize(7);
        pdf.text(t('qrCodeNotGenerated'), pageWidth - margin - 35, qrErrorY, { align: 'right', maxWidth: 30 });
      }
    } else {
      const qrPlaceholderY = margin + 15;
      pdf.setFont(FONT_FAMILY, "italic");
      pdf.setFontSize(8);
      pdf.text(t('qrCodeNotGenerated'), pageWidth - margin - 35, qrPlaceholderY, { align: 'right', maxWidth: 30 });
      pdf.setFontSize(6);
      pdf.text(qrCodeData.split('\n').slice(0,5).join(' | '), pageWidth - margin - 35, qrPlaceholderY + 5, { align: "right", maxWidth: 30 });
    }

    y += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(11);
    pdf.text(t('policyDetails'), margin, y);
    y += 6;

    const addDetail = (label: string, value: string | undefined | null, options?: { isPrice?: boolean }) => {
      if (value === undefined || value === null || String(value).trim() === "") return;
      pdf.setFont(FONT_FAMILY, "bold");
      pdf.text(label + ":", margin + 5, y);
      pdf.setFont(FONT_FAMILY, "normal");
      let displayValue = String(value);
      if (options?.isPrice && planDetails.currency) {
        displayValue = `${value} ${planDetails.currency}`;
      }
      const textLines = pdf.splitTextToSize(displayValue, pageWidth - margin - 65 - (margin+5));
      pdf.text(textLines, margin + 55, y);
      y += (textLines.length * 4) + 2;
    };

    addDetail(t('policyNumber'), policyNumber);
    addDetail(t('issueDate'), issueDateToDisplay);
    if(lastModifiedDateDisplay) addDetail(t('lastModified'), lastModifiedDateDisplay);
    addDetail(t('planName'), planDetails.planName);
    addDetail(t('provider'), planDetails.provider);
    addDetail(t('planPrice'), planDetails.price, {isPrice: true});
    if(planDetails.actualModificationCostPaid) addDetail(t('modificationCostPaid'), planDetails.actualModificationCostPaid, {isPrice: true});

    y += 2;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.text(t('insuredInfo'), margin, y);
    y += 6;
    addDetail(t('fullName'), planDetails.userFullName || user.fullName || user.email);
    addDetail(t('email'), planDetails.userEmail || user.email);
    const passportNum = planDetails.userPassportNumber || user.passportNumber;
    if (passportNum) addDetail(t('passportNumber'), passportNum);
    if (user.phoneNumber) addDetail(t('phoneNumber'), user.phoneNumber);
    if (user.address) addDetail(t('postalAddress'), user.address);
    y += 2;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.text(t('tripDetails'), margin, y);
    y += 6;
    addDetail(t('destination'), planDetails.destination);

    const tripStartDateFormatted = planDetails.startDate ? format(parseISO(planDetails.startDate), "dd MMMM yyyy", { locale: dateLocale }) : "N/A";
    const tripEndDateFormatted = planDetails.endDate ? format(parseISO(planDetails.endDate), "dd MMMM yyyy", { locale: dateLocale }) : "N/A";
    addDetail(t('coveragePeriod'), t('fromTo', { startDate: tripStartDateFormatted, endDate: tripEndDateFormatted }));
    y += 5;

    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7;

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(10);
    pdf.text(t('coverageSummary'), margin, y);
    y += 5;
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(8);
    const coverageText = planDetails.coverageDetails || t('coverageDefault');
    const coverageLines = pdf.splitTextToSize(coverageText, pageWidth - margin * 2);
    pdf.text(coverageLines, margin, y);
    y += (coverageLines.length * 3.5) + 5;

    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(10);
    pdf.text(t('termsAndConditions'), margin, y);
    y += 5;
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(8);
    const policyLink = planDetails.policyDocumentLink && planDetails.policyDocumentLink !== "MOCK_POLICY_LINK_PLACEHOLDER"
      ? planDetails.policyDocumentLink
      : '(document disponible sur demande)';
    const termsText = t('termsText', {
      planName: planDetails.planName,
      provider: planDetails.provider,
      policyLink,
      insurerName,
    });
    const termsLines = pdf.splitTextToSize(termsText, pageWidth - margin * 2);
    pdf.text(termsLines, margin, y);
    y += (termsLines.length * 3.5) + 5;

    const disclaimer = t('disclaimer', { appName: APP_NAME });
    pdf.setFont(FONT_FAMILY, "italic");
    pdf.setFontSize(8);
    const disclaimerY = pdf.internal.pageSize.getHeight() - margin + 8;
    if (y > disclaimerY - 5) {
      pdf.addPage();
      y = margin;
      pdf.text(disclaimer, pageWidth / 2, pdf.internal.pageSize.getHeight() - margin + 8, { align: "center" });
    } else {
      pdf.text(disclaimer, pageWidth / 2, disclaimerY, { align: "center" });
    }

    const suffix = lastModifiedDateDisplay ? t('modifiedSuffix') : '';
    pdf.save(t('fileName', { policyNumber, suffix }));
  };

  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '256px', height: '256px' }}>
        {typeof window !== 'undefined' && (
          <QRCodeCanvas
            value={qrCodeData}
            size={256}
            level="M"
            id="qr-canvas-for-pdf-hidden"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        )}
      </div>
      <Button onClick={handleDownloadPdf} variant="default" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
        <Download className="me-2 h-4 w-4" />
        {t('downloadButton')}
      </Button>
    </>
  );
}
