# VS Code NPM Package Manager Extension - Implementation Plan

## Overview

Build a feature-rich VS Code extension for Node.js package management with support for npm, yarn, pnpm, and bun (default preference: bun).

## Architecture

### Directory Structure

```
src/
├── extension.ts                 # Entry point, activation, registration
├── types/                       # TypeScript interfaces
│   ├── package.types.ts         # Package, Dependency, Version
│   ├── project.types.ts         # Project, Workspace
│   └── config.types.ts          # Configuration
├── services/                    # Core business logic
│   ├── package-manager/         # PM abstraction layer
│   │   ├── base.ts              # Abstract PackageManager class
│   │   ├── npm.ts, yarn.ts, pnpm.ts, bun.ts
│   │   └── detector.ts          # Auto-detection
│   ├── registry/                # NPM registry client
│   │   ├── client.ts            # HTTP client
│   │   └── cache.ts             # Response caching
│   ├── security/                # Vulnerability scanning
│   │   └── scanner.ts
│   └── project/                 # Project detection
│       ├── detector.ts
│       └── watcher.ts
├── providers/                   # VS Code UI providers
│   ├── tree/                    # TreeView
│   │   ├── dependencies.provider.ts
│   │   └── items/
│   └── webview/                 # Webview panels
│       ├── search.panel.ts
│       └── details.panel.ts
├── commands/                    # Command implementations
├── views/                       # Status bar, notifications
└── utils/                       # Utilities
```

## Implementation Phases

### Phase 1: Foundation

**Files to create/modify:**

- `src/types/*.ts` - Define all TypeScript interfaces
- `src/services/project/detector.ts` - Find package.json files
- `src/services/package-manager/base.ts` - Abstract PM class
- `src/services/package-manager/bun.ts` - Bun implementation (primary)
- `src/providers/tree/dependencies.provider.ts` - Basic TreeView
- `src/extension.ts` - Bootstrap services and register TreeView
- `package.json` - Add activation events, views contribution

**Deliverables:**

- Extension activates on `workspaceContains:**/package.json`
- TreeView shows dependencies/devDependencies
- Refresh command updates the view

### Phase 2: Package Operations

**Files to create/modify:**

- `src/services/package-manager/npm.ts, yarn.ts, pnpm.ts` - Other PMs
- `src/services/package-manager/detector.ts` - Auto-detect from lockfile
- `src/commands/install.ts, uninstall.ts, update.ts`
- `src/commands/move-dependency.ts` - Move between deps/devDeps
- `package.json` - Add commands, menus, keybindings

**Deliverables:**

- Install/uninstall/update via command palette & context menu
- Move packages between dependencies/devDependencies
- All 4 package managers supported with auto-detection

### Phase 3: Registry & Search

**Files to create/modify:**

- `src/services/registry/client.ts` - NPM registry API
- `src/services/registry/cache.ts` - Response caching
- `src/providers/webview/search.panel.ts` - Search UI
- `src/providers/webview/details.panel.ts` - Package details
- `src/providers/tree/items/package.item.ts` - Update indicators

**Deliverables:**

- Search packages from npm registry
- Package details panel (versions, readme, metadata)
- TreeView shows update availability indicators

### Phase 4: Security & Monitoring

**Files to create/modify:**

- `src/services/security/scanner.ts` - Vulnerability scanner
- `src/services/update/scheduler.ts` - Background checks
- `src/views/statusbar.ts` - Status bar item
- `src/views/notifications.ts` - Notification system

**Deliverables:**

- Security vulnerability scanning (npm audit / advisory API)
- Background update/security checks
- Status bar showing updates/vulnerabilities count
- Notifications for critical issues

### Phase 5: Advanced Features

**Files to create/modify:**

- `src/services/dependency/graph.ts` - Dependency graph
- `src/providers/webview/graph.panel.ts` - Graph visualization
- `src/services/dependency/analyzer.ts` - Unused deps detection
- Multi-root workspace refinements

**Deliverables:**

- Visual dependency graph
- Unused dependency detection
- Full multi-root workspace support

## Key Technical Decisions

1. **Package Manager Abstraction**: Abstract base class with implementations for each PM
2. **Registry Caching**: 30-minute TTL cache to reduce API calls
3. **Activation**: `workspaceContains:**/package.json` (not `*`)
4. **State**: Use `context.workspaceState` for persistence
5. **Background Tasks**: Respect window focus state, defer when unfocused

## package.json Contributions (Final)

```json
{
  "activationEvents": ["workspaceContains:**/package.json"],
  "contributes": {
    "views": {
      "explorer": [{ "id": "npmDependencies", "name": "Dependencies" }]
    },
    "commands": [
      {
        "command": "npm-pm.install",
        "title": "Install Package",
        "category": "NPM"
      },
      {
        "command": "npm-pm.uninstall",
        "title": "Uninstall Package",
        "category": "NPM"
      },
      {
        "command": "npm-pm.update",
        "title": "Update Package",
        "category": "NPM"
      },
      {
        "command": "npm-pm.search",
        "title": "Search Packages",
        "category": "NPM"
      },
      {
        "command": "npm-pm.audit",
        "title": "Security Audit",
        "category": "NPM"
      },
      {
        "command": "npm-pm.moveToDeps",
        "title": "Move to Dependencies",
        "category": "NPM"
      },
      {
        "command": "npm-pm.moveToDevDeps",
        "title": "Move to Dev Dependencies",
        "category": "NPM"
      }
    ],
    "configuration": {
      "properties": {
        "npmPackageManager.defaultPackageManager": {
          "type": "string",
          "enum": ["auto", "npm", "yarn", "pnpm", "bun"],
          "default": "auto"
        },
        "npmPackageManager.updateCheckInterval": {
          "type": "number",
          "default": 60
        },
        "npmPackageManager.showSecurityNotifications": {
          "type": "boolean",
          "default": true
        }
      }
    }
  }
}
```

## Verification Plan

1. **Phase 1**: Open folder with package.json → TreeView populates with packages
2. **Phase 2**: Run install/uninstall commands → packages added/removed correctly
3. **Phase 3**: Search for package → results shown, can install from search
4. **Phase 4**: Run audit → vulnerabilities displayed, status bar updates
5. **Phase 5**: Open dependency graph → visualization renders correctly

**Testing commands:**

- `bun run compile` - Build extension
- `bun run watch` - Development mode
- Press F5 - Launch Extension Development Host
- `bun run test` - Run test suite
