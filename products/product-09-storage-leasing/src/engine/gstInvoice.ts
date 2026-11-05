/**
 * GST Invoice Generator for Storage & Leasing (India).
 * Produces a structured tax invoice from a rent ledger entry.
 * Intra-state => CGST + SGST; inter-state => IGST.
 */

export interface GstInvoiceLine {
  description: string;
  hsn: string;
  taxableValue: number;
  gstRate: number; // percent
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface GstInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  recipientGstin?: string;
  placeOfSupply: string; // state name
  intraState: boolean;
  lines: GstInvoiceLine[];
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotal: number;
}

export function calculateLateFee(input: {
  dueDate: string;
  asOfDate: string;
  principal: number;
  monthlyRatePercent?: number;
  graceDays?: number;
}): number {
  const grace = input.graceDays ?? 0;
  const due = new Date(input.dueDate);
  const asOf = new Date(input.asOfDate);
  const diffDays = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= grace) return 0;
  const chargeableDays = diffDays - grace;
  const months = chargeableDays / 30;
  const rate = (input.monthlyRatePercent ?? 2) / 100;
  return Math.round(input.principal * rate * months * 100) / 100;
}

export function generateGstInvoice(input: {
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  recipientGstin?: string;
  supplierState: string;
  recipientState: string;
  description: string;
  hsn?: string;
  taxableValue: number;
  gstRate?: number;
  lateFee?: number;
}): GstInvoice {
  const intraState = input.supplierState === input.recipientState;
  const rate = input.gstRate ?? 18;
  const hsn = input.hsn ?? '997212'; // renting of immovable property (SAC)
  const lines: GstInvoiceLine[] = [];
  const base = { description: input.description, hsn, gstRate: rate };
  const tax = Math.round(input.taxableValue * (rate / 100) * 100) / 100;
  const cgst = intraState ? Math.round(tax / 2 * 100) / 100 : 0;
  const sgst = intraState ? Math.round(tax / 2 * 100) / 100 : 0;
  const igst = intraState ? 0 : tax;
  lines.push({ ...base, taxableValue: input.taxableValue, cgst, sgst, igst, total: Math.round((input.taxableValue + cgst + sgst + igst) * 100) / 100 });

  if (input.lateFee && input.lateFee > 0) {
    const lateTax = Math.round(input.lateFee * (rate / 100) * 100) / 100;
    const lateCgst = intraState ? Math.round(lateTax / 2 * 100) / 100 : 0;
    const lateSgst = intraState ? Math.round(lateTax / 2 * 100) / 100 : 0;
    const lateIgst = intraState ? 0 : lateTax;
    lines.push({ description: 'Late fee', hsn, gstRate: rate, taxableValue: input.lateFee, cgst: lateCgst, sgst: lateSgst, igst: lateIgst, total: Math.round((input.lateFee + lateCgst + lateSgst + lateIgst) * 100) / 100 });
  }

  const totalTaxable = lines.reduce((s, l) => s + l.taxableValue, 0);
  const totalCgst = lines.reduce((s, l) => s + l.cgst, 0);
  const totalSgst = lines.reduce((s, l) => s + l.sgst, 0);
  const totalIgst = lines.reduce((s, l) => s + l.igst, 0);
  const grandTotal = lines.reduce((s, l) => s + l.total, 0);

  return {
    invoiceNumber: input.invoiceNumber,
    invoiceDate: input.invoiceDate,
    supplierGstin: input.supplierGstin,
    recipientGstin: input.recipientGstin,
    placeOfSupply: input.recipientState,
    intraState,
    lines,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}