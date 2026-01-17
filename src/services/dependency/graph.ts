import { BasePackageManager } from "../package-manager/base";
import { DependencyGraph } from "../../types";

export class DependencyGraphService {
  constructor(private packageManager: BasePackageManager) {}

  async generateGraph(): Promise<DependencyGraph> {
    return this.packageManager.getDependencyTree();
  }
}
