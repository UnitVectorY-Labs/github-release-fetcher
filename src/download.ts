import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Downloads a release asset and optionally extracts it.
 * Returns the path to the downloaded/extracted asset.
 */
export async function downloadAndExtract(
  downloadUrl: string,
  assetName: string,
  token: string
): Promise<string> {
  const auth = token ? `token ${token}` : undefined;
  const headers: Record<string, string> = {
    Accept: 'application/octet-stream'
  };

  core.info(`Downloading asset: ${assetName}`);
  const downloadedPath = await tc.downloadTool(downloadUrl, undefined, auth, headers);

  const ext = getArchiveExtension(assetName);

  if (ext) {
    core.info(`Extracting archive (${ext}): ${assetName}`);
    let extractedDir: string;

    switch (ext) {
      case '.tar.gz':
      case '.tgz':
        extractedDir = await tc.extractTar(downloadedPath);
        break;
      case '.zip':
        extractedDir = await tc.extractZip(downloadedPath);
        break;
      case '.7z':
        extractedDir = await tc.extract7z(downloadedPath);
        break;
      default:
        extractedDir = await tc.extractTar(downloadedPath);
        break;
    }

    // Make all files in extracted directory executable on Unix
    if (os.platform() !== 'win32') {
      makeExecutable(extractedDir);
    }

    core.info(`Extracted to: ${extractedDir}`);
    return extractedDir;
  }

  // Not an archive - just a raw binary
  // Sanitize asset name to prevent path traversal
  const sanitizedName = sanitizeAssetName(assetName);

  // Move to a directory with a clean name
  const destDir = path.join(
    os.tmpdir(),
    'github-release-fetcher',
    Date.now().toString()
  );
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, sanitizedName);
  fs.copyFileSync(downloadedPath, destPath);

  // Make executable on Unix
  if (os.platform() !== 'win32') {
    fs.chmodSync(destPath, 0o755);
  }

  core.info(`Downloaded to: ${destPath}`);
  return destPath;
}

/**
 * Sanitize an asset name to prevent path traversal.
 * Extracts only the base filename and rejects dangerous patterns.
 */
export function sanitizeAssetName(name: string): string {
  // Use only the basename to strip any directory components
  const base = path.basename(name);
  if (!base || base === '.' || base === '..') {
    throw new Error(`Invalid asset name: '${name}'`);
  }
  return base;
}

/**
 * Detect archive extension from the asset name.
 */
export function getArchiveExtension(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.tar.gz')) return '.tar.gz';
  if (lower.endsWith('.tgz')) return '.tgz';
  if (lower.endsWith('.zip')) return '.zip';
  if (lower.endsWith('.7z')) return '.7z';
  if (lower.endsWith('.tar.xz')) return '.tar.xz';
  if (lower.endsWith('.tar.bz2')) return '.tar.bz2';
  return null;
}

/**
 * Recursively make files executable in a directory.
 * Only targets files that appear to be binaries (no common text/config extensions).
 */
function makeExecutable(dir: string): void {
  const nonExecutableExts = new Set([
    '.txt', '.md', '.json', '.yaml', '.yml', '.toml',
    '.cfg', '.conf', '.ini', '.xml', '.html', '.css',
    '.csv', '.log', '.rst', '.adoc'
  ]);

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      makeExecutable(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!nonExecutableExts.has(ext)) {
        try {
          fs.chmodSync(fullPath, 0o755);
        } catch {
          // Ignore chmod errors
        }
      }
    }
  }
}
