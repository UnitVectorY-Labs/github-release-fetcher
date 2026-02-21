import * as core from '@actions/core';
import * as exec from '@actions/exec';

/**
 * Verifies build attestation for a downloaded asset using GitHub CLI.
 * Requires the `gh` CLI to be available on the runner.
 */
export async function verifyAttestation(
  owner: string,
  repo: string,
  version: string,
  assetPath: string,
  token: string
): Promise<void> {
  core.info(
    `Verifying attestation for ${owner}/${repo}@${version}...`
  );

  const args = [
    'attestation',
    'verify',
    assetPath,
    '--repo',
    `${owner}/${repo}`,
    '--format',
    'json'
  ];

  let stdout = '';
  let stderr = '';

  const exitCode = await exec.exec('gh', args, {
    env: {
      ...process.env,
      GH_TOKEN: token
    },
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
        stderr += data.toString();
      }
    },
    ignoreReturnCode: true
  });

  if (exitCode !== 0) {
    throw new Error(
      `Attestation verification failed (exit code ${exitCode}): ${stderr}`
    );
  }

  // Parse attestation output and verify version matches
  try {
    const attestations = JSON.parse(stdout);

    if (!Array.isArray(attestations) || attestations.length === 0) {
      throw new Error('No attestations found in verification output');
    }

    // Verify the attestation references the expected version
    const versionTag = version.startsWith('v') ? version : `v${version}`;
    const versionNoV = version.replace(/^v/, '');

    let versionFound = false;
    for (const att of attestations) {
      const predicate = att?.verificationResult?.statement?.predicate;
      const buildDefinition = predicate?.buildDefinition;

      if (buildDefinition?.externalParameters?.workflow) {
        const ref: string =
          buildDefinition.externalParameters.workflow.ref ?? '';
        if (ref.includes(versionTag) || ref.includes(versionNoV)) {
          versionFound = true;
          break;
        }
      }

      // Also check resolved dependencies for tag references
      const resolvedDeps = buildDefinition?.resolvedDependencies ?? [];
      for (const dep of resolvedDeps) {
        const annotations = dep?.annotations ?? {};
        if (
          typeof annotations === 'object' &&
          Object.values(annotations).some(
            (v: unknown) =>
              typeof v === 'string' &&
              (v.includes(versionTag) || v.includes(versionNoV))
          )
        ) {
          versionFound = true;
          break;
        }
      }
      if (versionFound) break;
    }

    if (!versionFound) {
      core.warning(
        `Could not confirm attestation references version ${version}. ` +
          'The attestation was verified successfully by gh CLI, but version cross-check was inconclusive.'
      );
    } else {
      core.info(`Attestation verified: version ${version} confirmed.`);
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      core.warning(
        'Could not parse attestation output as JSON. ' +
          'The attestation was verified successfully by gh CLI.'
      );
    } else {
      throw e;
    }
  }

  core.info('Attestation verification passed.');
}
