export function buildReverseDependencyGraph(dependencyGraph) {
    const reverseGraph = new Map();
    for (const file of dependencyGraph.keys()) {
        if (!reverseGraph.has(file)) {
            reverseGraph.set(file, []);
        }
    }
    for (const [file, imports] of dependencyGraph.entries()) {
        for (const importedFile of imports) {
            if (!reverseGraph.has(importedFile)) {
                reverseGraph.set(importedFile, []);
            }
            reverseGraph.get(importedFile).push(file);
        }
    }
    return reverseGraph;
}
//# sourceMappingURL=build-reverse-dependency-graph.js.map