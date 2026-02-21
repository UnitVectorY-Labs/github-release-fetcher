import * as os from 'os';

const OS_MAP: Record<string, string> = {
  linux: 'linux',
  darwin: 'darwin',
  win32: 'windows'
};

const ARCH_MAP: Record<string, string> = {
  x64: 'amd64',
  arm64: 'arm64',
  arm: 'arm',
  ia32: '386',
  s390x: 's390x',
  ppc64: 'ppc64le'
};

export function detectOS(): string {
  const platform = os.platform();
  return OS_MAP[platform] ?? platform;
}

export function detectArch(): string {
  const arch = os.arch();
  return ARCH_MAP[arch] ?? arch;
}

export function resolveOS(override: string): string {
  return override !== '' ? override : detectOS();
}

export function resolveArch(override: string): string {
  return override !== '' ? override : detectArch();
}
