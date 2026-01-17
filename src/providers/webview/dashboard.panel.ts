import { DashboardData } from "../../services/analytics/aggregator";
import * as vscode from "vscode";

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly _extensionUri: vscode.Uri,
    initialData: DashboardData,
  ) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getHtmlForWebview();
    this.updateData(initialData);
  }

  public static createOrShow(extensionUri: vscode.Uri, data: DashboardData) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel._panel.reveal(column);
      DashboardPanel.currentPanel.updateData(data);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "npmDashboard",
      `Analytics: ${data.projectName}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      },
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, data);
  }

  public dispose() {
    DashboardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  public updateData(data: DashboardData) {
    this._panel.webview.postMessage({ command: "update", data });
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background-color: var(--vscode-editor-widget-background); border: 1px solid var(--vscode-widget-border); border-radius: 6px; padding: 15px; }
        h2 { margin-top: 0; font-size: 1.2em; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 10px; }
        .stat { font-size: 2em; font-weight: bold; text-align: center; margin: 20px 0; }
        .stat-label { font-size: 0.8em; text-align: center; opacity: 0.8; }
        canvas { max-height: 250px; }
    </style>
</head>
<body>
    <div id="container">
        <h1 id="title">Project Analytics</h1>
        <div class="grid">
            <div class="card">
                <h2>Total Packages</h2>
                <div class="stat" id="totalPackages">-</div>
                <div class="stat-label">Installed Dependencies</div>
            </div>
            <div class="card">
                <h2>Security Issues</h2>
                <div class="stat" id="totalVuln">-</div>
                <div class="stat-label">Known Vulnerabilities</div>
            </div>
            <div class="card">
                <h2>Deprecated</h2>
                <div class="stat" id="totalDeprecated">-</div>
                <div class="stat-label">Deprecated Packages</div>
            </div>
            <div class="card">
                <h2>Update Status</h2>
                <canvas id="updatesChart"></canvas>
            </div>
            <div class="card">
                <h2>Vulnerability Severity</h2>
                <canvas id="severityChart"></canvas>
            </div>
            <div class="card">
                <h2>License Distribution</h2>
                <canvas id="licenseChart"></canvas>
            </div>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        let updatesChart, severityChart, licenseChart;

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'update') {
                render(message.data);
            }
        });

        function render(data) {
            document.getElementById('title').textContent = 'Analytics: ' + data.projectName;
            document.getElementById('totalPackages').textContent = data.totalPackages;
            document.getElementById('totalVuln').textContent = data.security.totalVulnerabilities;
            document.getElementById('totalDeprecated').textContent = data.deprecation.total;
            
            // Updates Chart
            const updatesCtx = document.getElementById('updatesChart').getContext('2d');
            if (updatesChart) updatesChart.destroy();
            updatesChart = new Chart(updatesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Up to Date', 'Patch', 'Minor', 'Major'],
                    datasets: [{
                        data: [
                            data.updateStatus.upToDate,
                            data.updateStatus.patch,
                            data.updateStatus.minor,
                            data.updateStatus.major
                        ],
                        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#f44336']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            // Severity Chart
            const severityCtx = document.getElementById('severityChart').getContext('2d');
            if (severityChart) severityChart.destroy();
            severityChart = new Chart(severityCtx, {
                type: 'bar',
                data: {
                    labels: ['Critical', 'High', 'Moderate', 'Low'],
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: [
                            data.security.critical,
                            data.security.high,
                            data.security.moderate,
                            data.security.low
                        ],
                        backgroundColor: ['#b71c1c', '#f44336', '#ff9800', '#ffeb3b']
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });

            // License Chart
            const licenseCtx = document.getElementById('licenseChart').getContext('2d');
            if (licenseChart) licenseChart.destroy();
            const licenseLabels = Object.keys(data.licenses);
            const licenseValues = Object.values(data.licenses);
            
            licenseChart = new Chart(licenseCtx, {
                type: 'pie',
                data: {
                    labels: licenseLabels,
                    datasets: [{
                        data: licenseValues,
                        backgroundColor: [
                            '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                            '#2196f3', '#03a9f4', '#00bcd4', '#009688', 
                            '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'
                        ]
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    </script>
</body>
</html>`;
  }
}
