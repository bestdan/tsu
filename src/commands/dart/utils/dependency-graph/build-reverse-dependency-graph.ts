/**
 * Builds a reverse dependency graph (which files depend on which).
 * @param dependencyGraph - Forward dependency graph
 * @returns Map of file -> array of files that import it
 */
export function buildReverseDependencyGraph(
  dependencyGraph: Map<string, string[]>
): Map<string, string[]> {
  const reverseGraph = new Map<string, string[]>();

  // Initialize all files in the reverse graph
  for (const file of dependencyGraph.keys()) {
    if (!reverseGraph.has(file)) {
      reverseGraph.set(file, []);
    }
  }

  // Build reverse edges
  for (const [file, imports] of dependencyGraph.entries()) {
    for (const importedFile of imports) {
      if (!reverseGraph.has(importedFile)) {
        reverseGraph.set(importedFile, []);
      }
      reverseGraph.get(importedFile)!.push(file);
    }
  }

  return reverseGraph;
}
