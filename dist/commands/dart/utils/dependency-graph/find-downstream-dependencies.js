export function findDownstreamDependencies(targetFiles, reverseGraph) {
    const downstream = new Set();
    const queue = [...targetFiles];
    const visited = new Set(targetFiles);
    while (queue.length > 0) {
        const current = queue.shift();
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
