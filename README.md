# NPM Package Manager - VSCode Extension

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/involvex.vscode-npm-package-manager)](https://marketplace.visualstudio.com/items?itemName=involvex.vscode-npm-package-manager)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/involvex.vscode-npm-package-manager)](https://marketplace.visualstudio.com/items?itemName=involvex.vscode-npm-package-manager)
[![Open VSX Version](https://img.shields.io/open-vsx/v/involvex/vscode-npm-package-manager)](https://open-vsx.org/extension/involvex/vscode-npm-package-manager)

Advanced Node.js package management for Visual Studio Code with support for npm, yarn, pnpm, and bun.

## Features

### 🏗️ Project Integration

- Auto-detect Node.js projects with `package.json` in the workspace
- Support for multi-root workspaces with independent package management
- Configurable project-specific settings (registry, install flags, etc.)

### 📦 Interactive Package Operations

- **Install Packages**: Interactive UI with version selection and dependency type (prod/dev) options
- **Remove Packages**: With dependency tree visualization
- **Update Packages**: Major/minor/patch filtering with changelog previews
- **Search Packages**: Real-time registry search with fuzzy matching
- **Batch Operations**: Update or install multiple packages simultaneously

### 🎯 Dependency Management

- One-click movement between `dependencies` and `devDependencies`
- Visual dependency graph with peer/optional dependency highlighting
- Conflict detection and resolution suggestions

### 🚨 Update & Security Monitoring

- Background update checks with configurable frequency
- Notifications for available updates (grouped by severity: patch/minor/major)
- Security vulnerability scanning with CVSS scoring
- Deprecation warnings with migration guides

### ⚙️ Configuration & Automation

- Auto-detect or manually configure package manager (npm/yarn/pnpm/bun)
- Customizable update check intervals (0 to disable)
- Pre-configured scripts with validation
- CI-friendly mode (disable auto-updates in CI environments)

### 🎨 UX Enhancements

- Command palette integration for quick actions
- Status bar indicators for pending updates and security alerts
- Keyboard shortcuts for power users
- Dark/light theme support with customizable UI colors

## Installation

1. Open VSCode
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for "NPM Package Manager"
4. Click Install

## Usage

### Dependencies View

The extension adds a "Dependencies" view to the Explorer sidebar (visible when a Node.js project is detected). This view shows:

- Project structure
- Dependencies (categorized by type)
- Updatable packages (with version indicators)
- Packages with security issues

### Command Palette

All operations are available through the Command Palette (`Ctrl+Shift+P`):

- `NPM: Refresh Dependencies` - Reload project dependencies
- `NPM: Install Package` - Install a new package
- `NPM: Uninstall Package` - Remove a package
- `NPM: Update Package` - Update a specific package
- `NPM: Update All Packages` - Update all packages in a project
- `NPM: Move to Dependencies` - Move package to production dependencies
- `NPM: Move to Dev Dependencies` - Move package to dev dependencies
- `NPM: Open on npmjs.com` - View package on npm registry
- `NPM: Search Packages` - Search npm registry
- `NPM: Security Audit` - Run security vulnerability scan
- `NPM: Check for Updates` - Manually check for updates

### Keyboard Shortcuts

- `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac) - Install package
- `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) - Refresh dependencies

## Configuration

### Extension Settings

| Setting                                       | Description                                             | Default |
| --------------------------------------------- | ------------------------------------------------------- | ------- |
| `npmPackageManager.defaultPackageManager`     | Package manager to use (auto detects based on lockfile) | `auto`  |
| `npmPackageManager.updateCheckInterval`       | Minutes between automatic update checks (0 to disable)  | `60`    |
| `npmPackageManager.showUpdateNotifications`   | Show notifications when package updates are available   | `true`  |
| `npmPackageManager.showSecurityNotifications` | Show notifications for security vulnerabilities         | `true`  |
| `npmPackageManager.showStatusBarItem`         | Show package status in status bar                       | `true`  |

### Project-specific Settings

Add a `npmPackageManager` section to your workspace or folder settings:

```json
{
  "npmPackageManager.defaultPackageManager": "yarn",
  "npmPackageManager.updateCheckInterval": 30
}
```

## Package Manager Support

### npm

- Requires npm to be installed on your system
- Supports all npm commands (install, uninstall, update, etc.)
- Handles `package-lock.json`

### yarn

- Supports yarn v1, v2 (Berry), and v3
- Handles `yarn.lock`
- Supports Plug'n'Play (PnP)

### pnpm

- Supports pnpm package manager
- Handles `pnpm-lock.yaml`
- Supports workspaces

### bun

- Supports Bun package manager
- Handles `bun.lockb`
- Fast installation and execution

## Troubleshooting

### Common Issues

1. **Extension not detecting project**: Ensure your project has a valid `package.json` file in the root directory.
2. **Package manager not found**: Make sure the selected package manager is installed globally or in your project.
3. **Slow performance**: Try increasing the update check interval or disabling auto-updates.
4. **Lockfile issues**: The extension will automatically detect and handle lockfile conflicts.

### Debugging

- Open Dev Tools (`Ctrl+Shift+I`) to see error messages
- Check the Output panel for extension logs
- Disable other extensions to rule out conflicts

## Contributing

Contributions are welcome! Please check our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - See [LICENSE](LICENSE) file for more information.

## Support

If you encounter any issues or have questions:

- Open an issue on our [GitHub repository](https://github.com/involvex/vscode-npm-package-manager/issues)
- Join our community discussion on [Discord](https://discord.gg/involvex)
- Contact us via [email](mailto:support@involvex.dev)

## Acknowledgments

Thanks to all the contributors and users who have helped shape this extension!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.
