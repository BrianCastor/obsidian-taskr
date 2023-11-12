import {
	Plugin,
	TAbstractFile,
	TFile,
	type MarkdownPostProcessorContext,
	ButtonComponent
} from 'obsidian'
import { allHabitsCache, allProjectsCache, allTasksCache } from './cache'
import { TaskListView, TASK_LIST_TYPES } from './components/taskListView'
import { TaskModal } from './components/taskModal'
import { SearchModal } from './components/searchModal'
import { FileInterface } from './fileInterface'
import type { Project } from './project'
import { SettingsTab, settingsWithDefaults, type ISettings } from './settings'
import TasksToday from './svelte_pages/TasksToday.svelte'
import SingleTask from './svelte_pages/SingleTask.svelte'
import CompletedTasks from './svelte_pages/CompletedTasks.svelte'
import type { Task } from './task'
import TasksReferencingThisPage from './svelte_pages/TasksReferencingThisPage.svelte'
import { navigateToTaskPage, reloadCurrentPage } from './utils'
import { format, parse } from 'date-fns'
import type { Habit } from './habit'
import { HabitModal } from './components/habitModal'
import { HabitView } from './components/habitView'

export default class TaskrPlugin extends Plugin {
	fileInterface: FileInterface
	settings: ISettings

	async onload(): Promise<void> {
		this.fileInterface = new FileInterface(this, this.app)

		await this.loadSettings()

		this.app.workspace.onLayoutReady(this.layoutReady.bind(this))

		this.addRibbonIcon('plus-square', 'New Task (TASKR)', () => {
			new TaskModal(this.app, this).open()
		})

		this.addRibbonIcon('plus-square', 'New Habit (TASKR)', () => {
			new HabitModal(this.app, this).open()
		})

		this.addRibbonIcon('search', 'Search Tasks (TASKR)', () => {
			new SearchModal(this.app, this).open()
		})

		this.addCommand({
			id: 'taskr-add-task',
			name: 'Add Task (Taskr)',
			hotkeys: [{ modifiers: ['Mod'], key: 't' }],
			callback: () => {
				new TaskModal(this.app, this).open()
			}
		})

		this.addCommand({
			id: 'taskr-search-tasks',
			name: 'Search Tasks (Taskr)',
			hotkeys: [{ modifiers: ['Mod'], key: 'f' }],
			callback: () => {
				new SearchModal(this.app, this).open()
			}
		})

		// Modify Mobile Buttons
		const b2 = document.getElementsByClassName('mobile-navbar-action')[0] as HTMLElement
		if (b2) {
			b2.innerHTML = ''
			const bn = new ButtonComponent(b2)
			bn.setIcon('medal')
			bn.setClass('clickable-icon')
			bn.setClass('mod-tappable')
			bn.onClick((e: MouseEvent) => {
				navigateToTaskPage(TASK_LIST_TYPES.completed)
			})
		}

		const b4 = document.getElementsByClassName('mobile-navbar-action')[1] as HTMLElement
		if (b4) {
			b4.innerHTML = ''
			const bz = new ButtonComponent(b4)
			bz.setIcon('search')
			bz.setClass('clickable-icon')
			bz.setClass('mod-tappable')
			bz.onClick((e: MouseEvent) => {
				new SearchModal(this.app, this).open()
			})
		}

		const b1 = document.getElementsByClassName('mobile-navbar-action')[3] as HTMLElement
		if (b1) {
			const newElem = document.createElement('div')
			b1.replaceWith(newElem)
			const b = new ButtonComponent(newElem)
			b.setIcon('list')
			b.setClass('clickable-icon')
			b.setClass('mod-tappable')
			b.onClick((e: MouseEvent) => {
				navigateToTaskPage(TASK_LIST_TYPES.incomplete)
			})
		}
		const bn = document.getElementsByClassName('mobile-navbar-action')[2] as HTMLElement
		if (bn) {
			const newElem = document.createElement('div')
			bn.after(newElem)
			const b = new ButtonComponent(newElem)
			b.setIcon('home')
			b.setClass('clickable-icon')
			b.setClass('mod-tappable')
			b.onClick((e: MouseEvent) => {
				navigateToTaskPage(TASK_LIST_TYPES.today)
			})
		}

		const typesToLabels = {
			[TASK_LIST_TYPES.today]: {
				icon: `home`,
				label: 'Today (TASKR)'
			},
			[TASK_LIST_TYPES.completed]: {
				icon: 'medal',
				label: 'Completed (TASKR)'
			},
			[TASK_LIST_TYPES.thisWeek]: {
				icon: 'calendar-clock',
				label: 'This Week (TASKR)'
			},
			[TASK_LIST_TYPES.incomplete]: {
				icon: 'list',
				label: 'Upcoming (TASKR)'
			}
		}

		Object.values(TASK_LIST_TYPES).map((type: TASK_LIST_TYPES) => {
			this.registerView(type, (leaf) => new TaskListView(leaf, this, type))

			this.addRibbonIcon(typesToLabels[type].icon, typesToLabels[type].label, () => {
				navigateToTaskPage(type)
			})
		})

		this.registerView('habit-view', (leaf) => new HabitView(leaf, this, undefined))

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this))

		this.registerMarkdownCodeBlockProcessor('taskr', this.renderTaskBlockInMarkdown)
	}

	layoutReady() {
		// Load our svelte caches from files
		this.fileInterface.getAllTasks().then((tasks) => {
			allTasksCache.set(tasks)
		})
		this.fileInterface.getAllProjects().then((projects) => {
			allProjectsCache.set(projects)
		})
		this.fileInterface.getAllHabits().then((habits) => {
			allHabitsCache.set(habits)
		})

		// Syncs file events to our svelte caches
		this.registerEvent(
			this.app.metadataCache.on('changed', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.parent?.name == this.settings.TasksDir) {
					const task: Task = await this.fileInterface.getTaskFromFile(file)
					allTasksCache.update((tasks) => [
						...tasks.filter((t: Task) => t.id !== task.id),
						task
					])
				}
			})
		)

		this.registerEvent(
			this.app.metadataCache.on('deleted', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.contains(this.settings.TasksDir)) {
					const task: Task = await this.fileInterface.getTaskFromFile(file)
					allTasksCache.update((tasks) => tasks.filter((t: Task) => t.id !== task.id))
				}
			})
		)

		this.registerEvent(
			this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
				if (file instanceof TFile && file.parent?.name == this.settings.TasksDir) {
					const tasks: Task[] = await this.fileInterface.getAllTasks()
					allTasksCache.set(tasks)
				}
			})
		)

		this.registerEvent(
			this.app.vault.on('modify', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.parent?.name == this.settings.ProjectsDir) {
					const project: Project = this.fileInterface.getProjectFromFile(file)
					allProjectsCache.update((projects) => [
						...projects.filter((p: Project) => p.title !== project.title),
						project
					])
				}
			})
		)

		this.registerEvent(
			this.app.vault.on('delete', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.contains(this.settings.ProjectsDir)) {
					const project: Project = this.fileInterface.getProjectFromFile(file)
					allProjectsCache.update((projects) =>
						projects.filter((p: Project) => p.title !== project.title)
					)
				}
			})
		)

		this.registerEvent(
			this.app.vault.on('create', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.parent?.name == this.settings.ProjectsDir) {
					const project: Project = this.fileInterface.getProjectFromFile(file)
					allProjectsCache.update((projects) => [...projects, project])
				}
			})
		)

		this.registerEvent(
			this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
				//TODO - rename all project assignments on Tasks to new project name
				if (file instanceof TFile && file.parent?.name == this.settings.ProjectsDir) {
					const projects: Project[] = await this.fileInterface.getAllProjects()
					allProjectsCache.set(projects)
				}
			})
		)

		this.registerEvent(
			this.app.metadataCache.on('changed', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.parent?.name == this.settings.HabitsDir) {
					const habit: Habit = await this.fileInterface.getHabitFromFile(file)
					allHabitsCache.update((habits) => [
						...habits.filter((h: Habit) => h.id !== habit.id),
						habit
					])
				}
			})
		)

		this.registerEvent(
			this.app.metadataCache.on('deleted', async (file: TAbstractFile) => {
				if (file instanceof TFile && file.path.contains(this.settings.HabitsDir)) {
					const habit: Habit = await this.fileInterface.getHabitFromFile(file)
					allHabitsCache.update((habits) =>
						habits.filter((h: Habit) => h.id !== habit.id)
					)
				}
			})
		)

		this.registerEvent(
			this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
				if (file instanceof TFile && file.parent?.name == this.settings.HabitsDir) {
					const habits: Habit[] = await this.fileInterface.getAllHabits()
					allHabitsCache.set(habits)
				}
			})
		)
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.today)
		this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.completed)
		this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.thisWeek)
		this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.incomplete)
	}

	async loadSettings() {
		const data = await this.loadData()
		if (data.ExemptDays) {
			data.ExemptDays = data.ExemptDays.map((dateStr: string) =>
				parse(dateStr, 'yyyy-MM-dd', new Date())
			)
		}
		if (data.TaskCompletionStartDate) {
			data.TaskCompletionStartDate = parse(
				data.TaskCompletionStartDate,
				'yyyy-MM-dd',
				new Date()
			)
		} else {
			data.TaskCompletionStartDate = new Date()
		}
		this.settings = settingsWithDefaults(data)
	}

	async saveSettings() {
		const data: any = { ...this.settings }
		data.ExemptDays = data.ExemptDays.map((date: Date) => format(date, 'yyyy-MM-dd'))
		if (data.TaskCompletionStartDate) {
			data.TaskCompletionStartDate = format(data.TaskCompletionStartDate, 'yyyy-MM-dd')
		}
		await this.saveData(data)
		reloadCurrentPage()
	}

	renderTaskBlockInMarkdown = (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): void => {
		const params: any = {}
		const lines = source.split('\n')
		const parseLine = (line: string) => {
			if (!line.includes(':')) return null
			const field = line.split(':')[0].trim()
			const value = line.split(':')[1].trim()
			return [field, value]
		}

		lines.map((line: string) => {
			const parsed = parseLine(line)
			if (parsed) {
				params[parsed[0]] = parsed[1]
			}
		})

		if (params.id) {
			new SingleTask({
				target: el,
				props: {
					taskId: params.id,
					plugin: this
				}
			})
		} else if (params.today) {
			new TasksToday({
				target: el,
				props: {
					plugin: this
				}
			})
		} else if (params.completed) {
			new CompletedTasks({
				target: el,
				props: {
					plugin: this
				}
			})
		} else if (params.this) {
			new TasksReferencingThisPage({
				target: el,
				props: {
					plugin: this,
					filePath: ctx.sourcePath
				}
			})
		}
	}
}
