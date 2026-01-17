# Node Package Manager - Extension Overview

This project is a high-performance VS Code extension designed for comprehensive Node.js package management. It provides a unified interface for handling dependencies and scripts across various package managers including **npm**, **yarn**, **pnpm**, and **bun**.

## Core Architecture

The extension is built with a modular service-oriented architecture:

- **Package Manager Abstraction**: Uses a `BasePackageManager` class to provide a consistent API for install, uninstall, update, and tree-listing operations, regardless of the underlying tool.
- **Project Detection**: A robust `ProjectDetector` automatically identifies `package.json` files, supports multi-root workspaces, and intelligently detects the correct package manager using lockfiles or Corepack's `packageManager` field.
- **Tree Views**:
  - **Dependency Manager**: Categorizes packages (dependencies, devDependencies, etc.) with support for update indicators and security status.
  - **Scripts Explorer**: Parses and displays executable scripts from `package.json`, allowing for one-click execution and debugging.
- **Advanced Features**:
  - **Dependency Graph**: Visualizes the project's dependency tree using a Cytoscape.js-powered webview.
  - **Unused Dependency Detection**: Scans source files to identify redundant packages.
  - **Security**: Integrated vulnerability scanning and auditing.

## Building and Running

The project leverages **Bun** for fast development cycles and **Esbuild** for bundling.

- **Install Dependencies**: `bun install`
- **Compile Project**: `bun run compile` (Uses `node esbuild.js`)
- **Watch Mode**: `bun run watch` (Auto-rebuilds on changes)
- **Health Check**: `bun run check` (Runs prettier, eslint, and tsc type-checking)
- **Run Tests**: `bun run test` (Uses `vscode-test` framework)
- **Package Extension**: `bun run package` (Generates `.vsix` for distribution)

To debug the extension, open the project in VS Code and press **F5** to launch the "Extension Development Host".

## Development Conventions

- **TypeScript**: Use strict typing. Avoid `any` where possible.
- **Asynchronous I/O**: All file system and process operations must be asynchronous to keep the VS Code UI responsive.
- **Formatting & Linting**: Strictly adhere to the project's Prettier and ESLint configurations. Run `bun run check` before committing.
- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `refactor:`) to enable automated changelog generation via `bun run changelog`.
- **Clean Code**: Favor composition over inheritance. Keep services focused on a single responsibility.
