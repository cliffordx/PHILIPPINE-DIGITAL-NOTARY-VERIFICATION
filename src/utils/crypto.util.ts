import * as crypto from 'crypto';

/**
 * Generate a SHA-256 hash of a document's content
 * Documents are never stored - only their hashes
 */
export function hashDocument(content: Buffer | string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Generate a serial number for a notarized document
 * Format: LLLL-YYYY-BB-SSSS
 * where LLLL = lawyer roll number (padded), YYYY = year,
 * BB = book number (padded), SSSS = sequence (padded)
 *
 * Example: PH12345-2024-001-0001
 */
export function generateSerialNumber(
  rollNumber: string,
  year: number,
  bookNumber: number,
  sequence: number,
): string {
  const paddedRoll = rollNumber.padStart(6, '0').toUpperCase();
  const paddedBook = String(bookNumber).padStart(3, '0');
  const paddedSeq = String(sequence).padStart(4, '0');
  return `PH${paddedRoll}-${year}-${paddedBook}-${paddedSeq}`;
}

/**
 * Generate a verification checksum for a serial number
 */
export function generateVerificationChecksum(serialNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(serialNumber)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();
}
