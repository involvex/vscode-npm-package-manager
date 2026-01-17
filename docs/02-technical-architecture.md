# Technical Architecture

## System Components

The VSCode NPM Package Manager Extension is built on a modular architecture designed for scalability and maintainability. Below is a detailed breakdown of its components:

### 1. Core Services

The core services layer provides the business logic and abstractions for package management, registry interactions, and security scanning.

#### Package Manager Abstraction

- **Base Class**: `src/services/package-manager/base.ts`
  - Defines the abstract `PackageManager` class with methods for installing, uninstalling, updating, and querying packages.
- **Implementations**:
  - `npm.ts`: Handles npm-specific operations and `package-lock.json`.
  - `yarn.ts`: Supports Yarn v1, v2 (Berry), and v3, including `yarn.lock` and Plug'n'Play (PnP).
  - `pnpm.ts`: Manages pnpm operations and `pnpm-lock.yaml`, with support for workspaces.
  - `bun.ts`: Optimized for Bun's high-performance operations and `bun.lockb`.
- **Detector**: `src/services/package-manager/detector.ts`
  - Auto-detects the package manager based on lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`).

#### Registry Client

- **Client**: `src/services/registry/client.ts`
  - Interfaces with the npm registry API to fetch package metadata, versions, and search results.
- **Cache**: `src/services/registry/cache.ts`
  - Implements a 30-minute TTL cache to reduce API calls and improve performance.

#### Security Scanner

- **Scanner**: `src/services/security/scanner.ts`
  - Integrates with npm audit and advisory APIs to detect vulnerabilities.
  - Provides CVSS scoring and affected version ranges for identified vulnerabilities.

#### Project Detection

- **Detector**: `src/services/project/detector.ts`
  - Scans the workspace for `package.json` files to identify Node.js projects.
- **Watcher**: `src/services/project/watcher.ts`
  - Monitors changes to project files (e.g., `package.json`, lockfiles) and triggers updates.

### 2. UI Providers

The UI providers layer handles the visual representation of data and user interactions within VSCode.

#### TreeView

- **Dependencies Provider**: `src/providers/tree/dependencies.provider.ts`
  - Displays project dependencies in the Explorer sidebar, categorized by type (`dependencies`, `devDependencies`).
  - Shows indicators for updatable packages and security vulnerabilities.
- **Items**:
  - `category.item.ts`: Represents dependency categories.
  - `package.item.ts`: Represents individual packages with metadata.
  - `project.item.ts`: Represents the project root.

#### WebView

- **Search Panel**: `src/providers/webview/search.panel.ts`
  - Provides a real-time search interface for querying the npm registry with fuzzy matching.
- **Details Panel**: `src/providers/webview/details.panel.ts`
  - Displays detailed package information, including versions, readme, and metadata.
- **Graph Panel**: `src/providers/webview/graph.panel.ts`
  - Visualizes the dependency graph with highlighting for peer and optional dependencies.

### 3. Commands

The commands layer implements the actions available to users via the Command Palette and context menus.

#### Package Operations

- **Install**: `src/commands/install.ts`
  - Interactive UI for selecting packages, versions, and dependency types (prod/dev).
- **Uninstall**: `src/commands/uninstall.ts`
  - Removes packages and provides dependency tree visualization.
- **Update**: `src/commands/update.ts`
  - Updates packages with filtering for major/minor/patch versions and changelog previews.
- **Move Dependency**: `src/commands/move-dependency.ts`
  - Moves packages between `dependencies` and `devDependencies`.

#### Utility Commands

- **Search**: `src/commands/search.ts`
  - Opens the search panel for querying the npm registry.
- **Audit**: `src/commands/audit.ts`
  - Runs a security vulnerability scan and displays results.

### 4. Configuration

The configuration layer manages user preferences and project-specific settings.

#### Extension Settings

- **Default Package Manager**: Configures the preferred package manager (`auto`, `npm`, `yarn`, `pnpm`, `bun`).
- **Update Check Interval**: Sets the frequency of background update checks (default: 60 minutes).
- **Notification Preferences**: Controls visibility of update and security notifications.

#### Project-Specific Settings

- **Workspace Configuration**: Allows overriding extension settings for individual projects or workspaces.
- **CI-Friendly Mode**: Disables auto-updates in CI environments to avoid interference.

### 5. Views and Notifications

The views and notifications layer provides feedback and status updates to users.

#### Status Bar

- **Status Bar Item**: `src/views/statusbar.ts`
  - Displays the count of pending updates and security alerts.

#### Notifications

- **Notification System**: `src/views/notifications.ts`
  - Delivers non-intrusive alerts for updates, vulnerabilities, and deprecation warnings.

## Workflows

### 1. Project Activation

1. **Detection**: The extension activates when a `package.json` file is detected in the workspace.
2. **Initialization**: The `dependencies.provider.ts` populates the TreeView with project dependencies.
3. **Background Checks**: The `update/checker.ts` and `security/scanner.ts` initiate background checks for updates and vulnerabilities.

### 2. Package Installation

1. **Command Execution**: User triggers the `npm-pm.install` command.
2. **Search**: The `registry/client.ts` queries the npm registry for package metadata.
3. **Selection**: User selects a package and version via the interactive UI.
4. **Installation**: The appropriate package manager implementation (e.g., `bun.ts`) executes the installation.
5. **Update TreeView**: The `dependencies.provider.ts` refreshes to reflect the new dependency.

### 3. Security Audit

1. **Command Execution**: User triggers the `npm-pm.audit` command.
2. **Scan**: The `security/scanner.ts` queries the npm audit API for vulnerabilities.
3. **Analysis**: Vulnerabilities are scored using CVSS and categorized by severity.
4. **Notification**: The `notifications.ts` system alerts the user to critical issues.
5. **Status Update**: The `statusbar.ts` updates to show the count of vulnerabilities.

### 4. Dependency Graph Visualization

1. **Command Execution**: User opens the dependency graph panel.
2. **Data Collection**: The `dependency/graph.ts` analyzes the project's dependencies.
3. **Rendering**: The `graph.panel.ts` visualizes the dependency graph with highlighting for peer and optional dependencies.

## Dependencies

### External Dependencies

- **VSCode API**: Provides the foundation for extension development, including commands, views, and notifications.
- **Node.js**: Required for executing package manager commands and interacting with the npm registry.
- **npm Registry API**: Used for fetching package metadata, versions, and search results.

### Internal Dependencies

- **Core Services**: Depend on the VSCode API for workspace and file system access.
- **UI Providers**: Depend on core services for data and the VSCode API for rendering.
- **Commands**: Depend on core services for package operations and UI providers for feedback.

## Technical Decisions

### 1. Package Manager Abstraction

- **Rationale**: Abstracting package manager operations allows the extension to support multiple package managers seamlessly.
- **Implementation**: The `base.ts` abstract class defines a common interface, while individual implementations handle package manager-specific logic.

### 2. Registry Caching

- **Rationale**: Caching registry responses reduces API calls, improves performance, and minimizes rate-limiting issues.
- **Implementation**: The `cache.ts` implements a 30-minute TTL cache for registry data.

### 3. Activation Strategy

- **Rationale**: Activating the extension only when a `package.json` file is detected ensures it doesn't interfere with non-Node.js projects.
- **Implementation**: The `workspaceContains:**/package.json` activation event triggers extension initialization.

### 4. State Management

- **Rationale**: Persisting state across extension restarts enhances the user experience by retaining preferences and cached data.
- **Implementation**: The extension uses `context.workspaceState` for persistence.

### 5. Background Tasks

- **Rationale**: Deferring non-critical tasks when the window is unfocused improves performance and reduces resource usage.
- **Implementation**: Background tasks respect the window focus state and defer execution when appropriate.

## Future Considerations

### Scalability

- **Multi-root Workspaces**: The architecture supports independent package management for multiple projects within a single workspace.
- **Performance**: Caching and background task deferral ensure the extension remains responsive even in large projects.

### Extensibility

- **Custom Package Sources**: The architecture allows for extensibility, enabling support for custom package sources in the future.
- **Plugin System**: A plugin system could be introduced to allow third-party integrations with tools like Renovate or Snyk.

### Maintainability

- **Modular Design**: The separation of concerns into distinct layers (core services, UI providers, commands) simplifies maintenance and testing.
- **Documentation**: Comprehensive documentation and examples ensure the extension is easy to understand and extend.

## Conclusion

The VSCode NPM Package Manager Extension is designed to provide a robust, scalable, and user-friendly solution for managing Node.js packages. Its modular architecture, combined with a focus on performance and extensibility, ensures it meets the needs of developers working with Node.js projects of all sizes.
