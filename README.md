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

- **Install Packages**: Interactive UI with version selection (latest/specific) and dependency type (prod/dev) options.
- **Remove Packages**: Batch removal support.
- **Update Packages**: Batch update support with major/minor/patch filtering.
- **Search Packages**: Real-time registry search with fuzzy matching.
- **Batch Operations**: Update or install multiple packages simultaneously.

### 🎯 Dependency Management

- **Visual Dependency Graph**: Interactive graph visualization of your project's dependencies.
- **Unused Dependency Detection**: Find and remove unused dependencies by scanning your source code.
- **Conflict Detection**: Identify conflicting peer dependencies and invalid package states.
- **License Compliance**: Check installed packages against allowed/blocked license lists.
- **Move Dependencies**: One-click movement between `dependencies` and `devDependencies`.

### 🚀 Scripts & Automation

- **Scripts Explorer**: dedicated view to list and run `package.json` scripts with one click.
- **Script Debugging**: Debug scripts directly from the VS Code UI.
- **Multi-root Support**: Seamlessly switch between active projects in a multi-root workspace via the status bar.
- **Offline Mode**: Work without internet access using cached metadata.

### 🚨 Update & Security Monitoring

- **Background Checks**: Configurable background checks for updates and security vulnerabilities.
- **Security Audit**: Integrated vulnerability scanning using `npm audit` logic.
- **Deprecation Warnings**: Visual indicators for deprecated packages.

### ⚙️ Configuration & Automation

- **Smart Detection**: Automatically detects package manager (`npm`, `yarn`, `pnpm`, `bun`) using `package.json`'s `packageManager` field or lockfiles (including `bun.lock`).
- **Customizable**: Configure update check intervals, notifications, and more.
- **Debug Mode**: Enable verbose logging to the VS Code output channel for troubleshooting.

## Installation

1. Open VSCode
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for "NPM Package Manager"
4. Click Install

## Usage

### Dependencies View

The extension adds a "Dependency Manager & Scripts" view container to the Explorer sidebar.

#### Node Package Manager
Manage your dependencies:
- View all installed packages grouped by type.
- Identify updates (green arrow) and vulnerabilities (warning icon).
- Context menu actions to update, uninstall, move, or view on npmjs.com.

#### Scripts
View and run scripts defined in your `package.json`:
- Click the play button to run a script in the integrated terminal.
- Right-click to debug a script.

### Command Palette

All operations are available through the Command Palette (`Ctrl+Shift+P`):

- `NPM: Refresh Dependencies` - Reload project dependencies
- `NPM: Install Package` - Install a new package (interactive)
- `NPM: Uninstall Package` - Remove selected package(s)
- `NPM: Update Package` - Update selected package(s)
- `NPM: Update All Packages` - Update all packages in a project
- `NPM: Find Unused Dependencies` - Scan for unused dependencies
- `NPM: View Dependency Graph` - Open the dependency graph visualization
- `NPM: Check Conflicts` - Check for dependency conflicts
- `NPM: Check Licenses` - Validate package licenses against policy
- `NPM: Select Active Project` - Switch the active project in a multi-root workspace
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
| `npmPackageManager.defaultPackageManager`     | Package manager to use (auto, npm, yarn, pnpm, bun)     | `auto`  |
| `npmPackageManager.updateCheckInterval`       | Minutes between automatic update checks (0 to disable)  | `60`    |
| `npmPackageManager.showUpdateNotifications`   | Show notifications when package updates are available   | `true`  |
| `npmPackageManager.showSecurityNotifications` | Show notifications for security vulnerabilities         | `true`  |
| `npmPackageManager.showStatusBarItem`         | Show package status in status bar                       | `true`  |
| `npmPackageManager.offlineMode`               | Enable offline mode (disable network requests)          | `false` |
| `npmPackageManager.debug`                     | Enable debug logging to Output channel                  | `false` |
| `npmPackageManager.allowedLicenses`           | List of allowed SPDX license identifiers                | `[]`    |
| `npmPackageManager.blockedLicenses`           | List of blocked SPDX license identifiers                | `[]`    |

### Project-specific Settings

You can configure these settings in your `.vscode/settings.json` file.

```json
{
  "npmPackageManager.defaultPackageManager": "bun",
  "npmPackageManager.allowedLicenses": ["MIT", "Apache-2.0"],
  "npmPackageManager.blockedLicenses": ["GPL-3.0"]
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
