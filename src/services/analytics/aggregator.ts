import { Project, InstalledPackage, VulnerabilitySeverity } from "../../types";
import { RegistryClient } from "../registry";

export interface DashboardData {
  projectName: string;
  totalPackages: number;
  updateStatus: {
    upToDate: number;
    minor: number;
    major: number;
    patch: number;
  };
  security: {
    totalVulnerabilities: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  deprecation: {
    total: number;
  };
  licenses: Record<string, number>;
}

export class AnalyticsAggregator {
  constructor(private registryClient: RegistryClient) {}

  async aggregate(project: Project): Promise<DashboardData> {
    const data: DashboardData = {
      projectName: project.name,
      totalPackages: project.packages.length,
      updateStatus: { upToDate: 0, minor: 0, major: 0, patch: 0 },
      security: {
        totalVulnerabilities: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
      },
      deprecation: { total: 0 },
      licenses: {},
    };

    for (const pkg of project.packages) {
      // Update Status
      if (!pkg.updateAvailable) {
        data.updateStatus.upToDate++;
      } else {
        data.updateStatus[pkg.updateAvailable]++;
      }

      // Security
      if (pkg.vulnerabilities) {
        data.security.totalVulnerabilities += pkg.vulnerabilities.length;
        pkg.vulnerabilities.forEach(v => {
          if (data.security[v.severity] !== undefined) {
            data.security[v.severity]++;
          }
        });
      }

      // Deprecation
      if (pkg.isDeprecated) {
        data.deprecation.total++;
      }

      // Licenses (Best effort from cache)
      const registryPkg = await this.registryClient.getPackage(pkg.name);
      const license = registryPkg?.license || "Unknown";
      data.licenses[license] = (data.licenses[license] || 0) + 1;
    }

    return data;
  }
}
