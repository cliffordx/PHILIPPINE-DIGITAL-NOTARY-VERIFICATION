import { buildSerialNumber } from '../src/common/utils/serial-number.util';

describe('buildSerialNumber', () => {
  it('builds deterministic serial numbers', () => {
    expect(
      buildSerialNumber({
        lawyerId: 'lawyer-1',
        registerBook: 'RB2026',
        timestamp: new Date('2026-03-07T08:30:00.000Z'),
        sequence: 7,
      }),
    ).toBe('lawyer-1-RB2026-20260307083000-000007');
  });
});
