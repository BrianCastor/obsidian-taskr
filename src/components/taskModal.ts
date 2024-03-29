import type TaskrPlugin from '../main'
import { App, MarkdownView, Modal } from 'obsidian'
import type { ITask, Task } from '../task'
import CreateTask from '../svelte/CreateTask.svelte'
import type { SvelteComponent } from 'svelte'

export class TaskModal extends Modal {
	plugin: TaskrPlugin
	svelteComponent?: SvelteComponent
	prefill: Partial<ITask> | undefined = {}

	constructor(app: App, plugin: TaskrPlugin, prefill: Partial<ITask> | undefined = {}) {
		super(app)
		this.plugin = plugin
		this.svelteComponent = undefined
		this.prefill = prefill
	}

	onOpen = (): void => {
		const { titleEl, contentEl, modalEl } = this
		titleEl.setText('Create New Task')
		modalEl.style.height = 'auto'
		modalEl.style.top = 'unset'
		modalEl.style.transition = 'none !important'
		this.svelteComponent = new CreateTask({
			target: contentEl,
			props: {
				close: () => this.close(),
				//@ts-ignore
				store: this.onSave,
				app: this.app,
				plugin: this.plugin,
				modalEl,
				prefill: this.prefill
			}
		})
	}

	onClose = (): void => {
		const { contentEl } = this
		this.svelteComponent?.$destroy()
		contentEl.empty()
	}

	onSave = (task: Task): void => {
		this.plugin.fileInterface?.createUpdateTask(task)

		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		// Make sure the user is editing a Markdown file.
		if (view) {
			const cursor = view.editor.getCursor()

			if (cursor.line) {
				view.editor.replaceRange(`\`\`\`taskr\nid: ${task.id}\n\`\`\`\n`, cursor)
			}

			// ...
		}
	}
}
