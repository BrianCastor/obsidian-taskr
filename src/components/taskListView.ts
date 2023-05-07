import { endOfWeek, format, startOfWeek } from 'date-fns'
import type TaskrPlugin from '../main'
import { ItemView, WorkspaceLeaf } from 'obsidian'
import TasksToday from '../svelte_pages/TasksToday.svelte'
import CompletedTasks from '../svelte_pages/CompletedTasks.svelte'
import AllIncompleteTasks from '../svelte_pages/AllIncompleteTasks.svelte'
import TasksThisWeek from '../svelte_pages/TasksThisWeek.svelte'

export const TASK_LIST_VIEW_TYPE = 'taskr-task-list-view'

export enum TASK_LIST_TYPES {
	today = 'taskr-task-list-today',
	thisWeek = 'taskr-task-list-this-week',
	completed = 'taskr-task-list-completed',
	incomplete = 'tasks-task-list-incomplete'
}

export class TaskListView extends ItemView {
	plugin: TaskrPlugin
	type: TASK_LIST_TYPES

	constructor(leaf: WorkspaceLeaf, plugin: TaskrPlugin, type: TASK_LIST_TYPES) {
		super(leaf)
		this.plugin = plugin
		this.type = type
	}

	getViewType(): string {
		return this.type
	}

	getDisplayText(): string {
		if (this.type === TASK_LIST_TYPES.today)
			return `Tasks - ${format(new Date(), 'EEEE, MMM d')}`
		if (this.type === TASK_LIST_TYPES.completed) return `Completed Tasks`
		if (this.type === TASK_LIST_TYPES.thisWeek)
			return `Tasks this Week (${format(
				startOfWeek(new Date(), { weekStartsOn: 1 }),
				'MM/d'
			)}-${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MM/d')})`
		if (this.type === TASK_LIST_TYPES.incomplete) return `Task Backlog`
		return 'Tasks'
	}

	getIcon(): string {
		if (this.type === TASK_LIST_TYPES.today) return `calendar-check-2`
		if (this.type === TASK_LIST_TYPES.completed) return `medal`
		if (this.type === TASK_LIST_TYPES.thisWeek) return `calendar-clock`
		if (this.type === TASK_LIST_TYPES.incomplete) return `list`
		return 'list'
	}

	async onOpen(): Promise<void> {
		if (this.type === TASK_LIST_TYPES.today) {
			new TasksToday({
				target: (this as any).contentEl,
				props: {
					plugin: this.plugin,
					addBottomPadding: true
				}
			})
		} else if (this.type === TASK_LIST_TYPES.completed) {
			new CompletedTasks({
				target: (this as any).contentEl,
				props: {
					plugin: this.plugin,
					addBottomPadding: true
				}
			})
		} else if (this.type === TASK_LIST_TYPES.thisWeek) {
			new TasksThisWeek({
				target: (this as any).contentEl,
				props: {
					plugin: this.plugin,
					addBottomPadding: true
				}
			})
		} else if (this.type === TASK_LIST_TYPES.incomplete) {
			new AllIncompleteTasks({
				target: (this as any).contentEl,
				props: {
					plugin: this.plugin,
					addBottomPadding: true
				}
			})
		}
	}
}
