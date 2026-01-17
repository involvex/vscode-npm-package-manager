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
import { AnalyticsAggregator } from "./services/analytics/aggregator";
import { DashboardPanel } from "./providers/webview/dashboard.panel";
import { DependencyGraphService } from "./services/dependency/graph";
import { ProjectDetector, ProjectWatcher } from "./services/project";
import { DependencyAnalyzer } from "./services/dependency/analyzer";
import { ConflictDetector } from "./services/dependency/conflicts";
import { createPackageManager } from "./services/package-manager";
import { GraphPanel } from "./providers/webview/graph.panel";
import { LicenseChecker } from "./services/security/license";
import { SecurityScanner } from "./services/security";
import { RegistryClient } from "./services/registry";
import { StatusBarManager } from "./views/statusbar";
import { UpdateChecker } from "./services/update";
import { logger } from "./services/logger";
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
let activeProject: Project | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  logger.log("NPM Package Manager extension is now active");

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

  const scriptsView = vscode.window.createTreeView("nodePackageScripts", {
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

      if (activeProject && activeProject.id === project.id) {
        activeProject = project;
      }
      statusBarManager.update(treeProvider.getAllProjects(), activeProject);
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
      statusBarManager.update(treeProvider.getAllProjects(), activeProject);
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

  if (projects.length > 0 && !activeProject) {
    activeProject = projects[0];
  } else if (projects.length > 0 && activeProject) {
    // Re-link active project
    activeProject =
      projects.find(p => p.id === activeProject!.id) || projects[0];
  } else {
    activeProject = undefined;
  }

  treeProvider.setActiveProject(activeProject);
  scriptsProvider.setActiveProject(activeProject);
  statusBarManager.update(projects, activeProject);

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

  if (activeProject) {
    activeProject =
      projects.find(p => p.id === activeProject!.id) || activeProject;
  }

  statusBarManager.update(projects, activeProject);
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
  statusBarManager.update(treeProvider.getAllProjects(), activeProject);
}

function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.openDashboard",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Generating analytics dashboard...",
            cancellable: false,
          },
          async () => {
            try {
              const aggregator = new AnalyticsAggregator(registryClient);
              const data = await aggregator.aggregate(project);
              DashboardPanel.createOrShow(context.extensionUri, data);
            } catch (error: any) {
              vscode.window.showErrorMessage(
                "Failed to generate dashboard: " + error.message,
              );
            }
          },
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.checkConflicts",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Checking for conflicts...",
            cancellable: false,
          },
          async () => {
            try {
              const pm = createPackageManager(
                project.packageManager,
                project.path,
              );
              const detector = new ConflictDetector(pm);
              const conflicts = await detector.detectConflicts();

              if (conflicts.length === 0) {
                vscode.window.showInformationMessage("No conflicts found.");
              } else {
                const message = `Found ${conflicts.length} conflicts.`;
                const choice = await vscode.window.showWarningMessage(
                  message,
                  "View Details",
                );
                if (choice === "View Details") {
                  // Create a markdown report or output channel
                  const output =
                    vscode.window.createOutputChannel("NPM Conflicts");
                  output.clear();
                  output.appendLine(`Conflicts for ${project.name}:`);
                  conflicts.forEach(c => {
                    output.appendLine(
                      `- ${c.packageName}: ${c.message} (${c.type})`,
                    );
                  });
                  output.show();
                }
              }
            } catch (error: any) {
              vscode.window.showErrorMessage(
                "Failed to check conflicts: " + error.message,
              );
            }
          },
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.checkLicenses",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        const checker = new LicenseChecker(registryClient);
        const violations = await checker.checkLicenses(project);

        if (violations.length === 0) {
          vscode.window.showInformationMessage("No license violations found.");
        } else {
          const message = `Found ${violations.length} license violations.`;
          const choice = await vscode.window.showWarningMessage(
            message,
            "View Details",
          );
          if (choice === "View Details") {
            const output =
              vscode.window.createOutputChannel("NPM License Check");
            output.clear();
            output.appendLine(`License Violations for ${project.name}:`);
            violations.forEach(v => {
              output.appendLine(
                `- ${v.packageName}: ${v.license} (${v.violationType})`,
              );
            });
            output.show();
          }
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("npm-pm.refresh", async () => {
      await initializeProjects();
      vscode.window.showInformationMessage("Dependencies refreshed");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("npm-pm.selectProject", async () => {
      const projects = treeProvider.getAllProjects();
      if (projects.length <= 1) {
        return;
      }

      const items = projects.map(p => ({
        label: p.name,
        description: p.packageManager,
        project: p,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select active project",
      });

      if (selected) {
        activeProject = selected.project;
        treeProvider.setActiveProject(activeProject);
        scriptsProvider.setActiveProject(activeProject);
        statusBarManager.update(projects, activeProject);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.debugScript",
      async (item?: ScriptItem) => {
        if (!item || !(item instanceof ScriptItem)) {
          vscode.window.showErrorMessage("Please select a script to debug");
          return;
        }

        // Configuration for standard Node.js debugging via npm/yarn/pnpm
        const debugConfig: vscode.DebugConfiguration = {
          type: "node",
          request: "launch",
          name: `Debug ${item.name}`,
          cwd: item.project.path,
          runtimeExecutable: "npm",
          runtimeArgs: ["run", item.name],
          skipFiles: ["<node_internals>/**"],
        };

        if (item.project.packageManager === "yarn") {
          debugConfig.runtimeExecutable = "yarn";
          debugConfig.runtimeArgs = ["run", item.name];
        } else if (item.project.packageManager === "pnpm") {
          debugConfig.runtimeExecutable = "pnpm";
          debugConfig.runtimeArgs = ["run", item.name];
        } else if (item.project.packageManager === "bun") {
          // Bun debugging is experimental/requires extension, but basic node launch might work for some.
          // Best effort: try 'bun' type if available, else fallback or use runtimeExecutable 'bun'.
          // VS Code generic debugger doesn't support 'bun' runtimeExecutable with type 'node' fully for attaching?
          // Actually, we can use pwa-node with runtimeExecutable bun?
          debugConfig.runtimeExecutable = "bun";
          debugConfig.runtimeArgs = ["run", item.name];
          // If the user has the Bun extension, type 'bun' is better.
          // debugConfig.type = 'bun';
        }

        await vscode.debug.startDebugging(undefined, debugConfig);
      },
    ),
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
      "npm-pm.auditFix",
      async (item?: ProjectItem | CategoryItem | PackageItem) => {
        const project = getProjectFromItem(item);
        if (!project) {
          vscode.window.showErrorMessage("No project selected");
          return;
        }

        if (project.packageManager === "bun") {
          vscode.window.showErrorMessage(
            "Bun does not currently support automatic vulnerability fixing via 'audit fix'.",
          );
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Fixing security vulnerabilities...",
            cancellable: false,
          },
          async () => {
            try {
              const pm = createPackageManager(
                project.packageManager,
                project.path,
              );
              const result = await pm.auditFix();

              if (result.exitCode !== 0) {
                vscode.window.showErrorMessage(
                  `Audit fix failed: ${result.stderr}`,
                );
              } else {
                vscode.window.showInformationMessage(
                  "Security vulnerabilities fixed successfully.",
                );
                await initializeProjects();
              }
            } catch (error: any) {
              vscode.window.showErrorMessage(
                `Failed to fix vulnerabilities: ${error.message}`,
              );
            }
          },
        );
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
          placeHolder: "e.g., lodash",
        });

        if (!packageName) {
          return;
        }

        let versionToInstall = packageName;

        // Interactive version selection
        if (!packageName.includes("@")) {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Fetching versions for ${packageName}...`,
            },
            async () => {
              const versions = await registryClient.getVersions(packageName);
              if (versions.length > 0) {
                const selectedVersion = await vscode.window.showQuickPick(
                  [
                    { label: "latest", description: "Install latest version" },
                    ...versions.slice(0, 20).map(v => ({ label: v })),
                  ],
                  { placeHolder: `Select version for ${packageName}` },
                );

                if (selectedVersion) {
                  versionToInstall =
                    selectedVersion.label === "latest"
                      ? packageName
                      : `${packageName}@${selectedVersion.label}`;
                }
              }
            },
          );
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
            title: `Installing ${versionToInstall}...`,
            cancellable: false,
          },
          async () => {
            const pm = createPackageManager(
              project.packageManager,
              project.path,
            );
            const result = await pm.install([versionToInstall], {
              dev: depType.label === "devDependencies",
            });

            if (result.exitCode !== 0) {
              throw new Error(result.stderr || "Installation failed");
            }

            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage(`Installed ${versionToInstall}`);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.uninstall",
      async (item?: PackageItem, items?: PackageItem[]) => {
        const packagesToUninstall =
          items && items.length > 0 ? items : item ? [item] : [];

        if (packagesToUninstall.length === 0) {
          vscode.window.showErrorMessage(
            "Please select package(s) to uninstall",
          );
          return;
        }

        const pkgNames = packagesToUninstall.map(p => p.pkg.name).join(", ");
        const confirm = await vscode.window.showWarningMessage(
          `Uninstall ${packagesToUninstall.length} package(s): ${pkgNames}?`,
          { modal: true },
          "Uninstall",
        );

        if (confirm !== "Uninstall") {
          return;
        }

        // Assume all selected packages belong to the same project (VS Code restriction usually)
        // If not, we might need to group by project.
        // For simplicity, we process by project.
        const packagesByProject = new Map<Project, string[]>();
        for (const pkgItem of packagesToUninstall) {
          if (!packagesByProject.has(pkgItem.project)) {
            packagesByProject.set(pkgItem.project, []);
          }
          packagesByProject.get(pkgItem.project)!.push(pkgItem.pkg.name);
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Uninstalling packages...",
            cancellable: false,
          },
          async () => {
            for (const [project, packages] of packagesByProject) {
              const pm = createPackageManager(
                project.packageManager,
                project.path,
              );
              const result = await pm.uninstall(packages);

              if (result.exitCode !== 0) {
                vscode.window.showErrorMessage(
                  `Failed to uninstall from ${project.name}: ${result.stderr}`,
                );
              }
            }
            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage(`Uninstalled ${pkgNames}`);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npm-pm.update",
      async (item?: PackageItem, items?: PackageItem[]) => {
        const packagesToUpdate =
          items && items.length > 0 ? items : item ? [item] : [];

        if (packagesToUpdate.length === 0) {
          vscode.window.showErrorMessage("Please select package(s) to update");
          return;
        }

        const pkgNames = packagesToUpdate.map(p => p.pkg.name).join(", ");

        const packagesByProject = new Map<Project, string[]>();
        for (const pkgItem of packagesToUpdate) {
          if (!packagesByProject.has(pkgItem.project)) {
            packagesByProject.set(pkgItem.project, []);
          }
          packagesByProject.get(pkgItem.project)!.push(pkgItem.pkg.name);
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Updating packages...",
            cancellable: false,
          },
          async () => {
            for (const [project, packages] of packagesByProject) {
              const pm = createPackageManager(
                project.packageManager,
                project.path,
              );
              const result = await pm.update(packages);

              if (result.exitCode !== 0) {
                vscode.window.showErrorMessage(
                  `Failed to update packages in ${project.name}: ${result.stderr}`,
                );
              }
            }
            await initializeProjects();
          },
        );

        vscode.window.showInformationMessage(`Updated ${pkgNames}`);
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
