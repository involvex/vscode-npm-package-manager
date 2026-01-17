import type { Project } from "../../../types";
import * as vscode from "vscode";

export class ProjectItem extends vscode.TreeItem {
  constructor(public readonly project: Project) {
    super(project.name, vscode.TreeItemCollapsibleState.Expanded);

    this.description = project.packageManager;
    this.tooltip = this.buildTooltip();
    this.iconPath = this.getIcon();
    this.contextValue = "project";
  }

  private buildTooltip(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${this.project.name}**\n\n`);
    md.appendMarkdown(`Path: ${this.project.path}\n\n`);
    md.appendMarkdown(`Package Manager: ${this.project.packageManager}\n\n`);
    md.appendMarkdown(`Packages: ${this.project.packages.length}`);
    return md;
  }

  private getIcon(): vscode.ThemeIcon {
    if (this.project.hasSecurityIssues) {
      return new vscode.ThemeIcon(
        "shield",
        new vscode.ThemeColor("errorForeground"),
      );
    }

    if (this.project.hasUpdates) {
      return new vscode.ThemeIcon(
        "folder",
        new vscode.ThemeColor("charts.yellow"),
      );
    }

    return new vscode.ThemeIcon("folder");
  }
}
