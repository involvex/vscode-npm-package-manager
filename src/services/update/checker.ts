import type { InstalledPackage, UpdateType } from "../../types";
import { getUpdateType } from "../../utils/version";
import { RegistryClient } from "../registry";

export class UpdateChecker {
  constructor(private registryClient: RegistryClient) {}

  async checkUpdates(
    packages: InstalledPackage[],
  ): Promise<InstalledPackage[]> {
    const results = await Promise.all(
      packages.map(async pkg => {
        try {
          const registryPkg = await this.registryClient.getPackage(pkg.name);

          if (!registryPkg) {
            return pkg;
          }

          const latestVersion = registryPkg["dist-tags"]?.latest;

          if (!latestVersion) {
            return pkg;
          }

          const updateType = getUpdateType(pkg.currentVersion, latestVersion);

          // Check if the current version is deprecated
          const currentVersionInfo = registryPkg.versions[pkg.currentVersion];
          const latestVersionInfo = registryPkg.versions[latestVersion];

          const isDeprecated = !!(
            currentVersionInfo?.deprecated || latestVersionInfo?.deprecated
          );
          const deprecationMessage = (currentVersionInfo?.deprecated ||
            latestVersionInfo?.deprecated) as string | undefined;

          return {
            ...pkg,
            latestVersion,
            updateAvailable: updateType,
            isDeprecated,
            deprecationMessage,
          };
        } catch {
          return pkg;
        }
      }),
    );

    return results;
  }

  async checkSinglePackage(pkg: InstalledPackage): Promise<InstalledPackage> {
    try {
      const registryPkg = await this.registryClient.getPackage(pkg.name);

      if (!registryPkg) {
        return pkg;
      }

      const latestVersion = registryPkg["dist-tags"]?.latest;

      if (!latestVersion) {
        return pkg;
      }

      const updateType = getUpdateType(pkg.currentVersion, latestVersion);
      const latestInfo = registryPkg.versions?.[latestVersion];

      return {
        ...pkg,
        latestVersion,
        updateAvailable: updateType,
        isDeprecated: !!latestInfo?.deprecated,
        deprecationMessage: latestInfo?.deprecated as string | undefined,
      };
    } catch {
      return pkg;
    }
  }

  getUpdateSummary(packages: InstalledPackage[]): UpdateSummary {
    const summary: UpdateSummary = {
      total: packages.length,
      upToDate: 0,
      patch: 0,
      minor: 0,
      major: 0,
    };

    for (const pkg of packages) {
      if (!pkg.updateAvailable) {
        summary.upToDate++;
      } else {
        summary[pkg.updateAvailable]++;
      }
    }

    return summary;
  }
}

export interface UpdateSummary {
  total: number;
  upToDate: number;
  patch: number;
  minor: number;
  major: number;
}
