import { BasePackageManager } from "../package-manager/base";
import * as path from "path";
import * as fs from "fs";

export class DependencyAnalyzer {
  constructor(
    private packageManager: BasePackageManager,
    private projectPath: string,
  ) {}

  async findUnusedDependencies(): Promise<string[]> {
    const installedPackages = await this.packageManager.list();
    const dependencies = installedPackages
      .filter(p => p.dependencyType === "dependencies")
      .map(p => p.name);

    if (dependencies.length === 0) {
      return [];
    }

    const usedPackages = await this.scanForImports();

    // @types/ packages are usually devDeps, but if in deps, check if base is used.
    // Also ignore specific patterns if needed.

    return dependencies.filter(dep => !usedPackages.has(dep));
  }

  private async scanForImports(): Promise<Set<string>> {
    const used = new Set<string>();

    // Find all source files
    // Using simple recursive search or glob if available
    // Assuming simple recursive for now to avoid external deps if possible,
    // but glob is standard. I'll use a basic recursive walker.

    const files = await this.findSourceFiles(this.projectPath);

    for (const file of files) {
      const content = await fs.promises.readFile(file, "utf-8");
      const imports = this.extractImports(content);
      for (const imp of imports) {
        const pkgName = this.getPackageNameFromImport(imp);
        if (pkgName) {
          used.add(pkgName);
        }
      }
    }

    return used;
  }

  private async findSourceFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === "dist" ||
          entry.name === "build"
        ) {
          continue;
        }
        results.push(...(await this.findSourceFiles(fullPath)));
      } else if (entry.isFile()) {
        if (/\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
    }

    return results;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // Regex for imports
    const patterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /export\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  private getPackageNameFromImport(importPath: string): string | null {
    if (importPath.startsWith(".") || importPath.startsWith("/")) {
      return null;
    }

    if (importPath.startsWith("@")) {
      const parts = importPath.split("/");
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    } else {
      const parts = importPath.split("/");
      if (parts.length >= 1) {
        return parts[0];
      }
    }

    return null;
  }
}
