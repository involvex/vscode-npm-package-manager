import { Project } from "../../../types";
import * as vscode from "vscode";

export class ScriptItem extends vscode.TreeItem {
  constructor(
    public readonly name: string,
    public readonly script: string,
    public readonly project: Project,
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${name}: ${script}`;
    this.description = script;
    this.contextValue = "script";
    this.iconPath = new vscode.ThemeIcon("play");

    this.command = {
      command: "npm-pm.runScript",
      title: "Run Script",
      arguments: [this],
    };
  }
}
