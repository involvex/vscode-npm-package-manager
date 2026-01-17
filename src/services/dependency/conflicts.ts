import { DependencyGraph, DependencyNode } from "../../types";
import { BasePackageManager } from "../package-manager/base";

export interface Conflict {
  packageName: string;
  type: "version-mismatch" | "missing" | "invalid" | "peer-mismatch";
  message: string;
  location?: string;
}

export class ConflictDetector {
  constructor(private packageManager: BasePackageManager) {}

  async detectConflicts(): Promise<Conflict[]> {
    const tree = await this.packageManager.getDependencyTree();
    const conflicts: Conflict[] = [];
    const versions = new Map<string, Set<string>>();

    this.traverse(tree, versions, conflicts);

    // Check for version mismatches (multiple versions of same package)
    // This is often normal in npm/yarn/pnpm, but excessive duplication is worth noting.
    // We will only report if there are > 2 versions or if requested.
    // For now, let's focus on 'error' properties in nodes which indicate missing/invalid.

    return conflicts;
  }

  private traverse(
    node: DependencyNode | DependencyGraph,
    versions: Map<string, Set<string>>,
    conflicts: Conflict[],
  ) {
    if ((node as DependencyNode).error) {
      conflicts.push({
        packageName: node.name,
        type: "invalid",
        message: (node as DependencyNode).error!,
        location: node.name,
      });
    }

    // Record version
    if (!versions.has(node.name)) {
      versions.set(node.name, new Set());
    }
    versions.get(node.name)!.add(node.version);

    if (node.dependencies) {
      for (const dep of node.dependencies) {
        this.traverse(dep, versions, conflicts);
      }
    }
  }
}
