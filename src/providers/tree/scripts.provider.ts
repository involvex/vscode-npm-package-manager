import { Project, PackageJson } from "../../types";
import { ScriptItem, ProjectItem } from "./items";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

type TreeItem = ScriptItem | ProjectItem;

export class ScriptsTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined | null
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private projects: Map<string, Project> = new Map();
  private activeProject: Project | undefined;

  refresh(item?: TreeItem): void {
    this._onDidChangeTreeData.fire(item);
  }

  setActiveProject(project: Project | undefined): void {
    this.activeProject = project;
    this.refresh();
  }

  setProjects(projects: Project[]): void {
    this.projects.clear();
    for (const project of projects) {
      this.projects.set(project.id, project);
    }
    this.refresh();
  }

  updateProject(project: Project): void {
    this.projects.set(project.id, project);
    if (this.activeProject?.id === project.id) {
      this.activeProject = project;
    }
    this.refresh();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      return await this.getRootItems();
    }

    if (element instanceof ProjectItem) {
      return await this.getScriptItems(element.project);
    }

    return [];
  }

  private async getRootItems(): Promise<TreeItem[]> {
    if (this.activeProject) {
      return await this.getScriptItems(this.activeProject);
    }

    const projectList = Array.from(this.projects.values());

    if (projectList.length === 0) {
      return [];
    }

    if (projectList.length === 1) {
      return await this.getScriptItems(projectList[0]);
    }

    return projectList.map(project => new ProjectItem(project));
  }

  private async getScriptItems(project: Project): Promise<ScriptItem[]> {
    try {
      const packageJsonPath = path.join(project.path, "package.json");
      const content = await fs.promises.readFile(packageJsonPath, "utf-8");
      const packageJson: PackageJson = JSON.parse(content);

      if (!packageJson.scripts) {
        return [];
      }

      return Object.entries(packageJson.scripts).map(
        ([name, script]) => new ScriptItem(name, script, project),
      );
    } catch (error) {
      console.error(`Failed to load scripts for ${project.name}:`, error);
      return [];
    }
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }
}
