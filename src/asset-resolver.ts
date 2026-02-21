import { stripVersionPrefix } from './version';

/**
 * Resolves a user-provided pattern with placeholders into a concrete asset name,
 * then matches exactly one asset from the release.
 */

export interface AssetInfo {
  name: string;
  url: string;
  id: number;
}

/**
 * Replaces placeholders in the pattern with actual values.
 * Supported placeholders: {version}, {os}, {arch}
 */
export function expandPattern(
  pattern: string,
  version: string,
  osName: string,
  arch: string
): string {
  const versionNoV = stripVersionPrefix(version);

  return pattern
    .replace(/\{version\}/g, versionNoV)
    .replace(/\{os\}/g, osName)
    .replace(/\{arch\}/g, arch);
}

/**
 * Converts a simplified glob pattern to a RegExp.
 * Supports * (any chars) and ? (single char).
 */
export function patternToRegex(expanded: string): RegExp {
  const escaped = expanded.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const withWildcards = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${withWildcards}$`);
}

/**
 * Finds exactly one matching asset from the release assets.
 * Returns the matching asset, or throws if zero or multiple matches found.
 */
export function resolveAsset(
  assets: AssetInfo[],
  pattern: string,
  version: string,
  osName: string,
  arch: string
): AssetInfo {
  const expanded = expandPattern(pattern, version, osName, arch);
  const regex = patternToRegex(expanded);

  const matches = assets.filter(a => regex.test(a.name));

  if (matches.length === 0) {
    const assetNames = assets.map(a => a.name).join(', ');
    throw new Error(
      `No asset matched pattern '${expanded}' (from '${pattern}'). Available assets: ${assetNames}`
    );
  }

  if (matches.length > 1) {
    const matchNames = matches.map(a => a.name).join(', ');
    throw new Error(
      `Multiple assets matched pattern '${expanded}': ${matchNames}. Pattern must resolve to exactly one asset.`
    );
  }

  return matches[0];
}
