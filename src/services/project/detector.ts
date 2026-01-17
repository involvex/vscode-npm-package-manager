import type { PackageManagerType, Project } from "../../types";
import type { PackageJson } from "../../types";
import { createHash } from "crypto";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class ProjectDetector {
  async detectProjects(): Promise<Project[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }

    const projects: Project[] = [];

    for (const folder of workspaceFolders) {
      const packageJsonFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, "**/package.json"),
        "**/node_modules/**",
      );

      for (const uri of packageJsonFiles) {
        const project = await this.createProject(uri.fsPath);
        if (project) {
          projects.push(project);
        }
      }
    }

    return projects;
  }

  async createProject(packageJsonPath: string): Promise<Project | null> {
    try {
      const content = await fs.promises.readFile(packageJsonPath, "utf-8");
      const packageJson: PackageJson = JSON.parse(content);
      const projectPath = path.dirname(packageJsonPath);

      const packageManager = this.detectPackageManager(
        projectPath,
        packageJson,
      );
      const lockfilePath = this.findLockfile(projectPath, packageManager);

      return {
        id: this.generateProjectId(projectPath),
        name: packageJson.name || path.basename(projectPath),
        path: projectPath,
        packageJsonPath,
        packageManager,
        lockfilePath,
        packages: [],
        lastUpdated: new Date(),
        hasSecurityIssues: false,
        hasUpdates: false,
      };
    } catch {
      return null;
    }
  }

  detectPackageManager(
    projectPath: string,
    packageJson?: PackageJson,
  ): PackageManagerType {
    if (packageJson?.packageManager) {
      if (packageJson.packageManager.startsWith("bun")) {
        return "bun";
      }
      if (packageJson.packageManager.startsWith("pnpm")) {
        return "pnpm";
      }
      if (packageJson.packageManager.startsWith("yarn")) {
        return "yarn";
      }
      if (packageJson.packageManager.startsWith("npm")) {
        return "npm";
      }
    }

    if (fs.existsSync(path.join(projectPath, "bun.lockb"))) {
      return "bun";
    }
    if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (fs.existsSync(path.join(projectPath, "yarn.lock"))) {
      return "yarn";
    }
    if (fs.existsSync(path.join(projectPath, "package-lock.json"))) {
      return "npm";
    }

    const config = vscode.workspace.getConfiguration("npmPackageManager");
    const defaultPM = config.get<string>("defaultPackageManager", "auto");

    if (defaultPM !== "auto") {
      return defaultPM as PackageManagerType;
    }

    return "npm";
  }

  private findLockfile(
    projectPath: string,
    packageManager: PackageManagerType,
  ): string | undefined {
    const lockfiles: Record<PackageManagerType, string> = {
      bun: "bun.lockb",
      pnpm: "pnpm-lock.yaml",
      yarn: "yarn.lock",
      npm: "package-lock.json",
    };

    const lockfile = lockfiles[packageManager];
    const lockfilePath = path.join(projectPath, lockfile);

    return fs.existsSync(lockfilePath) ? lockfilePath : undefined;
  }

  private generateProjectId(projectPath: string): string {
    return createHash("md5").update(projectPath).digest("hex").slice(0, 8);
  }
}
