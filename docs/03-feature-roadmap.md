# Feature Roadmap

This document outlines the prioritized list of features for the VSCode NPM Package Manager Extension, categorized by their importance and alignment with project goals.

## Categories

### 1. Core Functionality (Must-Have)

These features are essential for the extension to function as a basic package manager and are prioritized for initial development.

#### Project Integration

- **Auto-detection of Node.js Projects**: Automatically detect `package.json` files in the workspace.
  - **Effort**: Low
  - **Alignment**: Core functionality for project integration.
- **Multi-root Workspace Support**: Manage dependencies independently across multiple projects.
  - **Effort**: Medium
  - **Alignment**: Essential for teams working on multiple projects.
- **Configurable Project-Specific Settings**: Allow users to customize settings per project (e.g., registry, install flags).
  - **Effort**: Medium
  - **Alignment**: Enhances flexibility and usability.

#### Interactive Package Operations

- **Install Packages**: Interactive UI with version selection and dependency type (prod/dev) options.
  - **Effort**: High
  - **Alignment**: Core functionality for package management.
- **Remove Packages**: Uninstall packages with dependency tree visualization.
  - **Effort**: Medium
  - **Alignment**: Essential for maintaining clean dependency lists.
- **Update Packages**: Major/minor/patch filtering with changelog previews.
  - **Effort**: High
  - **Alignment**: Critical for keeping dependencies up-to-date.
- **Search Packages**: Real-time registry search with fuzzy matching.
  - **Effort**: High
  - **Alignment**: Enhances discoverability of packages.
- **Batch Operations**: Update or install multiple packages simultaneously.
  - **Effort**: Medium
  - **Alignment**: Improves efficiency for large projects.

#### Dependency Management

- **Move Dependencies**: One-click movement between `dependencies` and `devDependencies`.
  - **Effort**: Low
  - **Alignment**: Simplifies dependency organization.
- **Visual Dependency Graph**: Highlight peer and optional dependencies.
  - **Effort**: High
  - **Alignment**: Enhances understanding of dependency relationships.
- **Conflict Detection**: Identify and suggest resolutions for dependency conflicts.
  - **Effort**: Medium
  - **Alignment**: Critical for maintaining stable projects.

#### Update & Security Monitoring

- **Background Update Checks**: Configurable frequency for checking updates.
  - **Effort**: Medium
  - **Alignment**: Ensures users are aware of available updates.
- **Security Vulnerability Scanning**: CVSS scoring and affected version ranges.
  - **Effort**: High
  - **Alignment**: Essential for maintaining secure projects.
- **Deprecation Warnings**: Provide migration guides for deprecated packages.
  - **Effort**: Medium
  - **Alignment**: Helps users stay current with best practices.

#### Configuration & Automation

- **Auto-detect Package Manager**: Detect the package manager based on lockfiles.
  - **Effort**: Medium
  - **Alignment**: Simplifies setup for users.
- **Customizable Update Check Intervals**: Allow users to configure how often updates are checked.
  - **Effort**: Low
  - **Alignment**: Enhances user control over performance.
- **CI-Friendly Mode**: Disable auto-updates in CI environments.
  - **Effort**: Low
  - **Alignment**: Ensures compatibility with CI/CD pipelines.

### 2. Enhancements (Should-Have)

These features enhance the user experience and provide additional functionality but are not critical for the initial release.

#### UX Enhancements

- **Command Palette Integration**: Quick access to all package operations.
  - **Effort**: Low
  - **Alignment**: Improves usability and accessibility.
- **Status Bar Indicators**: Show pending updates and security alerts.
  - **Effort**: Medium
  - **Alignment**: Provides at-a-glance status updates.
- **Keyboard Shortcuts**: Customizable shortcuts for power users.
  - **Effort**: Low
  - **Alignment**: Enhances productivity for advanced users.
- **Dark/Light Theme Support**: Customizable UI colors.
  - **Effort**: Medium
  - **Alignment**: Improves user experience across themes.

#### Advanced Features

- **Package Usage Analytics**: Detect unused dependencies.
  - **Effort**: High
  - **Alignment**: Helps users optimize their projects.
- **License Compliance Checks**: Configurable rules for license validation.
  - **Effort**: Medium
  - **Alignment**: Ensures compliance with licensing requirements.
- **Offline Mode**: Cached registry data for offline use.
  - **Effort**: Medium
  - **Alignment**: Enhances usability in low-connectivity environments.
- **Integration with Popular Tools**: Support for Renovate, Snyk, and Dependabot.
  - **Effort**: High
  - **Alignment**: Extends functionality with third-party tools.
- **Node Script Detection**: Detect and run scripts with the configured package manager.
  - **Effort**: Medium
  - **Alignment**: Enhances automation capabilities.

### 3. Future Expansions (Could-Have)

These features are speculative and may be considered for future releases based on user feedback and project evolution.

#### Experimental Features

- **AI-Powered Recommendations**: Suggest packages based on project context.
  - **Effort**: High
  - **Alignment**: Enhances discoverability and user experience.
- **Collaborative Features**: Share dependency configurations across teams.
  - **Effort**: High
  - **Alignment**: Improves team collaboration.
- **Performance Optimization**: Further optimize background tasks and caching.
  - **Effort**: Medium
  - **Alignment**: Ensures scalability for large projects.
- **Extended Package Manager Support**: Add support for additional package managers (e.g., `deno`, `jpm`).
  - **Effort**: High
  - **Alignment**: Broadens compatibility with diverse ecosystems.

#### Community-Driven Features

- **Custom Themes**: Allow users to create and share custom themes.
  - **Effort**: Medium
  - **Alignment**: Enhances personalization.
- **Plugin System**: Enable third-party plugins for extended functionality.
  - **Effort**: High
  - **Alignment**: Encourages community contributions.
- **Localization**: Support for multiple languages.
  - **Effort**: High
  - **Alignment**: Expands accessibility to non-English speakers.

## Implementation Priority

### Phase 1: Foundation

- **Auto-detection of Node.js Projects**
- **Basic TreeView for Dependencies**
- **Install/Uninstall/Update Commands**
- **Package Manager Auto-detection**

### Phase 2: Package Operations

- **Interactive UI for Package Operations**
- **Search and Batch Operations**
- **Move Dependencies Between Categories**

### Phase 3: Registry & Search

- **Registry Client with Caching**
- **Search Panel and Package Details**
- **Update Indicators in TreeView**

### Phase 4: Security & Monitoring

- **Security Vulnerability Scanning**
- **Background Update Checks**
- **Status Bar and Notifications**

### Phase 5: Advanced Features

- **Dependency Graph Visualization**
- **Unused Dependency Detection**
- **Multi-root Workspace Support**

## Alignment with Project Goals

### Core Functionality

- **Project Integration**: Aligns with the goal of seamless integration into VSCode.
- **Interactive Package Operations**: Enhances usability and reduces context switching.
- **Dependency Management**: Ensures stability and organization of dependencies.
- **Update & Security Monitoring**: Maintains project security and currency.
- **Configuration & Automation**: Provides flexibility and control to users.

### Enhancements

- **UX Enhancements**: Improves accessibility and productivity.
- **Advanced Features**: Extends functionality for power users and enterprise needs.

### Future Expansions

- **Experimental Features**: Explores innovative solutions for evolving user needs.
- **Community-Driven Features**: Encourages community engagement and contributions.

## Conclusion

The feature roadmap is designed to deliver a robust and user-friendly package management solution in phases. By prioritizing core functionality first, the extension ensures a solid foundation before expanding into advanced and experimental features. This approach aligns with the project's goals of simplicity, usability, and extensibility.
