// Metrics helpers for calculating health and stats across entities

import { Note, Project, System } from '../dummy-data/types';

export interface MetricsStats {
  good: number;
  warning: number;
  critical: number;
}

/**
 * Get the health status string from a note or project
 */
export function getHealthStatus(item: { metrics?: { health?: string } }): string | undefined {
  return item.metrics?.health;
}

/**
 * Check if an item has a specific health status
 */
export function hasHealthStatus(item: { metrics?: { health?: string } }, status: 'good' | 'warning' | 'critical'): boolean {
  return item.metrics?.health === status;
}

/**
 * Calculate stats from a collection of items
 */
export function calculateStats(items: { metrics?: { health?: string } }[]): MetricsStats {
  return items.reduce<MetricsStats>((acc, item) => {
    if (item.metrics?.health === 'good') acc.good++;
    else if (item.metrics?.health === 'warning') acc.warning++;
    else if (item.metrics?.health === 'critical') acc.critical++;
    return acc;
  }, { good: 0, warning: 0, critical: 0 });
}

/**
 * Get notes stats for a project
 */
export function getNotesStatsForProject(notes: Note[]): MetricsStats {
  return calculateStats(notes);
}

/**
 * Get notes stats for a system
 */
export function getNotesStatsForSystem(notes: Note[]): MetricsStats {
  return calculateStats(notes);
}

/**
 * Get projects stats for a system
 */
export function getProjectsStats(projects: Project[]): MetricsStats {
  return calculateStats(projects);
}

/**
 * Get systems stats from all systems
 */
export function getSystemsStats(systems: System[]): MetricsStats {
  return calculateStats(systems);
}

/**
 * Calculate combined stats from notes, projects, and systems
 */
export function calculateCombinedStats(
  notes: Note[],
  projects: Project[],
  systems: System[]
): MetricsStats {
  const notesStats = calculateStats(notes);
  const projectsStats = calculateStats(projects);
  const systemsStats = calculateStats(systems);

  return {
    good: notesStats.good + projectsStats.good + systemsStats.good,
    warning: notesStats.warning + projectsStats.warning + systemsStats.warning,
    critical: notesStats.critical + projectsStats.critical + systemsStats.critical,
  };
}

/**
 * Get overall health (highest priority status)
 */
export function getOverallHealth(stats: MetricsStats): 'good' | 'warning' | 'critical' | undefined {
  if (stats.critical > 0) return 'critical';
  if (stats.warning > 0) return 'warning';
  if (stats.good > 0) return 'good';
  return undefined;
}
