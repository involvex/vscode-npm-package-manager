import type { Vulnerability, VulnerabilitySeverity } from "../../types";
import { executeCommand } from "../../utils/process";

export interface SecurityScanResult {
  packageName: string;
  vulnerabilities: Vulnerability[];
}

export interface AuditSummary {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

interface NpmAuditOutput {
  vulnerabilities?: Record<
    string,
    {
      name: string;
      severity: string;
      via: Array<{
        source?: number;
        name?: string;
        title?: string;
        url?: string;
        severity?: string;
        range?: string;
      }>;
      effects: string[];
      range: string;
      fixAvailable?: boolean | { name: string; version: string };
    }
  >;
}

export class SecurityScanner {
  async scan(
    projectPath: string,
    packageManager: "npm" | "yarn" | "pnpm" | "bun",
  ): Promise<SecurityScanResult[]> {
    if (packageManager === "bun") {
      return this.scanWithNpm(projectPath);
    }

    switch (packageManager) {
      case "yarn":
        return this.scanWithYarn(projectPath);
      case "pnpm":
        return this.scanWithPnpm(projectPath);
      default:
        return this.scanWithNpm(projectPath);
    }
  }

  private async scanWithNpm(
    projectPath: string,
  ): Promise<SecurityScanResult[]> {
    try {
      const result = await executeCommand(
        "npm",
        ["audit", "--json"],
        projectPath,
      );

      const output = result.stdout || result.stderr;

      if (!output) {
        return [];
      }

      const data = JSON.parse(output) as NpmAuditOutput;
      return this.parseNpmAuditOutput(data);
    } catch {
      return [];
    }
  }

  private async scanWithYarn(
    projectPath: string,
  ): Promise<SecurityScanResult[]> {
    try {
      const result = await executeCommand(
        "yarn",
        ["audit", "--json"],
        projectPath,
      );

      if (!result.stdout) {
        return [];
      }

      return this.parseYarnAuditOutput(result.stdout);
    } catch {
      return [];
    }
  }

  private async scanWithPnpm(
    projectPath: string,
  ): Promise<SecurityScanResult[]> {
    try {
      const result = await executeCommand(
        "pnpm",
        ["audit", "--json"],
        projectPath,
      );

      if (!result.stdout) {
        return [];
      }

      const data = JSON.parse(result.stdout) as NpmAuditOutput;
      return this.parseNpmAuditOutput(data);
    } catch {
      return [];
    }
  }

  private parseNpmAuditOutput(data: NpmAuditOutput): SecurityScanResult[] {
    const results: SecurityScanResult[] = [];

    if (!data.vulnerabilities) {
      return results;
    }

    for (const [name, vuln] of Object.entries(data.vulnerabilities)) {
      const vulnerabilities: Vulnerability[] = [];

      for (const via of vuln.via) {
        if (typeof via === "object" && via.title) {
          vulnerabilities.push({
            id: via.source?.toString() || `${name}-vuln`,
            title: via.title,
            severity: this.mapSeverity(via.severity || vuln.severity),
            packageName: name,
            affectedVersions: via.range || vuln.range,
            url: via.url,
          });
        }
      }

      if (vulnerabilities.length > 0) {
        results.push({
          packageName: name,
          vulnerabilities,
        });
      }
    }

    return results;
  }

  private parseYarnAuditOutput(output: string): SecurityScanResult[] {
    const results: SecurityScanResult[] = [];
    const lines = output.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        if (data.type === "auditAdvisory") {
          const advisory = data.data.advisory;
          const packageName = advisory.module_name;

          let existingResult = results.find(r => r.packageName === packageName);

          if (!existingResult) {
            existingResult = { packageName, vulnerabilities: [] };
            results.push(existingResult);
          }

          existingResult.vulnerabilities.push({
            id: advisory.id?.toString() || `${packageName}-vuln`,
            title: advisory.title,
            severity: this.mapSeverity(advisory.severity),
            packageName,
            affectedVersions: advisory.vulnerable_versions,
            patchedVersions: advisory.patched_versions,
            url: advisory.url,
          });
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  private mapSeverity(severity?: string): VulnerabilitySeverity {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "critical";
      case "high":
        return "high";
      case "moderate":
      case "medium":
        return "moderate";
      default:
        return "low";
    }
  }

  getSummary(results: SecurityScanResult[]): AuditSummary {
    const summary: AuditSummary = {
      total: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    };

    for (const result of results) {
      for (const vuln of result.vulnerabilities) {
        summary.total++;
        summary[vuln.severity]++;
      }
    }

    return summary;
  }
}
