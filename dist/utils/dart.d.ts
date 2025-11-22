export declare const COMMON_DART_CODEGEN_SUFFIXES: readonly [".g.dart", ".freezed.dart", ".gql.dart", ".fakes.dart", ".golden.dart"];
export declare const TSU_PACKAGE_INDEX = "PACKAGE_INDEX";
export declare function findDartPackageRoot(startPath?: string): string | null;
export declare function findFilePackageRoot(filePath: string, workspaceRoot: string): string;
export declare function isDartPackage(cwd?: string): boolean;
export declare function extractImports(filePath: string, packageRoot: string): string[];
export declare function resolveImportPath(fromFile: string, importPath: string, packageRoot: string): string;
export declare function findAllDartFiles(rootDir?: string): string[] | null;
export declare function buildDependencyGraph(dartFiles: string[], packageRoot: string): Map<string, string[]>;
export declare function buildReverseDependencyGraph(dependencyGraph: Map<string, string[]>): Map<string, string[]>;
export declare function findDownstreamDependencies(targetFiles: string[], reverseGraph: Map<string, string[]>): Set<string>;
export interface PackageIndexEntry {
    name: string;
    location: string;
    [key: string]: unknown;
}
export declare function readPackageIndex(workspaceRoot?: string): PackageIndexEntry[] | null;
export declare function readPackageName(packageRoot: string): string | null;
export declare function findAffectedPackages(files: string[], workspaceRoot?: string): Map<string, string>;
//# sourceMappingURL=dart.d.ts.map