import { writable } from "svelte/store";
import type { Project } from "./project";
import type { Task } from "./task";


export const allTasksCache = writable<Task[]>([]);

export const allProjectsCache = writable<Project[]>([]);