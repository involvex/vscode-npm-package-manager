import * as vscode from "vscode";

export class Logger {
  private outputChannel: vscode.OutputChannel;
  private isDebugMode: boolean = false;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel(
      "NPM Package Manager",
    );
    this.updateConfig();

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("npmPackageManager.debug")) {
        this.updateConfig();
      }
    });
  }

  private updateConfig() {
    this.isDebugMode = vscode.workspace
      .getConfiguration("npmPackageManager")
      .get("debug", false);

    if (this.isDebugMode) {
      this.log("Debug logging enabled");
    }
  }

  log(message: string, ...args: any[]): void {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [INFO] ${message} ${args.length ? JSON.stringify(args) : ""}`;
      this.outputChannel.appendLine(formattedMessage);
    }
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [ERROR] ${message} ${error ? (error instanceof Error ? error.stack : JSON.stringify(error)) : ""}`;
    this.outputChannel.appendLine(formattedMessage);
    // Always show output on error? Or maybe just keep it in channel.
    // this.outputChannel.show(true);
  }

  warn(message: string): void {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString();
      this.outputChannel.appendLine(`[${timestamp}] [WARN] ${message}`);
    }
  }

  dispose() {
    this.outputChannel.dispose();
  }
}

export const logger = new Logger();
