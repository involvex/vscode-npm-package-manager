export interface DependencyNode {
  name: string;
  version: string;
  dependencies?: DependencyNode[];
  dev?: boolean;
  optional?: boolean;
  peer?: boolean;
  error?: string; // For missing or invalid dependencies
}

export interface DependencyGraph {
  name: string;
  version: string;
  dependencies: DependencyNode[];
}
