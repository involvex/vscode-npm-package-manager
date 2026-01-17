import type { InstallOptions, DependencyType } from "../../types";
import { BasePackageManager, type OutdatedPackage } from "./base";
import type { ProcessResult } from "../../utils/process";

export class YarnPackageManager extends BasePackageManager {
  readonly name = "yarn" as const;
  readonly lockfileName = "yarn.lock";

  async install(
    packages: string[],
    options?: InstallOptions,
  ): Promise<ProcessResult> {
    const args = ["add"];

    if (options?.dev) {
      args.push("--dev");
    }

    if (options?.exact) {
      args.push("--exact");
    }

    args.push(...packages);

    return this.execute("yarn", args);
  }

  async uninstall(packages: string[]): Promise<ProcessResult> {
    return this.execute("yarn", ["remove", ...packages]);
  }

  async update(packages?: string[]): Promise<ProcessResult> {
    const args = ["upgrade"];

    if (packages && packages.length > 0) {
      args.push(...packages);
    }

    return this.execute("yarn", args);
  }

  async outdated(): Promise<OutdatedPackage[]> {
    const result = await this.execute("yarn", ["outdated", "--json"]);

    if (!result.stdout) {
      return [];
    }

    try {
      const lines = result.stdout.split("\n").filter(Boolean);
      const packages: OutdatedPackage[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === "table" && data.data?.body) {
            for (const row of data.data.body) {
              const [name, current, wanted, latest, , type] = row;
              packages.push({
                name,
                current,
                wanted,
                latest,
                dependencyType: (type || "dependencies") as DependencyType,
              });
            }
          }
        } catch {
          continue;
        }
      }

      return packages;
    } catch {
      return [];
    }
  }
}
