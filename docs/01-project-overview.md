# Project Overview

## Key Objectives

The **VSCode NPM Package Manager Extension** aims to provide a seamless and interactive experience for managing Node.js packages directly within Visual Studio Code. The extension supports multiple package managers (`npm`, `yarn`, `pnpm`, and `bun`) and offers a comprehensive suite of tools for dependency management, security monitoring, and workflow automation.

## Scope

The extension is designed to:

- **Auto-detect** Node.js projects and their package managers.
- **Simplify** package operations (install, remove, update, search) through an intuitive UI.
- **Enhance** dependency management with visual tools and conflict resolution.
- **Monitor** updates and security vulnerabilities in real-time.
- **Automate** repetitive tasks and provide customizable configurations.

## Purpose

The primary goal is to streamline the Node.js development workflow by integrating package management directly into the VSCode environment. This reduces context switching, improves productivity, and ensures consistency across projects.

## Target Audience

- **Frontend and Backend Developers** working with Node.js projects.
- **DevOps Engineers** managing dependencies and security.
- **Open-source Contributors** maintaining Node.js libraries.
- **Teams** collaborating on multi-root workspaces.

## Supported Package Managers

- **npm**: Default Node.js package manager.
- **yarn**: Fast, reliable, and secure dependency management.
- **pnpm**: Efficient disk space usage with symlinked dependencies.
- **bun**: High-performance package manager with a focus on speed.

## Key Features

- **Interactive UI**: Real-time search, version selection, and dependency visualization.
- **Security Monitoring**: Vulnerability scanning and CVSS scoring.
- **Multi-root Workspace Support**: Independent package management for multiple projects.
- **Customizable**: Project-specific settings and configurable update intervals.

## Project Structure

The extension is organized into modular components:

- **Core Services**: Package manager abstraction, registry client, security scanner.
- **UI Providers**: TreeView for dependencies, WebView for search and details.
- **Commands**: Install, uninstall, update, and move dependencies.
- **Configuration**: Workspace and project-specific settings.

## Installation

The extension can be installed directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=involvex.vscode-npm-package-manager).

## Usage

Once installed, the extension activates automatically when a `package.json` file is detected in the workspace. Users can access all features via the Command Palette (`Ctrl+Shift+P`) or the Dependencies view in the Explorer sidebar.

## Configuration

The extension provides a range of configurable settings, including:

- Default package manager (`auto`, `npm`, `yarn`, `pnpm`, `bun`).
- Update check intervals.
- Notification preferences for updates and security alerts.

## Contributing

Contributions are welcome! Please refer to the [Contributing Guide](CONTRIBUTING.md) for details on how to get involved.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Support

For issues, questions, or feedback, please visit the [GitHub repository](https://github.com/involvex/vscode-npm-package-manager/issues) or join the community discussion on [Discord](https://discord.gg/involvex).
