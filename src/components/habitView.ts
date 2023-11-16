import type TaskrPlugin from '../main'
import { ItemView, WorkspaceLeaf } from 'obsidian'
import HabitPage from '../svelte_pages/HabitPage.svelte'

export const TASK_LIST_VIEW_TYPE = 'taskr-task-list-view'

export class HabitView extends ItemView {
	plugin: TaskrPlugin
	id?: string | undefined

	constructor(leaf: WorkspaceLeaf, plugin: TaskrPlugin, id: string) {
		super(leaf)
		this.plugin = plugin
		this.id = id
	}

	getViewType(): string {
		return 'habit-view'
	}

	getDisplayText(): string {
		return 'Habit'
	}

	getIcon(): string {
		return 'list'
	}

	async onOpen(): Promise<void> {
		new HabitPage({
			target: (this as any).contentEl,
			props: {
				plugin: this.plugin,
				id: this.id
			}
		})
	}
}
