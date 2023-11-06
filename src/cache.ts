import { writable } from 'svelte/store'
import type { Project } from './project'
import type { Task } from './task'
import type { Habit } from './habit'

export const allTasksCache = writable<Task[]>([])

export const allProjectsCache = writable<Project[]>([])

export const allHabitsCache = writable<Habit[]>([])
