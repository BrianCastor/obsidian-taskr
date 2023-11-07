import type TaskrPlugin from '../main'
import { App, Modal } from 'obsidian'
import type { SvelteComponent } from 'svelte'
import CreateHabit from '../svelte/CreateHabit.svelte'
import type { Habit } from 'src/habit'

export class HabitModal extends Modal {
	plugin: TaskrPlugin
	svelteComponent?: SvelteComponent

	constructor(app: App, plugin: TaskrPlugin) {
		super(app)
		this.plugin = plugin
		this.svelteComponent = undefined
	}

	onOpen = (): void => {
		const { titleEl, contentEl, modalEl } = this
		titleEl.setText('Create New Habit')
		modalEl.style.height = 'auto'
		modalEl.style.top = 'unset'
		modalEl.style.transition = 'none !important'
		this.svelteComponent = new CreateHabit({
			target: contentEl,
			props: {
				close: () => this.close(),
				//@ts-ignore
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

	onSave = (habit: Habit): void => {
		this.plugin.fileInterface?.createUpdateHabit(habit)
	}
}
