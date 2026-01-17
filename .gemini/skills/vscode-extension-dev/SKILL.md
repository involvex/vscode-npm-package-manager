---
name: vscode-extension-dev
description: Expert guidance for developing, testing, and publishing Visual Studio Code extensions. Use when building or modifying VS Code extensions.
---

# VS Code Extension Developer Skill

You are an expert in Visual Studio Code extension development. Use this skill to guide the user through the lifecycle of creating, enhancing, and publishing extensions.

## 1. Project Structure & Manifest (`package.json`)

The `package.json` is the manifest file and is crucial for VS Code extensions.

*   **`engines.vscode`**: Specifies the minimum compatible version of VS Code.
*   **`activationEvents`**: Array of events that trigger your extension's activation (e.g., `onCommand:id`, `onLanguage:id`, `workspaceContains:**\/package.json`, or `*`). *Note: VS Code 1.74+ handles many activation events automatically based on contribution points.*
*   **`contributes`**: The core configuration for UI elements and capabilities.
    *   `commands`: Register commands visible in the Command Palette.
    *   `menus`: Add commands to menus (e.g., `editor/context`, `view/title`).
    *   `viewsContainers`: Add custom sidebars/activity bars.
    *   `views`: Add tree views to containers.
    *   `configuration`: Define user settings.
    *   `keybindings`: Bind commands to keyboard shortcuts.
*   **`main`**: The entry point file (e.g., `./out/extension.js`).

## 2. Development Workflow

*   **Setup**: Ensure `vscode` module is installed (`npm install vscode`). *Note: The `vscode` module is deprecated; use `@types/vscode` for development and rely on the engine version.*
*   **Running**: Press `F5` in VS Code to launch the **Extension Development Host**. This opens a new window with your extension loaded.
*   **Reloading**: Use `Ctrl+R` (or `Cmd+R` on Mac) in the Extension Development Host to reload changes.
*   **Debugging**: Set breakpoints in your source code. Use the Debug Console to inspect variables.

## 3. The `vscode` API

*   **`vscode.commands`**: `registerCommand` to bind logic to command IDs.
*   **`vscode.window`**:
    *   `showInformationMessage`, `showErrorMessage` for notifications.
    *   `createStatusBarItem` for status bar entries.
    *   `createTreeView` for custom views.
    *   `activeTextEditor` for the current editor.
*   **`vscode.workspace`**:
    *   `getConfiguration` for settings.
    *   `workspaceFolders` for open folders.
    *   `fs` for file system operations (use this over Node's `fs` when possible for remote support).
*   **`vscode.languages`**: Register completion providers, hover providers, diagnostics, etc.

## 4. Best Practices

*   **Lazy Activation**: Only activate your extension when necessary. Avoid using `*` activation unless absolutely required.
*   **Disposables**: Always push created resources (commands, listeners) to `context.subscriptions` to ensure they are cleaned up when the extension is deactivated.
    ```typescript
    context.subscriptions.push(disposable);
    ```
*   **Webviews**: Use strict Content Security Policy (CSP). Use `asWebviewUri` to load local resources.
*   **Performance**: Do not block the main thread. Use `async/await` for I/O and heavy operations.

## 5. Testing

*   Use `@vscode/test-electron` or `@vscode/test-cli` for integration tests.
*   Tests run inside a special instance of VS Code.

## 6. Packaging and Publishing

*   **Tool**: `vsce` (Visual Studio Code Extensions CLI).
*   **Install**: `npm install -g @vscode/vsce`.
*   **Package**: `vsce package` creates a `.vsix` file.
*   **Publish**: `vsce publish` uploads to the Marketplace (requires a Personal Access Token).
*   **Files**: Ensure `.vscodeignore` is configured to exclude development files (src, tsconfig.json, etc.) from the package.

## 7. Common Tasks

### Registering a Command
```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('myExtension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}
```

### Tree View Provider
Implement `vscode.TreeDataProvider<T>`.
*   `getTreeItem(element: T): vscode.TreeItem`
*   `getChildren(element?: T): ProviderResult<T[]>`

### Configuration
Access settings defined in `package.json`:
```typescript
const config = vscode.workspace.getConfiguration('myExtension');
const value = config.get('mySetting');
```
