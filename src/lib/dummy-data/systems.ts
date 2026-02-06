import { System } from './types';

export const defaultSystems: System[] = [
  {
    id: "system-1",
    name: "Work",
    projects: [
      { id: "project-1", name: "Engineering" },
      { id: "project-2", name: "Product" },
    ],
  },
  {
    id: "system-2",
    name: "Personal",
    projects: [
      { id: "project-3", name: "Learning" },
    ],
  },
];
