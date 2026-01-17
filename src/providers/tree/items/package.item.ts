import type { InstalledPackage, Project } from "../../../types";
import * as vscode from "vscode";

export class PackageItem extends vscode.TreeItem {
  constructor(
    public readonly pkg: InstalledPackage,
    public readonly project: Project,
  ) {
    super(pkg.name, vscode.TreeItemCollapsibleState.None);

    this.description = pkg.currentVersion;
    this.tooltip = this.buildTooltip();
    this.iconPath = this.getIcon();
    this.contextValue = this.getContextValue();
  }

  private buildTooltip(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${this.pkg.name}**\n\n`);
    md.appendMarkdown(`Version: ${this.pkg.currentVersion}\n\n`);
    md.appendMarkdown(`Type: ${this.pkg.dependencyType}\n\n`);

    if (this.pkg.latestVersion && this.pkg.updateAvailable) {
      md.appendMarkdown(`Latest: ${this.pkg.latestVersion}\n\n`);
      md.appendMarkdown(`Update available: ${this.pkg.updateAvailable}\n\n`);
    }

    if (this.pkg.vulnerabilities && this.pkg.vulnerabilities.length > 0) {
      md.appendMarkdown(
        `\n\n**Vulnerabilities:** ${this.pkg.vulnerabilities.length}`,
      );
    }

    return md;
  }

  private getIcon(): vscode.ThemeIcon {
    if (this.pkg.vulnerabilities && this.pkg.vulnerabilities.length > 0) {
      return new vscode.ThemeIcon(
        "warning",
        new vscode.ThemeColor("errorForeground"),
      );
    }

    if (this.pkg.updateAvailable === "major") {
      return new vscode.ThemeIcon(
        "arrow-up",
        new vscode.ThemeColor("charts.yellow"),
      );
    }

    if (this.pkg.updateAvailable) {
      return new vscode.ThemeIcon(
        "arrow-up",
        new vscode.ThemeColor("charts.green"),
      );
    }

    return new vscode.ThemeIcon("package");
  }

  private getContextValue(): string {
    const parts = ["package"];

    if (this.pkg.updateAvailable) {
      parts.push("updatable");
    }

    if (this.pkg.vulnerabilities && this.pkg.vulnerabilities.length > 0) {
      parts.push("vulnerable");
    }

    if (this.pkg.dependencyType === "dependencies") {
      parts.push("prod");
    }

    if (this.pkg.dependencyType === "devDependencies") {
      parts.push("dev");
    }

    return parts.join("-");
  }
}
