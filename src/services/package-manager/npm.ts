import type { InstallOptions, DependencyType } from "../../types";
import { BasePackageManager, type OutdatedPackage } from "./base";
import type { ProcessResult } from "../../utils/process";

export class NpmPackageManager extends BasePackageManager {
  readonly name = "npm" as const;
  readonly lockfileName = "package-lock.json";

  async install(
    packages: string[],
    options?: InstallOptions,
  ): Promise<ProcessResult> {
    const args = ["install"];

    if (options?.dev) {
      args.push("--save-dev");
    }

    if (options?.exact) {
      args.push("--save-exact");
    }

    args.push(...packages);

    return this.execute("npm", args);
  }

  async uninstall(packages: string[]): Promise<ProcessResult> {
    return this.execute("npm", ["uninstall", ...packages]);
  }

  async update(packages?: string[]): Promise<ProcessResult> {
    const args = ["update"];

    if (packages && packages.length > 0) {
      args.push(...packages);
    }

    return this.execute("npm", args);
  }

  async outdated(): Promise<OutdatedPackage[]> {
    const result = await this.execute("npm", ["outdated", "--json"]);

    if (!result.stdout) {
      return [];
    }

    try {
      const data = JSON.parse(result.stdout) as Record<
        string,
        {
          current: string;
          wanted: string;
          latest: string;
          type: string;
        }
      >;

      return Object.entries(data).map(([name, info]) => ({
        name,
        current: info.current || "unknown",
        wanted: info.wanted || info.current,
        latest: info.latest || info.wanted,
        dependencyType: (info.type || "dependencies") as DependencyType,
      }));
    } catch {
      return [];
    }
  }
}
