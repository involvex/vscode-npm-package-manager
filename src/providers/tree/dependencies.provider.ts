import type { DependencyType, Project, InstalledPackage } from "../../types";
import { PackageItem, CategoryItem, ProjectItem } from "./items";
import * as vscode from "vscode";

type TreeItem = PackageItem | CategoryItem | ProjectItem;

export class DependenciesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
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
      return this.getRootItems();
    }

    if (element instanceof ProjectItem) {
      return this.getCategoryItems(element.project);
    }

    if (element instanceof CategoryItem) {
      return this.getPackageItems(element.project, element.category);
    }

    return [];
  }

  private getRootItems(): TreeItem[] {
    if (this.activeProject) {
      return this.getCategoryItems(this.activeProject);
    }

    const projectList = Array.from(this.projects.values());

    if (projectList.length === 0) {
      return [];
    }

    if (projectList.length === 1) {
      return this.getCategoryItems(projectList[0]);
    }

    return projectList.map(project => new ProjectItem(project));
  }

  private getCategoryItems(project: Project): CategoryItem[] {
    const categories: DependencyType[] = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ];

    return categories
      .map(category => {
        const count = project.packages.filter(
          pkg => pkg.dependencyType === category,
        ).length;
        return new CategoryItem(category, project, count);
      })
      .filter(item => item.count > 0);
  }

  private getPackageItems(
    project: Project,
    category: DependencyType,
  ): PackageItem[] {
    return project.packages
      .filter(pkg => pkg.dependencyType === category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(pkg => new PackageItem(pkg, project));
  }

  getPackage(
    projectId: string,
    packageName: string,
  ): InstalledPackage | undefined {
    const project = this.projects.get(projectId);
    return project?.packages.find(pkg => pkg.name === packageName);
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }
}
