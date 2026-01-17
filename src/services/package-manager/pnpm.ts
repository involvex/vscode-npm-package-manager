import type {
  InstallOptions,
  DependencyType,
  DependencyGraph,
  DependencyNode,
} from "../../types";
import { BasePackageManager, type OutdatedPackage } from "./base";
import type { ProcessResult } from "../../utils/process";

export class PnpmPackageManager extends BasePackageManager {
  readonly name = "pnpm" as const;
  readonly lockfileName = "pnpm-lock.yaml";

  async install(
    packages: string[],
    options?: InstallOptions,
  ): Promise<ProcessResult> {
    const args = ["add"];

    if (options?.dev) {
      args.push("--save-dev");
    }

    if (options?.exact) {
      args.push("--save-exact");
    }

    args.push(...packages);

    return this.execute("pnpm", args);
  }

  async uninstall(packages: string[]): Promise<ProcessResult> {
    return this.execute("pnpm", ["remove", ...packages]);
  }

  async update(packages?: string[]): Promise<ProcessResult> {
    const args = ["update"];

    if (packages && packages.length > 0) {
      args.push(...packages);
    }

    return this.execute("pnpm", args);
  }

  async outdated(): Promise<OutdatedPackage[]> {
    const result = await this.execute("pnpm", ["outdated", "--json"]);

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
          dependencyType: string;
        }
      >;

      return Object.entries(data).map(([name, info]) => ({
        name,
        current: info.current || "unknown",
        wanted: info.wanted || info.current,
        latest: info.latest || info.wanted,
        dependencyType: (info.dependencyType ||
          "dependencies") as DependencyType,
      }));
    } catch {
      return [];
    }
  }

  async getDependencyTree(): Promise<DependencyGraph> {
    try {
      const result = await this.execute("pnpm", [
        "list",
        "--depth",
        "Infinity",
        "--json",
      ]);

      if (!result.stdout) {
        return { name: "root", version: "0.0.0", dependencies: [] };
      }

      const data = JSON.parse(result.stdout);
      // pnpm returns array of projects
      const project = Array.isArray(data) ? data[0] : data;

      return this.convertPnpmTree(project);
    } catch (e) {
      return { name: "root", version: "0.0.0", dependencies: [] };
    }
  }

  async auditFix(): Promise<ProcessResult> {
    return this.execute("pnpm", ["audit", "--fix"]);
  }

  private convertPnpmTree(data: any): DependencyGraph {
    return {
      name: data.name || "root",
      version: data.version || "0.0.0",
      dependencies: data.dependencies
        ? Object.entries(data.dependencies).map(([name, info]: [string, any]) =>
            this.convertPnpmNode(name, info),
          )
        : [],
    };
  }

  private convertPnpmNode(name: string, info: any): DependencyNode {
    return {
      name,
      version: info.version || "unknown",
      dependencies: info.dependencies
        ? Object.entries(info.dependencies).map(([n, i]: [string, any]) =>
            this.convertPnpmNode(n, i),
          )
        : [],
    };
  }
}
