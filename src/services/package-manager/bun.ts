import { BasePackageManager, type OutdatedPackage } from "./base";
import type { ProcessResult } from "../../utils/process";
import type { InstallOptions } from "../../types";

export class BunPackageManager extends BasePackageManager {
  readonly name = "bun" as const;
  readonly lockfileName = "bun.lockb";

  async install(
    packages: string[],
    options?: InstallOptions,
  ): Promise<ProcessResult> {
    const args = ["add"];

    if (options?.dev) {
      args.push("-d");
    }

    if (options?.exact) {
      args.push("--exact");
    }

    args.push(...packages);

    return this.execute("bun", args);
  }

  async uninstall(packages: string[]): Promise<ProcessResult> {
    return this.execute("bun", ["remove", ...packages]);
  }

  async update(packages?: string[]): Promise<ProcessResult> {
    const args = ["update"];

    if (packages && packages.length > 0) {
      args.push(...packages);
    }

    return this.execute("bun", args);
  }

  async outdated(): Promise<OutdatedPackage[]> {
    const result = await this.execute("bun", ["outdated"]);

    if (result.exitCode !== 0 && !result.stdout) {
      return [];
    }

    return this.parseOutdatedOutput(result.stdout);
  }

  private parseOutdatedOutput(output: string): OutdatedPackage[] {
    const packages: OutdatedPackage[] = [];
    const lines = output.split("\n").filter(line => line.trim());

    for (const line of lines) {
      if (
        line.includes("Package") ||
        line.includes("─") ||
        line.includes("All packages")
      ) {
        continue;
      }

      const parts = line.split(/\s+/).filter(Boolean);
      if (parts.length >= 3) {
        const name = parts[0];
        const current = parts[1];
        const latest = parts[parts.length - 1];

        if (name && current && latest && !name.startsWith("─")) {
          packages.push({
            name,
            current,
            wanted: latest,
            latest,
            dependencyType: "dependencies",
          });
        }
      }
    }

    return packages;
  }
}
