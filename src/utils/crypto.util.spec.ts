import { generateSerialNumber, hashDocument, generateVerificationChecksum } from './crypto.util';

describe('CryptoUtil', () => {
  describe('hashDocument', () => {
    it('should produce a 64-character hex string for a string input', () => {
      const hash = hashDocument('test content');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce a 64-character hex string for a Buffer input', () => {
      const hash = hashDocument(Buffer.from('test content'));
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce the same hash for the same input', () => {
      const hash1 = hashDocument('same content');
      const hash2 = hashDocument('same content');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashDocument('content a');
      const hash2 = hashDocument('content b');
      expect(hash1).not.toBe(hash2);
    });

    it('should match known SHA-256 value', () => {
      // SHA-256 of empty string
      const hash = hashDocument('');
      expect(hash).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
    });
  });

  describe('generateSerialNumber', () => {
    it('should generate a serial number in the correct format', () => {
      const serial = generateSerialNumber('12345', 2024, 1, 1);
      expect(serial).toBe('PH012345-2024-001-0001');
    });

    it('should pad roll number to 6 digits', () => {
      const serial = generateSerialNumber('999', 2024, 1, 1);
      expect(serial).toContain('PH000999');
    });

    it('should pad book number to 3 digits', () => {
      const serial = generateSerialNumber('12345', 2024, 5, 1);
      expect(serial).toContain('-005-');
    });

    it('should pad sequence to 4 digits', () => {
      const serial = generateSerialNumber('12345', 2024, 1, 50);
      expect(serial).toContain('-0050');
    });

    it('should handle large sequence numbers', () => {
      const serial = generateSerialNumber('12345', 2024, 1, 9999);
      expect(serial).toBe('PH012345-2024-001-9999');
    });

    it('should produce unique serials for different sequences', () => {
      const serial1 = generateSerialNumber('12345', 2024, 1, 1);
      const serial2 = generateSerialNumber('12345', 2024, 1, 2);
      expect(serial1).not.toBe(serial2);
    });
  });

  describe('generateVerificationChecksum', () => {
    it('should generate an 8-character uppercase hex checksum', () => {
      const checksum = generateVerificationChecksum('PH012345-2024-001-0001');
      expect(checksum).toHaveLength(8);
      expect(checksum).toMatch(/^[A-F0-9]{8}$/);
    });

    it('should be deterministic', () => {
      const serialNumber = 'PH012345-2024-001-0001';
      expect(generateVerificationChecksum(serialNumber)).toBe(
        generateVerificationChecksum(serialNumber),
      );
    });
  });
});
