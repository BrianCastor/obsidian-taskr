import type TaskrPlugin from '../main'
import { App, Modal } from 'obsidian'
import type { SvelteComponent } from 'svelte'
import type { Project } from 'src/project'
import CreateProject from '../svelte/CreateProject.svelte'

export class ProjectModal extends Modal {
	plugin: TaskrPlugin
	svelteComponent?: SvelteComponent

	constructor(app: App, plugin: TaskrPlugin) {
		super(app)
		this.plugin = plugin
		this.svelteComponent = undefined
	}

	onOpen = (): void => {
		const { titleEl, contentEl, modalEl } = this
		titleEl.setText('Create New Project')
		modalEl.style.height = 'auto'
		modalEl.style.top = 'unset'
		modalEl.style.transition = 'none !important'
		this.svelteComponent = new CreateProject({
			target: contentEl,
			props: {
				close: () => this.close(),
				store: this.onSave,
				app: this.app,
				plugin: this.plugin,
				modalEl
			}
		})
	}

	onClose = (): void => {
		const { contentEl } = this
		this.svelteComponent?.$destroy()
		contentEl.empty()
	}

	onSave = (project: Project): void => {
		this.plugin.fileInterface?.createUpdateProject(project)
	}
}
