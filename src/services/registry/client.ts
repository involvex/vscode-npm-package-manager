import type { RegistryPackage, SearchResult } from "../../types";
import { RegistryCache } from "./cache";
import * as vscode from "vscode";

export interface RegistryClientOptions {
  registryUrl?: string;
  cacheTimeout?: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
}

interface NpmSearchResponse {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      keywords?: string[];
      author?: { name: string } | string;
      date?: string;
      links?: {
        npm?: string;
        homepage?: string;
        repository?: string;
      };
    };
  }>;
  total: number;
}

export class RegistryClient {
  private cache: RegistryCache;
  private baseUrl: string;

  constructor(options?: RegistryClientOptions) {
    this.baseUrl = options?.registryUrl || "https://registry.npmjs.org";
    this.cache = new RegistryCache(options?.cacheTimeout || 30);
  }

  private isOfflineMode(): boolean {
    const config = vscode.workspace.getConfiguration("npmPackageManager");
    return config.get<boolean>("offlineMode", false);
  }

  async getPackage(name: string): Promise<RegistryPackage | null> {
    const cacheKey = `pkg:${name}`;
    const cached = this.cache.get<RegistryPackage>(cacheKey);

    if (cached) {
      return cached;
    }

    if (this.isOfflineMode()) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(name)}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as RegistryPackage;
      this.cache.set(cacheKey, data);

      return data;
    } catch {
      return null;
    }
  }

  async getLatestVersion(name: string): Promise<string | null> {
    const pkg = await this.getPackage(name);
    return pkg?.["dist-tags"]?.latest ?? null;
  }

  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    const cacheKey = `search:${query}:${options?.limit || 20}:${options?.offset || 0}`;
    const cached = this.cache.get<SearchResult[]>(cacheKey);

    if (cached) {
      return cached;
    }

    if (this.isOfflineMode()) {
      return [];
    }

    try {
      const url = new URL("/-/v1/search", this.baseUrl);
      url.searchParams.set("text", query);
      url.searchParams.set("size", String(options?.limit || 20));

      if (options?.offset) {
        url.searchParams.set("from", String(options.offset));
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as NpmSearchResponse;
      const results = data.objects.map(obj => this.mapSearchResult(obj));

      this.cache.set(cacheKey, results);

      return results;
    } catch {
      return [];
    }
  }

  private mapSearchResult(obj: NpmSearchResponse["objects"][0]): SearchResult {
    const pkg = obj.package;

    return {
      name: pkg.name,
      description: pkg.description,
      version: pkg.version,
      keywords: pkg.keywords,
      author: typeof pkg.author === "string" ? pkg.author : pkg.author?.name,
      date: pkg.date,
      links: pkg.links,
    };
  }

  async getVersions(name: string): Promise<string[]> {
    const pkg = await this.getPackage(name);

    if (!pkg) {
      return [];
    }

    return Object.keys(pkg.versions).sort((a, b) => {
      return this.compareVersions(b, a);
    });
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;

      if (numA !== numB) {
        return numA - numB;
      }
    }

    return 0;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
