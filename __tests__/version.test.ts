import { stripVersionPrefix } from '../src/version';

describe('version', () => {
  describe('stripVersionPrefix', () => {
    it('strips leading v', () => {
      expect(stripVersionPrefix('v1.2.3')).toBe('1.2.3');
    });

    it('leaves version without v prefix unchanged', () => {
      expect(stripVersionPrefix('1.2.3')).toBe('1.2.3');
    });

    it('only strips first v', () => {
      expect(stripVersionPrefix('vv1.0.0')).toBe('v1.0.0');
    });

    it('handles empty string', () => {
      expect(stripVersionPrefix('')).toBe('');
    });
  });
});
