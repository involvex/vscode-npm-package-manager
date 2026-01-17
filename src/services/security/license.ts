import { InstalledPackage, Project } from "../../types";
import { RegistryClient } from "../registry";
import * as vscode from "vscode";

export interface LicenseViolation {
  packageName: string;
  license: string;
  violationType: "blocked" | "not-allowed";
}

export class LicenseChecker {
  constructor(private registryClient: RegistryClient) {}

  async checkLicenses(project: Project): Promise<LicenseViolation[]> {
    const config = vscode.workspace.getConfiguration("npmPackageManager");
    const allowedLicenses = config.get<string[]>("allowedLicenses", []);
    const blockedLicenses = config.get<string[]>("blockedLicenses", []);

    if (allowedLicenses.length === 0 && blockedLicenses.length === 0) {
      return [];
    }

    const violations: LicenseViolation[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Checking licenses...",
        cancellable: true,
      },
      async (progress, token) => {
        const total = project.packages.length;
        let processed = 0;

        // Process in chunks to avoid overwhelming the registry/network
        const chunkSize = 5;
        for (let i = 0; i < total; i += chunkSize) {
          if (token.isCancellationRequested) {
            break;
          }

          const chunk = project.packages.slice(i, i + chunkSize);
          await Promise.all(
            chunk.map(async pkg => {
              const violation = await this.checkPackageLicense(
                pkg,
                allowedLicenses,
                blockedLicenses,
              );
              if (violation) {
                violations.push(violation);
              }
            }),
          );

          processed += chunk.length;
          progress.report({
            increment: (chunkSize / total) * 100,
            message: `${processed}/${total}`,
          });
        }
      },
    );

    return violations;
  }

  private async checkPackageLicense(
    pkg: InstalledPackage,
    allowed: string[],
    blocked: string[],
  ): Promise<LicenseViolation | null> {
    try {
      const registryPkg = await this.registryClient.getPackage(pkg.name);
      if (!registryPkg || !registryPkg.license) {
        return null; // Unknown license, skip or maybe flag?
      }

      const license = registryPkg.license;

      if (blocked.includes(license)) {
        return {
          packageName: pkg.name,
          license,
          violationType: "blocked",
        };
      }

      if (allowed.length > 0 && !allowed.includes(license)) {
        return {
          packageName: pkg.name,
          license,
          violationType: "not-allowed",
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
