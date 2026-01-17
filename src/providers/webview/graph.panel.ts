import { DependencyGraph } from "../../types";
import * as vscode from "vscode";

export class GraphPanel {
  public static currentPanel: GraphPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly _extensionUri: vscode.Uri,
    initialGraph: DependencyGraph,
  ) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getHtmlForWebview();
    this.updateGraph(initialGraph);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    graphData: DependencyGraph,
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (GraphPanel.currentPanel) {
      GraphPanel.currentPanel._panel.reveal(column);
      GraphPanel.currentPanel.updateGraph(graphData);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "npmDependencyGraph",
      "Dependency Graph",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      },
    );

    GraphPanel.currentPanel = new GraphPanel(panel, extensionUri, graphData);
  }

  public dispose() {
    GraphPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  public updateGraph(graphData: DependencyGraph) {
    this._panel.webview.postMessage({ command: "update", data: graphData });
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dependency Graph</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js"></script>
    <style>
        body { font-family: var(--vscode-font-family); padding: 0; margin: 0; display: flex; flex-direction: column; height: 100vh; background-color: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        #cy { flex: 1; }
        #controls { padding: 10px; background-color: var(--vscode-editor-widget-background); border-bottom: 1px solid var(--vscode-widget-border); display: flex; gap: 10px; }
        button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 5px 10px; cursor: pointer; }
        button:hover { background-color: var(--vscode-button-hoverBackground); }
    </style>
</head>
<body>
    <div id="controls">
        <button id="layout">Reset Layout</button>
    </div>
    <div id="cy"></div>
    <script>
        const vscode = acquireVsCodeApi();
        let cy;
        let elements = [];

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'update') {
                const graph = message.data;
                renderGraph(graph);
            }
        });

        document.getElementById('layout').addEventListener('click', () => {
            if (cy) {
                cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.5, animate: true }).run();
            }
        });

        function renderGraph(root) {
            elements = [];
            const visited = new Set();
            
            function traverse(node, parentId) {
                const id = node.name + '@' + node.version;
                if (!visited.has(id)) {
                    visited.add(id);
                    elements.push({
                        data: { id: id, label: node.name + '\n' + node.version }
                    });
                }
                
                if (parentId) {
                    elements.push({
                        data: { source: parentId, target: id }
                    });
                }

                if (node.dependencies) {
                    node.dependencies.forEach(dep => traverse(dep, id));
                }
            }

            traverse(root, null);

            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: elements,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#007acc',
                            'label': 'data(label)',
                            'color': '#ffffff',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'width': 'label',
                            'height': 'label',
                            'padding': '10px',
                            'shape': 'round-rectangle',
                            'text-wrap': 'wrap'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#ccc',
                            'target-arrow-color': '#ccc',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                        }
                    }
                ],
                layout: {
                    name: 'breadthfirst',
                    directed: true,
                    spacingFactor: 1.5,
                    padding: 30
                }
            });
        }
    </script>
</body>
</html>`;
  }
}
