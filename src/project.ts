import type { Task } from './task'

export interface IProjectIn {
	id?: string
	title: string
	category: string
	icon: string
	created_date?: Date
}

export class Project {
	id: string
	title: string
	category: string
	icon: string
	created_date: Date

	constructor(data: IProjectIn) {
		this.id = data.id ?? this.createId()
		this.title = data.title
		this.category = data.category
		this.icon = data.icon
		this.created_date = data.created_date ?? new Date()
	}

	getTasks = (taskCache: Task[]): Task[] => {
		const projectFilePath = `projects/${this.id}.md`
		const taskIdsLinkingToThisFile = Object.entries(app.metadataCache.resolvedLinks ?? {})
			.filter(([sourceFile, targetFiles]: [string, Record<string, number>]) => {
				return Object.keys(targetFiles).includes(projectFilePath)
			})
			.map(([sourceFile, targetFiles]) => sourceFile)
			.filter((sourceFile) => sourceFile.startsWith('tasks/'))
			.map((tf) => tf.replace('tasks/', '').replace('.md', ''))

		const tasks: Task[] = taskCache.filter((t) => taskIdsLinkingToThisFile.includes(t.id ?? ''))

		return tasks
	}

	getTotals = (taskCache: Task[]): { complete: number; total: number; incomplete: number } => {
		return this.getTasks(taskCache).reduce(
			(res, task) => {
				res[task.complete ? 'complete' : 'incomplete'] += 1
				res.total += 1
				return res
			},
			{ complete: 0, total: 0, incomplete: 0 }
		)
	}

	getHourTotals = (
		taskCache: Task[]
	): { complete: number; total: number; incomplete: number } => {
		const res = this.getTasks(taskCache).reduce(
			(res, task) => {
				res[task.complete ? 'complete' : 'incomplete'] += task.effort ?? 0
				res.total += task.effort ?? 0
				return res
			},
			{ complete: 0, total: 0, incomplete: 0 }
		)

		res.total = res.total / 60
		res.complete = res.complete / 60
		res.incomplete = res.incomplete / 60

		return res
	}

	createId() {
		let result = 'project-'
		const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for (let i = 0; i < 4; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}
}
