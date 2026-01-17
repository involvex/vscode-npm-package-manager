import type {
  InstallOptions,
  DependencyGraph,
  DependencyNode,
} from "../../types";
import { BasePackageManager, type OutdatedPackage } from "./base";
import type { ProcessResult } from "../../utils/process";

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

  async getDependencyTree(): Promise<DependencyGraph> {
    const result = await this.execute("bun", ["pm", "ls", "--all"]);

    if (result.exitCode !== 0) {
      // If it fails, return empty graph or throw.
      // Might be better to return a root with error?
      // But abstract expects a promise of graph.
      // For now, throw or return basic.
      // throw new Error("Failed to list dependencies: " + result.stderr);
      return { name: "root", version: "0.0.0", dependencies: [] };
    }

    return this.parseDependencyTree(result.stdout);
  }

  async auditFix(): Promise<ProcessResult> {
    throw new Error(
      "Bun does not support 'audit fix'. Please use 'bun pm trust' or update packages manually.",
    );
  }

  private parseDependencyTree(output: string): DependencyGraph {
    const lines = output.split("\n");
    if (lines.length === 0) {
      return { name: "unknown", version: "0.0.0", dependencies: [] };
    }

    // First line is usually the project path and name
    // e.g. D:\repos\test\vscode-npm-package-manager node_modules
    // or just the path
    const rootLine = lines[0];
    const rootName = rootLine.split(" ").pop() || "root"; // simplified

    const root: DependencyGraph = {
      name: rootName,
      version: "0.0.0",
      dependencies: [],
    };

    const stack: { node: DependencyNode; depth: number }[] = [];
    const rootNodes: DependencyNode[] = [];

    // Skip first line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        continue;
      }

      // Calculate depth
      // ├──  (4 chars)
      // │   └── (8 chars)
      // Depth 0: starts with ├── or └──
      // Depth 1: starts with │   ├── or │   └──
      // Each level adds 4 chars?

      // Let's count leading characters that are structure.
      // The dependency name starts after the last space of the prefix structure.
      // Actually, regex might be better.
      // Prefix is usually (?:│   )* (?:├──|└──)

      const match = line.match(/^((?:│   |    )*)(├──|└──) (.+)$/);
      if (!match) {
        continue;
      }

      const prefix = match[1];
      // const symbol = match[2];
      const content = match[3];

      const depth = prefix.length / 4;

      // Parse content: name@version
      // e.g. @eslint/js@9.39.2
      // or name@version (deduped)?

      const lastAt = content.lastIndexOf("@");
      let name = content;
      let version = "";

      if (lastAt > 0) {
        name = content.substring(0, lastAt);
        version = content.substring(lastAt + 1);
      }

      const node: DependencyNode = {
        name,
        version,
        dependencies: [],
      };

      // Adjust stack
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      if (stack.length === 0) {
        rootNodes.push(node);
      } else {
        const parent = stack[stack.length - 1].node;
        if (!parent.dependencies) {
          parent.dependencies = [];
        }
        parent.dependencies.push(node);
      }

      stack.push({ node, depth });
    }

    root.dependencies = rootNodes;
    return root;
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
