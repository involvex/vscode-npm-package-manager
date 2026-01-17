import type {
  InstallOptions,
  DependencyType,
  DependencyGraph,
  DependencyNode,
} from "../../types";
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

  async getDependencyTree(): Promise<DependencyGraph> {
    try {
      const result = await this.execute("yarn", ["list", "--json"]);

      if (!result.stdout) {
        return { name: "root", version: "0.0.0", dependencies: [] };
      }

      // Yarn outputs multiple JSON lines. the tree is usually the last one?

      // Or one of them has type: 'tree'.

      const lines = result.stdout.split("\n").filter(Boolean);

      let treeData: any = null;

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.type === "tree") {
            treeData = data;

            break;
          }
        } catch {}
      }

      if (!treeData) {
        return { name: "root", version: "0.0.0", dependencies: [] };
      }

      return this.convertYarnTree(treeData);
    } catch (e) {
      return { name: "root", version: "0.0.0", dependencies: [] };
    }
  }

  async auditFix(): Promise<ProcessResult> {
    // Yarn 1 supports audit fix. Yarn 2+ does not directly via 'audit fix' same way.

    // Assuming Yarn 1 for typical lockfile usage or basic support.

    return this.execute("yarn", ["audit", "fix"]);
  }

  private convertYarnTree(data: any): DependencyGraph {
    return {
      name: "root",
      version: "0.0.0",
      dependencies:
        data.data && data.data.trees
          ? data.data.trees.map((node: any) => this.convertYarnNode(node))
          : [],
    };
  }

  private convertYarnNode(node: any): DependencyNode {
    // Yarn name is "package@version"
    const nameParts = node.name.lastIndexOf("@");
    let name = node.name;
    let version = "";
    if (nameParts > 0) {
      name = node.name.substring(0, nameParts);
      version = node.name.substring(nameParts + 1);
    }

    return {
      name,
      version,
      dependencies: node.children
        ? node.children.map((child: any) => this.convertYarnNode(child))
        : [],
    };
  }
}
