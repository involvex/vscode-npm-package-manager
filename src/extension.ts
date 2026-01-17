import {
  PackageItem,
  CategoryItem,
  ProjectItem,
  ScriptItem,
} from "./providers/tree/items";
import {
  DependenciesTreeProvider,
  ScriptsTreeProvider,
} from "./providers/tree";
import type { Project, DependencyType, InstalledPackage } from "./types";
import { DependencyGraphService } from "./services/dependency/graph";
import { ProjectDetector, ProjectWatcher } from "./services/project";
import { DependencyAnalyzer } from "./services/dependency/analyzer";
import { createPackageManager } from "./services/package-manager";
import { GraphPanel } from "./providers/webview/graph.panel";
import { SecurityScanner } from "./services/security";
import { RegistryClient } from "./services/registry";
import { StatusBarManager } from "./views/statusbar";
import { UpdateChecker } from "./services/update";
import * as vscode from "vscode";

let treeProvider: DependenciesTreeProvider;
let scriptsProvider: ScriptsTreeProvider;
let projectDetector: ProjectDetector;
let projectWatcher: ProjectWatcher;
let registryClient: RegistryClient;
let updateChecker: UpdateChecker;
let securityScanner: SecurityScanner;
let statusBarManager: StatusBarManager;
let updateCheckInterval: NodeJS.Timeout | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log("NPM Package Manager extension is now active");

  projectDetector = new ProjectDetector();
  projectWatcher = new ProjectWatcher();
  treeProvider = new DependenciesTreeProvider();
  scriptsProvider = new ScriptsTreeProvider();
  registryClient = new RegistryClient();
  updateChecker = new UpdateChecker(registryClient);
  securityScanner = new SecurityScanner();
  statusBarManager = new StatusBarManager();

  const treeView = vscode.window.createTreeView("npmDependencies", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const scriptsView = vscode.window.createTreeView("npmScripts", {
    treeDataProvider: scriptsProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(treeView);
  context.subscriptions.push(scriptsView);
  context.subscriptions.push(projectWatcher);
  context.subscriptions.push(statusBarManager);

  await initializeProjects();

  projectWatcher.onDidChange(async uri => {
    const project = await projectDetector.createProject(uri.fsPath);
    if (project) {
      await loadProjectPackages(project);
      treeProvider.updateProject(project);
      scriptsProvider.updateProject(project);
      statusBarManager.update(treeProvider.getAllProjects());
    }
  });

  projectWatcher.onDidCreate(async () => {
    await initializeProjects();
  });

  projectWatcher.onDidDelete(async () => {
    await initializeProjects();
  });

  registerCommands(context);
  setupUpdateCheckInterval();

  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration("npmPackageManager")) {
      setupUpdateCheckInterval();
      statusBarManager.update(treeProvider.getAllProjects());
    }
  });

  vscode.commands.executeCommand(
    "setContext",
    "npmPackageManager.hasProject",
    treeProvider.getAllProjects().length > 0,
  );
}

function setupUpdateCheckInterval(): void {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = undefined;
  }

  const config = vscode.workspace.getConfiguration("npmPackageManager");
  const intervalMinutes = config.get<number>("updateCheckInterval", 60);

  if (intervalMinutes > 0) {
    updateCheckInterval = setInterval(
      async () => {
        await checkForUpdates();
      },
      intervalMinutes * 60 * 1000,
    );
  }
}

async function initializeProjects(): Promise<void> {
  statusBarManager.setLoading();

  const projects = await projectDetector.detectProjects();

  for (const project of projects) {
    await loadProjectPackages(project);
  }

  treeProvider.setProjects(projects);
  scriptsProvider.setProjects(projects);
  statusBarManager.update(projects);

  vscode.commands.executeCommand(
    "setContext",
    "npmPackageManager.hasProject",
    projects.length > 0,
  );

  if (projects.length > 0) {
    checkForUpdates();
  }
}

async function loadProjectPackages(project: Project): Promise<void> {
  try {
    const pm = createPackageManager(project.packageManager, project.path);
    project.packages = await pm.list();
    project.hasUpdates = project.packages.some(pkg => pkg.updateAvailable);
    project.hasSecurityIssues = project.packages.some(
      pkg => pkg.vulnerabilities && pkg.vulnerabilities.length > 0,
    );
  } catch (error) {
    console.error(`Failed to load packages for ${project.name}:`, error);
  }
}

async function checkForUpdates(): Promise<void> {
  const projects = treeProvider.getAllProjects();

  for (const project of projects) {
    try {
      project.packages = await updateChecker.checkUpdates(project.packages);
      project.hasUpdates = project.packages.some(pkg => pkg.updateAvailable);
      treeProvider.updateProject(project);
    } catch (error) {
      console.error(`Failed to check updates for ${project.name}:`, error);
    }
  }

  statusBarManager.update(projects);
  showUpdateNotificationIfNeeded(projects);
}

function showUpdateNotificationIfNeeded(projects: Project[]): void {
  const config = vscode.workspace.getConfiguration("npmPackageManager");
  const showNotifications = config.get<boolean>(
    "showUpdateNotifications",
    true,
  );

  if (!showNotifications) {
    return;
  }

  let totalUpdates = 0;
  let majorUpdates = 0;

  for (const project of projects) {
    for (const pkg of project.packages) {
      if (pkg.updateAvailable) {
        totalUpdates++;
        if (pkg.updateAvailable === "major") {
          majorUpdates++;
        }
      }
    }
  }

  if (totalUpdates > 0) {
    const message =
      majorUpdates > 0
        ? `${totalUpdates} package updates available (${majorUpdates} major)`
        : `${totalUpdates} package updates available`;

    vscode.window
      .showInformationMessage(message, "View Updates", "Update All")
      .then(selection => {
        if (selection === "View Updates") {
          vscode.commands.executeCommand("npmDependencies.focus");
        } else if (selection === "Update All") {
          vscode.commands.executeCommand("npm-pm.updateAll");
        }
      });
  }
}

async function runSecurityAudit(project: Project): Promise<void> {
  const results = await securityScanner.scan(
    project.path,
    project.packageManager,
  );

  const vulnerabilityMap = new Map<
    string,
    InstalledPackage["vulnerabilities"]
  >();

  for (const result of results) {
    vulnerabilityMap.set(result.packageName, result.vulnerabilities);
  }

  for (const pkg of project.packages) {
    pkg.vulnerabilities = vulnerabilityMap.get(pkg.name);
  }

  project.hasSecurityIssues = results.length > 0;
  treeProvider.updateProject(project);
  statusBarManager.update(treeProvider.getAllProjects());
}

function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("npm-pm.refresh", async () => {
      await initializeProjects();
      vscode.window.showInformationMessage("Dependencies refreshed");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("npm-pm.checkUpdates", async () => {
      statusBarManager.setLoading();
      await checkForUpdates();
      vscode.window.showInformationMessage("Update check complete");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.audit",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Running security audit...",
            cancellable: false,
          },
          async () => {
            await runSecurityAudit(project);
          },
        );

        const summary = securityScanner.getSummary(
          project.packages
            .filter(p => p.vulnerabilities)
            .map(p => ({
              packageName: p.name,
              vulnerabilities: p.vulnerabilities!,
            })),
        );

        if (summary.total === 0) {
          vscode.window.showInformationMessage("No vulnerabilities found!");
        } else {
          vscode.window.showWarningMessage(
            `Found ${summary.total} vulnerabilities (${summary.critical} critical, ${summary.high} high)`,
          );
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.graph",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Generating dependency graph...",
            cancellable: false,
          },
          async () => {
            try {
              const pm = createPackageManager(
                project.packageManager,
                project.path,
              );
              const graphService = new DependencyGraphService(pm);
              const graph = await graphService.generateGraph();
              GraphPanel.createOrShow(context.extensionUri, graph);
            } catch (error: any) {
              vscode.window.showErrorMessage(
                "Failed to generate graph: " + error.message,
              );
            }
          },
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.findUnused",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing dependencies...",
            cancellable: false,
          },
          async () => {
            try {
              const pm = createPackageManager(
                project.packageManager,
                project.path,
              );
              const analyzer = new DependencyAnalyzer(pm, project.path);
              const unused = await analyzer.findUnusedDependencies();

              if (unused.length === 0) {
                vscode.window.showInformationMessage(
                  "No unused dependencies found.",
                );
              } else {
                const result = await vscode.window.showWarningMessage(
                  `Found ${unused.length} potentially unused dependencies: ${unused.join(", ")}`,
                  "Uninstall All",
                  "Dismiss",
                );

                if (result === "Uninstall All") {
                  const pm = createPackageManager(
                    project.packageManager,
                    project.path,
                  );
                  await pm.uninstall(unused);
                  await initializeProjects();
                  vscode.window.showInformationMessage(
                    `Uninstalled ${unused.length} packages.`,
                  );
                }
              }
            } catch (error: any) {
              vscode.window.showErrorMessage(
                "Failed to analyze dependencies: " + error.message,
              );
            }
          },
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.runScript",
      async (item?: ScriptItem) => {
        if (!item || !(item instanceof ScriptItem)) {
          vscode.window.showErrorMessage("Please select a script to run");
          return;
        }

        const terminal = vscode.window.createTerminal({
          name: `${item.project.packageManager} run ${item.name}`,
          cwd: item.project.path,
        });

        terminal.show();
        terminal.sendText(`${item.project.packageManager} run ${item.name}`);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.install",
      async (item?: PackageItem | CategoryItem | ProjectItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        const packageName = await vscode.window.showInputBox({
          prompt: "Enter package name to install",
          placeHolder: "e.g., lodash, express@4.18.0",
        });

        if (!packageName) {
          return;
        }

        const depType = await vscode.window.showQuickPick(
          [
            { label: "dependencies", description: "Production dependency" },
            { label: "devDependencies", description: "Development dependency" },
          ],
          { placeHolder: "Install as..." },
        );

        if (!depType) {
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Installing ${packageName}...`,
            cancellable: false,
          },
          async () => {
            const pm = createPackageManager(
              project.packageManager,
              project.path,
            );
            const result = await pm.install([packageName], {
              dev: depType.label === "devDependencies",
            });

            if (result.exitCode !== 0) {
              throw new Error(result.stderr || "Installation failed");
            }

            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage(`Installed ${packageName}`);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("npm-pm.search", async () => {
      const query = await vscode.window.showInputBox({
        prompt: "Search npm packages",
        placeHolder: "Enter package name or keywords",
      });

      if (!query) {
        return;
      }

      const results = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Searching for "${query}"...`,
          cancellable: false,
        },
        async () => {
          return registryClient.search(query, { limit: 10 });
        },
      );

      if (results.length === 0) {
        vscode.window.showInformationMessage("No packages found");
        return;
      }

      const items = results.map(pkg => ({
        label: pkg.name,
        description: pkg.version,
        detail: pkg.description,
        pkg,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a package to install",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (selected) {
        vscode.commands.executeCommand("npm-pm.install", undefined);
        vscode.env.clipboard.writeText(selected.pkg.name);
        vscode.window.showInformationMessage(
          `Package name "${selected.pkg.name}" copied to clipboard. Paste it in the install prompt.`,
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.uninstall",
      async (item?: PackageItem) => {
        if (!item || !(item instanceof PackageItem)) {
          vscode.window.showErrorMessage(
            "Please select a package to uninstall",
          );
          return;
        }

        const confirm = await vscode.window.showWarningMessage(
          `Uninstall ${item.pkg.name}?`,
          { modal: true },
          "Uninstall",
        );

        if (confirm !== "Uninstall") {
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Uninstalling ${item.pkg.name}...`,
            cancellable: false,
          },
          async () => {
            const pm = createPackageManager(
              item.project.packageManager,
              item.project.path,
            );
            const result = await pm.uninstall([item.pkg.name]);

            if (result.exitCode !== 0) {
              throw new Error(result.stderr || "Uninstallation failed");
            }

            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage(`Uninstalled ${item.pkg.name}`);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.update",
      async (item?: PackageItem) => {
        if (!item || !(item instanceof PackageItem)) {
          vscode.window.showErrorMessage("Please select a package to update");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Updating ${item.pkg.name}...`,
            cancellable: false,
          },
          async () => {
            const pm = createPackageManager(
              item.project.packageManager,
              item.project.path,
            );
            const result = await pm.update([item.pkg.name]);

            if (result.exitCode !== 0) {
              throw new Error(result.stderr || "Update failed");
            }

            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage(`Updated ${item.pkg.name}`);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.updateAll",
      async (item?: CategoryItem | ProjectItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Updating all packages...",
            cancellable: false,
          },
          async () => {
            const pm = createPackageManager(
              project.packageManager,
              project.path,
            );
            const result = await pm.update();

            if (result.exitCode !== 0) {
              throw new Error(result.stderr || "Update failed");
            }

            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage("All packages updated");
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.moveToDeps",
      async (item?: PackageItem) => {
        await moveDependency(item, "dependencies");
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.moveToDevDeps",
      async (item?: PackageItem) => {
        await moveDependency(item, "devDependencies");
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.openOnNpm",
      async (item?: PackageItem) => {
        if (!item || !(item instanceof PackageItem)) {
          return;
        }

        const url = `https://www.npmjs.com/package/${item.pkg.name}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
      },
    ),
  );
}

async function moveDependency(
  item: PackageItem | undefined,
  toType: DependencyType,
): Promise<void> {
  if (!item || !(item instanceof PackageItem)) {
    vscode.window.showErrorMessage("Please select a package to move");
    return;
  }

  if (item.pkg.dependencyType === toType) {
    vscode.window.showInformationMessage(
      `${item.pkg.name} is already in ${toType}`,
    );
    return;
  }

  const pm = createPackageManager(
    item.project.packageManager,
    item.project.path,
  );

  await pm.moveDependency(item.pkg.name, item.pkg.dependencyType, toType);
  await initializeProjects();

  vscode.window.showInformationMessage(`Moved ${item.pkg.name} to ${toType}`);
}

function getProjectFromItem(
  item?: PackageItem | CategoryItem | ProjectItem,
): Project | undefined {
  if (!item) {
    const projects = treeProvider.getAllProjects();
    return projects.length === 1 ? projects[0] : undefined;
  }

  if (item instanceof PackageItem) {
    return item.project;
  }

  if (item instanceof CategoryItem) {
    return item.project;
  }

  if (item instanceof ProjectItem) {
    return item.project;
  }

  return undefined;
}

export function deactivate(): void {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  console.log("NPM Package Manager extension is now deactivated");
}
