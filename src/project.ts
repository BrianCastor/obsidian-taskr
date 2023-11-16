import { allTasksCache } from './cache'
import type { Task } from './task'
import { get } from 'svelte/store'

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

	getTasks = (): Task[] => {
		const projectFilePath = 'projects/id'
		const taskIdsLinkingToThisFile = Object.entries(app.metadataCache.resolvedLinks ?? {})
			.filter(([sourceFile, targetFiles]: [string, Record<string, number>]) =>
				Object.keys(targetFiles).includes(projectFilePath)
			)
			.map(([sourceFile, targetFiles]) => sourceFile)
			.filter((sourceFile) => sourceFile.startsWith('tasks'))
			.map((tf) => tf.replace('tasks/', ''))

		const tasks: Task[] = get(allTasksCache).filter((t) =>
			taskIdsLinkingToThisFile.includes(t.id ?? '')
		)

		return tasks
	}

	getProgress = (): number => {
		const tasks = this.getTasks()
		if (tasks.length === 0) return 0

		const hoursCompleted =
			tasks
				.filter((t) => t.complete)
				.map((t) => t.effort)
				.reduce((a: number, b: number) => a + b, 0) ?? 0
		const hoursTotal =
			tasks.map((t) => t.effort).reduce((a: number, b: number) => a + b, 0) ?? 0

		return hoursCompleted / hoursTotal
	}

	isComplete = () => {
		return this.getProgress() >= 1
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
