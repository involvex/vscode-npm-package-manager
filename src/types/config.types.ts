import type { VulnerabilitySeverity } from "./package.types";
import type { PackageManagerType } from "./project.types";

export interface ExtensionConfig {
  defaultPackageManager: PackageManagerType | "auto";
  updateCheckInterval: number;
  showUpdateNotifications: boolean;
  autoCheckForUpdates: boolean;
  securityScanInterval: number;
  showSecurityNotifications: boolean;
  severityThreshold: VulnerabilitySeverity;
  showStatusBarItem: boolean;
  treeViewDefaultExpanded: boolean;
  npmRegistryUrl: string;
  offlineMode: boolean;
  cacheTimeout: number;
  allowedLicenses: string[];
  blockedLicenses: string[];
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  defaultPackageManager: "auto",
  updateCheckInterval: 60,
  showUpdateNotifications: true,
  autoCheckForUpdates: true,
  securityScanInterval: 120,
  showSecurityNotifications: true,
  severityThreshold: "moderate",
  showStatusBarItem: true,
  treeViewDefaultExpanded: true,
  npmRegistryUrl: "https://registry.npmjs.org",
  offlineMode: false,
  cacheTimeout: 30,
  allowedLicenses: [],
  blockedLicenses: [],
};
