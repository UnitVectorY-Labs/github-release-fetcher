import {
  expandPattern,
  patternToRegex,
  resolveAsset,
  AssetInfo
} from '../src/asset-resolver';

describe('asset-resolver', () => {
  describe('expandPattern', () => {
    it('replaces {version} placeholder', () => {
      expect(expandPattern('tool-{version}.tar.gz', 'v1.2.3', 'linux', 'amd64')).toBe(
        'tool-1.2.3.tar.gz'
      );
    });

    it('replaces {os} placeholder', () => {
      expect(expandPattern('tool-{os}.tar.gz', 'v1.0.0', 'darwin', 'amd64')).toBe(
        'tool-darwin.tar.gz'
      );
    });

    it('replaces {arch} placeholder', () => {
      expect(expandPattern('tool-{arch}.tar.gz', 'v1.0.0', 'linux', 'arm64')).toBe(
        'tool-arm64.tar.gz'
      );
    });

    it('replaces all placeholders together', () => {
      expect(
        expandPattern('tool-{version}-{os}-{arch}.tar.gz', 'v2.0.0', 'linux', 'amd64')
      ).toBe('tool-2.0.0-linux-amd64.tar.gz');
    });

    it('strips v prefix from version', () => {
      expect(expandPattern('{version}', 'v1.0.0', 'linux', 'amd64')).toBe('1.0.0');
    });

    it('handles version without v prefix', () => {
      expect(expandPattern('{version}', '1.0.0', 'linux', 'amd64')).toBe('1.0.0');
    });

    it('handles pattern with no placeholders', () => {
      expect(expandPattern('fixed-name.zip', 'v1.0.0', 'linux', 'amd64')).toBe(
        'fixed-name.zip'
      );
    });

    it('replaces multiple occurrences of same placeholder', () => {
      expect(expandPattern('{os}-{os}', 'v1.0.0', 'linux', 'amd64')).toBe(
        'linux-linux'
      );
    });
  });

  describe('patternToRegex', () => {
    it('creates exact match regex for literal strings', () => {
      const regex = patternToRegex('exact-name.tar.gz');
      expect(regex.test('exact-name.tar.gz')).toBe(true);
      expect(regex.test('other-name.tar.gz')).toBe(false);
    });

    it('supports * wildcard', () => {
      const regex = patternToRegex('tool-*-linux.tar.gz');
      expect(regex.test('tool-1.0.0-linux.tar.gz')).toBe(true);
      expect(regex.test('tool-anything-linux.tar.gz')).toBe(true);
      expect(regex.test('tool-1.0.0-darwin.tar.gz')).toBe(false);
    });

    it('supports ? wildcard', () => {
      const regex = patternToRegex('tool-v?.tar.gz');
      expect(regex.test('tool-v1.tar.gz')).toBe(true);
      expect(regex.test('tool-v12.tar.gz')).toBe(false);
    });

    it('escapes special regex characters', () => {
      const regex = patternToRegex('tool.name+extra.tar.gz');
      expect(regex.test('tool.name+extra.tar.gz')).toBe(true);
      expect(regex.test('toolXname+extra.tar.gz')).toBe(false);
    });
  });

  describe('resolveAsset', () => {
    const testAssets: AssetInfo[] = [
      { name: 'tool-1.0.0-linux-amd64.tar.gz', url: 'https://example.com/1', id: 1 },
      { name: 'tool-1.0.0-linux-arm64.tar.gz', url: 'https://example.com/2', id: 2 },
      { name: 'tool-1.0.0-darwin-amd64.tar.gz', url: 'https://example.com/3', id: 3 },
      { name: 'tool-1.0.0-darwin-arm64.tar.gz', url: 'https://example.com/4', id: 4 },
      { name: 'tool-1.0.0-windows-amd64.zip', url: 'https://example.com/5', id: 5 },
      { name: 'checksums.txt', url: 'https://example.com/6', id: 6 }
    ];

    it('resolves exact single match', () => {
      const result = resolveAsset(
        testAssets,
        'tool-{version}-{os}-{arch}.tar.gz',
        'v1.0.0',
        'linux',
        'amd64'
      );
      expect(result.name).toBe('tool-1.0.0-linux-amd64.tar.gz');
      expect(result.id).toBe(1);
    });

    it('resolves arm64 variant', () => {
      const result = resolveAsset(
        testAssets,
        'tool-{version}-{os}-{arch}.tar.gz',
        'v1.0.0',
        'darwin',
        'arm64'
      );
      expect(result.name).toBe('tool-1.0.0-darwin-arm64.tar.gz');
    });

    it('resolves windows zip', () => {
      const result = resolveAsset(
        testAssets,
        'tool-{version}-{os}-{arch}.zip',
        'v1.0.0',
        'windows',
        'amd64'
      );
      expect(result.name).toBe('tool-1.0.0-windows-amd64.zip');
    });

    it('throws on no match', () => {
      expect(() =>
        resolveAsset(
          testAssets,
          'tool-{version}-{os}-{arch}.deb',
          'v1.0.0',
          'linux',
          'amd64'
        )
      ).toThrow(/No asset matched pattern/);
    });

    it('throws on multiple matches', () => {
      expect(() =>
        resolveAsset(
          testAssets,
          'tool-{version}-linux-*.tar.gz',
          'v1.0.0',
          'linux',
          'amd64'
        )
      ).toThrow(/Multiple assets matched pattern/);
    });

    it('resolves with wildcard when unambiguous', () => {
      const result = resolveAsset(testAssets, 'checksums.txt', 'v1.0.0', 'linux', 'amd64');
      expect(result.name).toBe('checksums.txt');
    });
  });
});
