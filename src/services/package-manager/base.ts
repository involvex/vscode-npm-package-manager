import type {
  InstalledPackage,
  PackageJson,
  InstallOptions,
  DependencyType,
} from "../../types";
import { executeCommand, type ProcessResult } from "../../utils/process";
import type { PackageManagerType } from "../../types";
import { cleanVersion } from "../../utils/version";
import * as path from "path";
import * as fs from "fs";

export interface OutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  dependencyType: DependencyType;
}

export abstract class BasePackageManager {
  abstract readonly name: PackageManagerType;
  abstract readonly lockfileName: string;

  constructor(protected projectPath: string) {}

  abstract install(
    packages: string[],
    options?: InstallOptions,
  ): Promise<ProcessResult>;
  abstract uninstall(packages: string[]): Promise<ProcessResult>;
  abstract update(packages?: string[]): Promise<ProcessResult>;
  abstract outdated(): Promise<OutdatedPackage[]>;

  async list(): Promise<InstalledPackage[]> {
    const packageJsonPath = path.join(this.projectPath, "package.json");
    const content = await fs.promises.readFile(packageJsonPath, "utf-8");
    const packageJson: PackageJson = JSON.parse(content);

    const packages: InstalledPackage[] = [];

    const depTypes: DependencyType[] = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ];

    for (const depType of depTypes) {
      const deps = packageJson[depType];
      if (deps) {
        for (const [name, version] of Object.entries(deps)) {
          packages.push({
            name,
            specifiedVersion: version,
            currentVersion: cleanVersion(version),
            dependencyType: depType,
          });
        }
      }
    }

    return packages;
  }

  protected async execute(
    command: string,
    args: string[],
  ): Promise<ProcessResult> {
    return executeCommand(command, args, this.projectPath);
  }

  protected async updatePackageJson(
    name: string,
    fromType: DependencyType,
    toType: DependencyType,
  ): Promise<void> {
    const packageJsonPath = path.join(this.projectPath, "package.json");
    const content = await fs.promises.readFile(packageJsonPath, "utf-8");
    const packageJson: PackageJson = JSON.parse(content);

    const version = packageJson[fromType]?.[name];
    if (!version) {
      throw new Error(`Package ${name} not found in ${fromType}`);
    }

    delete packageJson[fromType]![name];
    if (Object.keys(packageJson[fromType]!).length === 0) {
      delete packageJson[fromType];
    }

    packageJson[toType] = packageJson[toType] || {};
    packageJson[toType]![name] = version;

    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    );
  }

  async moveDependency(
    name: string,
    fromType: DependencyType,
    toType: DependencyType,
  ): Promise<void> {
    await this.updatePackageJson(name, fromType, toType);
  }
}
