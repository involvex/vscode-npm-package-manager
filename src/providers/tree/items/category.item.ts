import type { DependencyType, Project } from "../../../types";
import * as vscode from "vscode";

const CATEGORY_LABELS: Record<DependencyType, string> = {
  dependencies: "Dependencies",
  devDependencies: "Dev Dependencies",
  peerDependencies: "Peer Dependencies",
  optionalDependencies: "Optional Dependencies",
};

const CATEGORY_ICONS: Record<DependencyType, string> = {
  dependencies: "package",
  devDependencies: "tools",
  peerDependencies: "link",
  optionalDependencies: "question",
};

export class CategoryItem extends vscode.TreeItem {
  constructor(
    public readonly category: DependencyType,
    public readonly project: Project,
    public readonly count: number,
  ) {
    super(
      CATEGORY_LABELS[category],
      count > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );

    this.description = `(${count})`;
    this.iconPath = new vscode.ThemeIcon(CATEGORY_ICONS[category]);
    this.contextValue = `category-${category}`;
  }
}
