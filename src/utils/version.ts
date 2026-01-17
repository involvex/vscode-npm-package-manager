import type { UpdateType } from "../types";

export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
} | null {
  const cleaned = version.replace(/^[~^>=<]*/, "");
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?/);

  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (!vA || !vB) {
    return 0;
  }

  if (vA.major !== vB.major) {
    return vA.major - vB.major;
  }
  if (vA.minor !== vB.minor) {
    return vA.minor - vB.minor;
  }
  return vA.patch - vB.patch;
}

export function getUpdateType(
  currentVersion: string,
  latestVersion: string,
): UpdateType | undefined {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);

  if (!current || !latest) {
    return undefined;
  }

  if (compareVersions(currentVersion, latestVersion) >= 0) {
    return undefined;
  }

  if (latest.major > current.major) {
    return "major";
  }
  if (latest.minor > current.minor) {
    return "minor";
  }
  if (latest.patch > current.patch) {
    return "patch";
  }

  return undefined;
}

export function cleanVersion(version: string): string {
  return version.replace(/^[~^>=<]+/, "");
}
