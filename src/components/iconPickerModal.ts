import type TaskrPlugin from '../main'
import { App, Modal } from 'obsidian'
import type { SvelteComponent } from 'svelte'
import SearchIcons from '../svelte/SearchIcons.svelte'
import type { LucideIcon } from '../types/lucide'

export class IconPickerModal extends Modal {
	plugin: TaskrPlugin
	svelteComponent?: SvelteComponent
	onSelectCb: (icon: LucideIcon) => void

	constructor(app: App, plugin: TaskrPlugin, onSelectCb: (icon: LucideIcon) => void) {
		super(app)
		this.plugin = plugin
		this.svelteComponent = undefined
		this.onSelectCb = onSelectCb
	}

	onOpen = (): void => {
		const { titleEl, contentEl, modalEl } = this
		titleEl.setText('Choose an Icon')
		modalEl.style.height = 'auto'
		modalEl.style.top = 'unset'
		modalEl.style.transition = 'none !important'
		this.svelteComponent = new SearchIcons({
			target: contentEl,
			props: {
				close: () => this.close(),
				onSelect: this.onSelectCb
			}
		})
	}

	onClose = (): void => {
		const { contentEl } = this
		this.svelteComponent?.$destroy()
		contentEl.empty()
	}
}
