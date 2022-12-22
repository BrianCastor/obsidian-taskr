import { writable } from "svelte/store";
import type { Task } from "./task";


export const allTasksCache = writable<Task[]>([]);