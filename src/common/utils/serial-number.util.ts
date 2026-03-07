export function buildSerialNumber(params: {
  lawyerId: string;
  registerBook: string;
  timestamp: Date;
  sequence: number;
}): string {
  const ts = params.timestamp
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);

  const seq = String(params.sequence).padStart(6, '0');
  return `${params.lawyerId}-${params.registerBook}-${ts}-${seq}`;
}