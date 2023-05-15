import { PluginSettingTab, type App, Setting } from 'obsidian'
import type TaskrPlugin from './main'
import { startOfDay } from 'date-fns'
import Settings from './svelte/Settings.svelte'
import type { DayOfWeek } from './types'
import { ALL_DAYS_OF_WEEK } from './utils'

export interface ISettings {
	TasksDir: string
	DailyBandwidth: number
	PeopleDir: string
	ProjectsDir: string
	TaskCompletionStartDate: Date
	WorkingDays: DayOfWeek[]
	ExemptDays: Date[]
}

const defaultSettings: ISettings = {
	TasksDir: 'tasks',
	DailyBandwidth: 2,
	PeopleDir: 'people',
	ProjectsDir: 'projects',
	TaskCompletionStartDate: startOfDay(new Date()),
	WorkingDays: ALL_DAYS_OF_WEEK,
	ExemptDays: []
}

export const settingsWithDefaults = (settings: Partial<ISettings>): ISettings => {
	return {
		...defaultSettings,
		...settings
	}
}

export class SettingsTab extends PluginSettingTab {
	plugin: TaskrPlugin

	constructor(app: App, plugin: TaskrPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		containerEl.createEl('h2', { text: 'TASKR Settings' })

		new Setting(containerEl)
			.setName('Tasks Directory')
			.setDesc('The vault directory in which to store task files')
			.addText((text) => {
				text.setPlaceholder('$').setValue(this.plugin.settings.TasksDir)
				text.inputEl.onblur = (e: FocusEvent) => {
					this.plugin.settings.TasksDir = (e.target as HTMLInputElement).value
					this.plugin.saveSettings()
				}
			})

		new Setting(containerEl)
			.setName('People Directory')
			.setDesc('The vault directory in which to store people (to link tasks to)')
			.addText((text) => {
				text.setPlaceholder('$').setValue(this.plugin.settings.PeopleDir)
				text.inputEl.onblur = (e: FocusEvent) => {
					this.plugin.settings.PeopleDir = (e.target as HTMLInputElement).value
					this.plugin.saveSettings()
				}
			})

		new Setting(containerEl)
			.setName('Projects Directory')
			.setDesc('The vault directory in which to store projects (to link tasks to)')
			.addText((text) => {
				text.setPlaceholder('$').setValue(this.plugin.settings.ProjectsDir)
				text.inputEl.onblur = (e: FocusEvent) => {
					this.plugin.settings.ProjectsDir = (e.target as HTMLInputElement).value
					this.plugin.saveSettings()
				}
			})

		new Setting(containerEl)
			.setName('Daily Bandwidth Goal')
			.setDesc('The amount of hours per day you want to dedicate to tasks')
			.addSlider((slider) => {
				slider.setLimits(1, 12, 1)
				slider.setValue(this.plugin.settings.DailyBandwidth)
				slider.setDynamicTooltip()
				slider.onChange((value: number) => {
					this.plugin.settings.DailyBandwidth = value
					this.plugin.saveSettings()
				})
			})

		const svelteDiv = createDiv()
		containerEl.appendChild(svelteDiv)

		new Settings({
			target: svelteDiv,
			props: {
				plugin: this.plugin
			}
		})
	}
}
