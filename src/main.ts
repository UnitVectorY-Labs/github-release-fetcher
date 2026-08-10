import * as core from '@actions/core';
import * as github from '@actions/github';
import { resolveOS, resolveArch } from './platform';
import { resolveAsset, AssetInfo } from './asset-resolver';
import { downloadAndExtract } from './download';
import { verifyAttestation } from './attestation';

async function run(): Promise<void> {
  try {
    // Read inputs
    const owner = core.getInput('owner', { required: true });
    const repo = core.getInput('repo', { required: true });
    const version = core.getInput('version', { required: true });
    const assetPattern = core.getInput('asset_pattern', { required: true });
    const osOverride = core.getInput('os');
    const archOverride = core.getInput('arch');
    const verifyAttestationInput =
      core.getInput('verify_attestation').toLowerCase() === 'true';
    const token = core.getInput('token');

    // Resolve platform
    const osName = resolveOS(osOverride);
    const arch = resolveArch(archOverride);
    core.info(`Platform: os=${osName}, arch=${arch}`);

    // Get the release
    const octokit = github.getOctokit(token);
    core.info(`Fetching release ${version} from ${owner}/${repo}...`);

    const { data: release } = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag: version
    });

    const resolvedVersion = release.tag_name;
    core.info(`Resolved version: ${resolvedVersion}`);

    // Map release assets to AssetInfo
    const assets: AssetInfo[] = release.assets.map(
      (a: { name: string; url: string; id: number }) => ({
        name: a.name,
        url: a.url,
        id: a.id
      })
    );

    core.info(`Found ${assets.length} release assets`);

    // Resolve asset from pattern
    const asset = resolveAsset(assets, assetPattern, resolvedVersion, osName, arch);
    core.info(`Matched asset: ${asset.name}`);

    // Download the asset
    const assetPath = await downloadAndExtract(asset.url, asset.name, token);

    // Verify attestation if requested
    if (verifyAttestationInput) {
      await verifyAttestation(owner, repo, resolvedVersion, assetPath, token);
    }

    // Set outputs
    core.setOutput('asset_path', assetPath);
    core.setOutput('asset_name', asset.name);
    core.setOutput('version_resolved', resolvedVersion);

    core.info('Done!');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
