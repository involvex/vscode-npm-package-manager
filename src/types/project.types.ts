import type { InstalledPackage } from "./package.types";

export type PackageManagerType = "npm" | "yarn" | "pnpm" | "bun";

export interface Project {
  id: string;
  name: string;
  path: string;
  packageJsonPath: string;
  packageManager: PackageManagerType;
  lockfilePath?: string;
  packages: InstalledPackage[];
  lastUpdated: Date;
  hasSecurityIssues: boolean;
  hasUpdates: boolean;
}

export interface WorkspaceState {
  projects: Map<string, Project>;
  activeProjectId?: string;
  lastSecurityScan?: Date;
  lastUpdateCheck?: Date;
}
