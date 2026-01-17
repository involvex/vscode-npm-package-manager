import * as vscode from "vscode";

export class ProjectWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher;
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _onDidCreate = new vscode.EventEmitter<vscode.Uri>();
  private _onDidDelete = new vscode.EventEmitter<vscode.Uri>();

  readonly onDidChange = this._onDidChange.event;
  readonly onDidCreate = this._onDidCreate.event;
  readonly onDidDelete = this._onDidDelete.event;

  constructor() {
    this.watcher = vscode.workspace.createFileSystemWatcher(
      "**/package.json",
      false,
      false,
      false,
    );

    this.watcher.onDidChange(uri => {
      if (!uri.fsPath.includes("node_modules")) {
        this._onDidChange.fire(uri);
      }
    });

    this.watcher.onDidCreate(uri => {
      if (!uri.fsPath.includes("node_modules")) {
        this._onDidCreate.fire(uri);
      }
    });

    this.watcher.onDidDelete(uri => {
      if (!uri.fsPath.includes("node_modules")) {
        this._onDidDelete.fire(uri);
      }
    });
  }

  dispose(): void {
    this.watcher.dispose();
    this._onDidChange.dispose();
    this._onDidCreate.dispose();
    this._onDidDelete.dispose();
  }
}
