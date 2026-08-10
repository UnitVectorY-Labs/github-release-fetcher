/**
 * Strips the leading 'v' from a version string if present.
 */
export function stripVersionPrefix(version: string): string {
  return version.replace(/^v/, '');
}
