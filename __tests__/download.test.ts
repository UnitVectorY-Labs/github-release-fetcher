import { getArchiveExtension, sanitizeAssetName } from '../src/download';

describe('download', () => {
  describe('sanitizeAssetName', () => {
    it('returns simple filename unchanged', () => {
      expect(sanitizeAssetName('tool-binary')).toBe('tool-binary');
    });

    it('strips directory traversal', () => {
      expect(sanitizeAssetName('../../etc/passwd')).toBe('passwd');
    });

    it('strips directory components', () => {
      expect(sanitizeAssetName('some/path/tool')).toBe('tool');
    });

    it('throws on empty name', () => {
      expect(() => sanitizeAssetName('')).toThrow(/Invalid asset name/);
    });

    it('throws on dot-only name', () => {
      expect(() => sanitizeAssetName('.')).toThrow(/Invalid asset name/);
      expect(() => sanitizeAssetName('..')).toThrow(/Invalid asset name/);
    });
  });

  describe('getArchiveExtension', () => {
    it('detects .tar.gz', () => {
      expect(getArchiveExtension('tool-1.0.0-linux-amd64.tar.gz')).toBe('.tar.gz');
    });

    it('detects .tgz', () => {
      expect(getArchiveExtension('tool-1.0.0.tgz')).toBe('.tgz');
    });

    it('detects .zip', () => {
      expect(getArchiveExtension('tool-1.0.0-windows.zip')).toBe('.zip');
    });

    it('detects .7z', () => {
      expect(getArchiveExtension('tool.7z')).toBe('.7z');
    });

    it('detects .tar.xz', () => {
      expect(getArchiveExtension('tool.tar.xz')).toBe('.tar.xz');
    });

    it('detects .tar.bz2', () => {
      expect(getArchiveExtension('tool.tar.bz2')).toBe('.tar.bz2');
    });

    it('returns null for non-archive', () => {
      expect(getArchiveExtension('tool-binary')).toBeNull();
    });

    it('returns null for unknown extension', () => {
      expect(getArchiveExtension('tool.exe')).toBeNull();
    });

    it('is case insensitive', () => {
      expect(getArchiveExtension('Tool.TAR.GZ')).toBe('.tar.gz');
      expect(getArchiveExtension('Tool.ZIP')).toBe('.zip');
    });
  });
});
