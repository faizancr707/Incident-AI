import fs from 'fs/promises';
import path from 'path';

const SRC_APP = './src/app';

const apiMapping = {
  incidents: 'getIncidents',
  logs: 'getLogs',
  metrics: 'getMetrics',
  services: 'getServices',
  deployments: 'getDeployments',
  agents: 'getAgents',
  evaluations: 'getEvaluations',
  knowledgeEntries: 'getKnowledgeEntries',
};

async function refactorFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');

  // Skip if already refactored
  if (content.includes('@tanstack/react-query')) return;

  const mockDataImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+["']@\/lib\/mock-data["']/);
  if (!mockDataImportMatch) return; // No mock data import

  const importedVars = mockDataImportMatch[1].split(',').map(v => v.trim()).filter(Boolean);
  
  // Replace the import
  content = content.replace(mockDataImportMatch[0], `import { useQuery } from "@tanstack/react-query";\nimport { ${[...new Set(importedVars.map(v => apiMapping[v]).filter(Boolean))].join(', ')} } from "@/lib/api";\nimport { ${importedVars.join(', ')} as mock_${importedVars.join(', mock_')} } from "@/lib/mock-data";`);

  // We need to inject useQuery calls inside the component
  const componentMatch = content.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/);
  if (!componentMatch) return;

  let queryHooks = '';
  importedVars.forEach(v => {
    if (apiMapping[v]) {
      queryHooks += `  const { data: ${v} = mock_${v}, isLoading: isLoading_${v} } = useQuery({ queryKey: ['${v}'], queryFn: ${apiMapping[v]} });\n`;
    }
  });

  // Inject query hooks just after the component declaration
  const insertPos = componentMatch.index + componentMatch[0].length;
  content = content.slice(0, insertPos) + '\n' + queryHooks + content.slice(insertPos);

  // Find return statement and inject loading state if needed
  const returnMatch = content.match(/return\s+\(/);
  if (returnMatch && queryHooks) {
    const loadingCondition = importedVars.filter(v => apiMapping[v]).map(v => `isLoading_${v}`).join(' || ');
    if (loadingCondition) {
      const loadingState = `  if (${loadingCondition}) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div></div>;\n\n`;
      content = content.replace(/return\s+\(/, loadingState + '  return (');
    }
  }

  await fs.writeFile(filePath, content, 'utf-8');
  console.log(`Refactored ${filePath}`);
}

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else if (entry.name === 'page.tsx') {
      await refactorFile(fullPath);
    }
  }
}

walkDir(SRC_APP).catch(console.error);
