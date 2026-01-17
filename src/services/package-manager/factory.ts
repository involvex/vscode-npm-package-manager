import type { PackageManagerType } from "../../types";
import { YarnPackageManager } from "./yarn";
import { PnpmPackageManager } from "./pnpm";
import { BasePackageManager } from "./base";
import { NpmPackageManager } from "./npm";
import { BunPackageManager } from "./bun";

export function createPackageManager(
  type: PackageManagerType,
  projectPath: string,
): BasePackageManager {
  switch (type) {
    case "bun":
      return new BunPackageManager(projectPath);
    case "yarn":
      return new YarnPackageManager(projectPath);
    case "pnpm":
      return new PnpmPackageManager(projectPath);
    case "npm":
    default:
      return new NpmPackageManager(projectPath);
  }
}
