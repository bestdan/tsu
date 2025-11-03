/**
 * Finds all files that depend on the given files (downstream dependencies).
 * Uses breadth-first search to find all transitive dependencies.
 * @param targetFiles - Array of file paths to find dependents for
 * @param reverseGraph - Reverse dependency graph
 * @returns Set of all files that transitively depend on the target files
 */
export function findDownstreamDependencies(
  targetFiles: string[],
  reverseGraph: Map<string, string[]>
): Set<string> {
  const downstream = new Set<string>();
  const queue = [...targetFiles];
  const visited = new Set<string>(targetFiles);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = reverseGraph.get(current) || [];

    for (const dependent of dependents) {
      if (!visited.has(dependent)) {
        visited.add(dependent);
        downstream.add(dependent);
        queue.push(dependent);
      }
    }
  }

  return downstream;
}
