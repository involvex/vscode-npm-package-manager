import type {
  InstallOptions,
  DependencyType,
  DependencyGraph,
  DependencyNode,
} from "../../types";
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

  async getDependencyTree(): Promise<DependencyGraph> {
    try {
      // npm ls can fail if there are unmet peer deps, but still outputs JSON
      const result = await this.execute("npm", ["ls", "--all", "--json"]);

      if (!result.stdout) {
        return { name: "root", version: "0.0.0", dependencies: [] };
      }

      const data = JSON.parse(result.stdout);
      return this.convertNpmTree(data);
    } catch (e) {
      return { name: "root", version: "0.0.0", dependencies: [] };
    }
  }

  private convertNpmTree(data: any): DependencyGraph {
    return {
      name: data.name || "root",
      version: data.version || "0.0.0",
      dependencies: data.dependencies
        ? Object.entries(data.dependencies).map(([name, info]: [string, any]) =>
            this.convertNpmNode(name, info),
          )
        : [],
    };
  }

  private convertNpmNode(name: string, info: any): DependencyNode {
    return {
      name,
      version: info.version || "unknown",
      dependencies: info.dependencies
        ? Object.entries(info.dependencies).map(([n, i]: [string, any]) =>
            this.convertNpmNode(n, i),
          )
        : [],
    };
  }
}
