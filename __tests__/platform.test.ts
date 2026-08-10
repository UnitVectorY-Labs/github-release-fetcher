import { detectOS, detectArch, resolveOS, resolveArch } from '../src/platform';
import * as os from 'os';

// Mock os module
jest.mock('os');
const mockOS = os as jest.Mocked<typeof os>;

describe('platform', () => {
  describe('detectOS', () => {
    it('maps linux platform', () => {
      mockOS.platform.mockReturnValue('linux');
      expect(detectOS()).toBe('linux');
    });

    it('maps darwin platform', () => {
      mockOS.platform.mockReturnValue('darwin');
      expect(detectOS()).toBe('darwin');
    });

    it('maps win32 to windows', () => {
      mockOS.platform.mockReturnValue('win32');
      expect(detectOS()).toBe('windows');
    });

    it('returns raw platform for unknown values', () => {
      mockOS.platform.mockReturnValue('freebsd');
      expect(detectOS()).toBe('freebsd');
    });
  });

  describe('detectArch', () => {
    it('maps x64 to amd64', () => {
      mockOS.arch.mockReturnValue('x64');
      expect(detectArch()).toBe('amd64');
    });

    it('maps arm64', () => {
      mockOS.arch.mockReturnValue('arm64');
      expect(detectArch()).toBe('arm64');
    });

    it('maps ia32 to 386', () => {
      mockOS.arch.mockReturnValue('ia32');
      expect(detectArch()).toBe('386');
    });

    it('returns raw arch for unknown values', () => {
      mockOS.arch.mockReturnValue('mips');
      expect(detectArch()).toBe('mips');
    });
  });

  describe('resolveOS', () => {
    it('uses override when provided', () => {
      expect(resolveOS('custom-os')).toBe('custom-os');
    });

    it('falls back to detection when override is empty', () => {
      mockOS.platform.mockReturnValue('linux');
      expect(resolveOS('')).toBe('linux');
    });
  });

  describe('resolveArch', () => {
    it('uses override when provided', () => {
      expect(resolveArch('custom-arch')).toBe('custom-arch');
    });

    it('falls back to detection when override is empty', () => {
      mockOS.arch.mockReturnValue('x64');
      expect(resolveArch('')).toBe('amd64');
    });
  });
});
