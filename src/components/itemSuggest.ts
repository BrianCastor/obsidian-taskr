import type TaskrPlugin from '../main'
import { App, PopoverSuggest, Scope, prepareFuzzySearch, type FuzzyMatch, Platform } from 'obsidian'

interface DataItem {
	id: string
	title: string
}
/**
 * Might be building on a shaky foundation here. A lot of the base class is undocumented
 */
export class ItemSuggest<T extends DataItem> extends PopoverSuggest<FuzzyMatch<T>> {
	app: App
	inputEl: HTMLElement
	plugin: TaskrPlugin
	onSelect: (file: T) => void
	data: T[] = []

	constructor(
		app: App,
		scope: Scope,
		plugin: TaskrPlugin,
		inputEl: HTMLElement,
		onSelect: (item: T) => void,
		data: T[] = []
	) {
		super(app, scope)
		this.app = app
		this.inputEl = inputEl
		this.plugin = plugin
		this.onSelect = onSelect
		this.data = data
	}

	getSuggestions(text: string) {
		const fuzzy = prepareFuzzySearch(text)
		const result: FuzzyMatch<T>[] = []
		for (const item of this.data) {
			const match = fuzzy(item.title)
			match &&
				result.push({
					item: item,
					match
				})
		}
		//@ts-ignore
		this.suggestions.setSuggestions(result)
		return result
	}

	renderSuggestion(value: FuzzyMatch<T>, el: HTMLElement) {
		let html = value.item.title
		let extraChars = 0
		value.match.matches.forEach((matchPos) => {
			const start = extraChars + matchPos[0]
			html = [
				html.slice(0, start),
				'<mark style="background:rgba(150,150,150,.4);color:white;font-weight:bold">',
				html.slice(start)
			].join('')
			extraChars += 75
			const end = extraChars + matchPos[1]
			html = [html.slice(0, end), '</mark>', html.slice(end)].join('')
			extraChars += 7
		})
		el.innerHTML = html
		el.setAttribute('title', value.item.title)
		return el
	}

	suggestBasedOnText(text: string) {
		let rect
		if (!Platform.isMobileApp) {
			//@ts-ignore
			rect = this.inputEl.getBoundingClientRect()
			//@ts-ignore
			this.suggestEl.style.width = rect.width + 'px'
			//@ts-ignore
			this.reposition(rect)
		}

		const suggestions = this.getSuggestions(text)

		if (suggestions.length > 0) {
			this.open()
		} else {
			this.close()
		}
	}

	selectSuggestion(match: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(match.item)
		evt.preventDefault()
		this.close()
	}
}
