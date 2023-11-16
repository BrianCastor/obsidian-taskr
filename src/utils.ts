import { MarkdownView, View, type WorkspaceLeaf } from 'obsidian'
import type { Task } from './task'
import { TaskListView } from './components/taskListView'
import type { DayOfWeek } from './types'
import { HabitView } from './components/habitView'
import { activeViewTypeCache } from './cache'
import { ProjectsView } from './components/projectsView'

export const ALL_DAYS_OF_WEEK: DayOfWeek[] = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
]

export const sortTasksByDate = (tasks: Task[], reverse = false) => {
	const ts: Task[] = tasks.sort((a: Task, b: Task) => {
		const a_m: any = a.completed_date || a.scheduled_date || a.due_date
		const b_m: any = b.completed_date || b.scheduled_date || b.due_date
		if (a_m === b_m) return 0
		if (a_m === undefined) return 1
		if (b_m === undefined) return -1
		return (a_m || new Date()).getTime() - (b_m || new Date()).getTime()
	})

	if (reverse) ts.reverse()

	return ts
}

export const allEfforts: any = [
	{
		icon: '10m',
		value: 10,
		label: 'Up to 10 mins',
		autoSuggestTerm: ':10',
		color: 'rgb(60,250,60)'
	},
	{
		icon: '30m',
		value: 30,
		label: 'Up to 30 mins',
		autoSuggestTerm: ':30',
		color: 'rgb(30,235,250)'
	},
	{
		icon: '1h',
		value: 60,
		label: 'Up to 1 hour',
		autoSuggestTerm: ':60',
		color: 'rgb(255, 255, 20)'
	},
	{
		icon: '2h',
		value: 120,
		label: 'Up to 2 hours',
		autoSuggestTerm: ':180',
		color: 'rgb(255,87,51)'
	},
	{
		icon: '4h',
		value: 240,
		label: 'Up to 4 hours',
		autoSuggestTerm: ':560',
		color: 'rgb(255,20,255)'
	},
	{ icon: '?', value: undefined, label: 'Remove', autoSuggestTerm: undefined, color: 'grey' }
]

export const getEffort = (effort: number | undefined) => {
	return allEfforts.find((option: any) => option.value === effort)
}

export const getLeaf = (): WorkspaceLeaf => {
	let leaf: WorkspaceLeaf | undefined = undefined

	leaf = [TaskListView, MarkdownView, HabitView, ProjectsView]
		.map((view) => app.workspace.getActiveViewOfType<View>(view))
		.find((view) => !!view)?.leaf

	if (leaf === undefined) {
		leaf = app.workspace.getLeaf(false)
	}
	return leaf
}

export const navigateToTaskPage = (pageType: string): void => {
	const leaf = getLeaf()
	leaf.setViewState({
		type: pageType,
		active: true
	})
	activeViewTypeCache.set(pageType)
	app.workspace.revealLeaf(leaf)
}

export const reloadCurrentPage = () => {
	const existingLeaf: WorkspaceLeaf | undefined =
		app.workspace.getActiveViewOfType(TaskListView)?.leaf

	if (existingLeaf && app.workspace.activeLeaf) {
		//@ts-expect-error
		app.workspace.activeLeaf.rebuildView()
	}
}
