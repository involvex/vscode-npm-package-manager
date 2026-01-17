export type DependencyType =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

export type UpdateType = "patch" | "minor" | "major";

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  author?: string | { name: string; email?: string };
  license?: string;
  homepage?: string;
  repository?: { type: string; url: string } | string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  packageManager?: string;
}

export interface InstalledPackage {
  name: string;
  currentVersion: string;
  specifiedVersion: string;
  latestVersion?: string;
  dependencyType: DependencyType;
  updateAvailable?: UpdateType;
  vulnerabilities?: Vulnerability[];
  isDeprecated?: boolean;
  deprecationMessage?: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: VulnerabilitySeverity;
  cvssScore?: number;
  packageName: string;
  affectedVersions: string;
  patchedVersions?: string;
  recommendation?: string;
  url?: string;
}

export type VulnerabilitySeverity = "critical" | "high" | "moderate" | "low";

export interface VersionInfo {
  version: string;
  publishedAt?: Date;
  deprecated?: string;
  dependencies?: Record<string, string>;
}

export interface RegistryPackage {
  name: string;
  description?: string;
  versions: Record<string, VersionInfo>;
  "dist-tags": { latest: string; [tag: string]: string };
  maintainers?: Array<{ name: string; email: string }>;
  time?: Record<string, string>;
  license?: string;
  readme?: string;
  homepage?: string;
  repository?: { type: string; url: string };
  keywords?: string[];
}

export interface SearchResult {
  name: string;
  description?: string;
  version: string;
  keywords?: string[];
  author?: string;
  date?: string;
  links?: {
    npm?: string;
    homepage?: string;
    repository?: string;
  };
}

export interface InstallOptions {
  dev?: boolean;
  exact?: boolean;
  global?: boolean;
}
