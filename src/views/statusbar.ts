import type { Project } from "../types";
import * as vscode from "vscode";

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private isVisible = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = "npm-pm.refresh";
  }

  update(projects: Project[], activeProject?: Project): void {
    const config = vscode.workspace.getConfiguration("npmPackageManager");
    const showStatusBar = config.get<boolean>("showStatusBarItem", true);

    if (!showStatusBar || projects.length === 0) {
      this.hide();
      return;
    }

    if (activeProject) {
      this.statusBarItem.text = `$(package) ${activeProject.name}`;
      this.statusBarItem.command = "npm-pm.selectProject";
      this.statusBarItem.tooltip = `Active Project: ${activeProject.name}\nPackage Manager: ${activeProject.packageManager}\nClick to switch project`;
    } else {
      // Summary mode (fallback or if no active project selected yet, though usually one is default)
      let totalUpdates = 0;
      let totalVulnerabilities = 0;
      let totalPackages = 0;

      for (const project of projects) {
        totalPackages += project.packages.length;
        totalUpdates += project.packages.filter(p => p.updateAvailable).length;
        totalVulnerabilities += project.packages.filter(
          p => p.vulnerabilities && p.vulnerabilities.length > 0,
        ).length;
      }

      if (totalVulnerabilities > 0) {
        this.statusBarItem.text = `$(shield) ${totalVulnerabilities} vulnerable`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground",
        );
      } else if (totalUpdates > 0) {
        this.statusBarItem.text = `$(package) ${totalUpdates} updates`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.warningBackground",
        );
      } else {
        this.statusBarItem.text = `$(package) ${totalPackages} packages`;
        this.statusBarItem.backgroundColor = undefined;
      }
      this.statusBarItem.command = "npm-pm.selectProject";
      this.statusBarItem.tooltip = "Click to select active project";
    }

    this.show();
  }

  private buildTooltip(
    projects: Project[],
    updates: number,
    vulnerabilities: number,
  ): string {
    const lines: string[] = [];

    if (vulnerabilities > 0) {
      lines.push(`${vulnerabilities} packages with vulnerabilities`);
    }

    if (updates > 0) {
      lines.push(`${updates} packages with updates available`);
    }

    if (projects.length > 1) {
      lines.push(`\nProjects:`);
      for (const project of projects) {
        const projectUpdates = project.packages.filter(
          p => p.updateAvailable,
        ).length;
        lines.push(`  ${project.name}: ${projectUpdates} updates`);
      }
    }

    lines.push("\nClick to refresh");

    return lines.join("\n");
  }

  show(): void {
    if (!this.isVisible) {
      this.statusBarItem.show();
      this.isVisible = true;
    }
  }

  hide(): void {
    if (this.isVisible) {
      this.statusBarItem.hide();
      this.isVisible = false;
    }
  }

  setLoading(): void {
    this.statusBarItem.text = "$(sync~spin) Checking packages...";
    this.statusBarItem.backgroundColor = undefined;
    this.show();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
