import type TaskrPlugin from '../main'
import { ItemView, WorkspaceLeaf } from 'obsidian'
import ProjectsPage from '../svelte_pages/ProjectsPage.svelte'

export class ProjectsView extends ItemView {
	plugin: TaskrPlugin

	constructor(leaf: WorkspaceLeaf, plugin: TaskrPlugin) {
		super(leaf)
		this.plugin = plugin
	}

	getViewType(): string {
		return 'projects-view'
	}

	getDisplayText(): string {
		return 'Projects'
	}

	getIcon(): string {
		return 'kanban-square'
	}

	async onOpen(): Promise<void> {
		new ProjectsPage({
			target: (this as any).contentEl,
			props: {
				plugin: this.plugin
			}
		})
	}
}
