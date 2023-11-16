import { Menu } from 'obsidian'
import type { LucideIcon } from '../types/lucide'

export interface DropdownMenuOption {
	label: string
	onClick: () => void
	icon?: LucideIcon | undefined
}

export const showDropdownMenu = (options: DropdownMenuOption[], containerEl: HTMLElement) => {
	const menu = new Menu()

	options.forEach((opt: DropdownMenuOption) => {
		menu?.addItem((item) => {
			item.setTitle(opt.label)
				.onClick(() => {
					opt.onClick()
				})
				.setIcon(opt.icon ?? null)
		})
	})
	const parentPosition = containerEl.getBoundingClientRect()
	menu.showAtPosition({ x: parentPosition.left, y: parentPosition.bottom })
}
