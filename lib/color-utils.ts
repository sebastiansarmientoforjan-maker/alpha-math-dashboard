// lib/color-utils.ts
// Utility para convertir Tailwind classes a hex colors y viceversa

export const DRI_COLOR_MAP = {
  'text-slate-500': { hex: '#64748b', label: 'Inactive', tier: 'INACTIVE' },
  'text-slate-400': { hex: '#94a3b8', label: 'Inactive', tier: 'INACTIVE' }, // Mejor contraste
  'text-red-500': { hex: '#ef4444', label: 'Critical', tier: 'RED' },
  'text-amber-500': { hex: '#f59e0b', label: 'Watch', tier: 'YELLOW' },
  'text-emerald-500': { hex: '#10b981', label: 'Optimal', tier: 'GREEN' }
} as const;

export function driColorToHex(tailwindClass: string): string {
  return DRI_COLOR_MAP[tailwindClass as keyof typeof DRI_COLOR_MAP]?.hex || '#64748b';
}

export function driColorToLabel(tailwindClass: string): string {
  return DRI_COLOR_MAP[tailwindClass as keyof typeof DRI_COLOR_MAP]?.label || 'Unknown';
}

// K-means clustering simplificado para reducir puntos en scatter plot
export interface ClusterPoint {
  x: number;
  y: number;
  data: any;
}

export interface Cluster {
  centroid: { x: number; y: number };
  members: any[];
  worstStudent: any;
}

export function kMeansCluster(
  data: any[],
  k: number,
  extractors: { x: (d: any) => number; y: (d: any) => number }
): Cluster[] {
  if (data.length <= k) {
    return data.map(d => ({
      centroid: { x: extractors.x(d), y: extractors.y(d) },
      members: [d],
      worstStudent: d
    }));
  }

  // Inicializar centroides aleatoriamente
  const centroids: { x: number; y: number }[] = [];
  const step = Math.floor(data.length / k);
  for (let i = 0; i < k; i++) {
    const point = data[i * step];
    centroids.push({ x: extractors.x(point), y: extractors.y(point) });
  }

  // Iterar hasta convergencia (máximo 10 iteraciones)
  for (let iter = 0; iter < 10; iter++) {
    const clusters: any[][] = Array(k).fill(null).map(() => []);

    // Asignar puntos a clusters
    data.forEach(point => {
      const x = extractors.x(point);
      const y = extractors.y(point);
      let minDist = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, i) => {
        const dist = Math.sqrt(
          Math.pow(x - centroid.x, 2) + Math.pow(y - centroid.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      });

      clusters[closestCluster].push(point);
    });

    // Recalcular centroides
    clusters.forEach((cluster, i) => {
      if (cluster.length > 0) {
        const sumX = cluster.reduce((sum, p) => sum + extractors.x(p), 0);
        const sumY = cluster.reduce((sum, p) => sum + extractors.y(p), 0);
        centroids[i] = {
          x: sumX / cluster.length,
          y: sumY / cluster.length
        };
      }
    });
  }

  // Construir resultado final
  const result: Cluster[] = [];
  centroids.forEach((centroid, i) => {
    const members = data.filter(point => {
      const x = extractors.x(point);
      const y = extractors.y(point);
      let minDist = Infinity;
      let closestIdx = 0;

      centroids.forEach((c, j) => {
        const dist = Math.sqrt(
          Math.pow(x - c.x, 2) + Math.pow(y - c.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestIdx = j;
        }
      });

      return closestIdx === i;
    });

    if (members.length > 0) {
      const worstStudent = members.sort((a, b) => 
        (b.dri?.dropoutProbability || 0) - (a.dri?.dropoutProbability || 0)
      )[0];

      result.push({
        centroid,
        members,
        worstStudent
      });
    }
  });

  return result;
}
