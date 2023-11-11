import { isFuture, startOfDay } from 'date-fns'

export interface ITask {
	id?: string | undefined
	title: string
	due_date?: Date | undefined
	scheduled_date?: Date | undefined
	completed_date?: Date | undefined
	created_date?: Date | undefined
	complete: boolean
	project?: string | undefined
	effort?: number | undefined
	contentLength?: number | undefined
}

export class Task implements ITask {
	id?: string
	title: string
	due_date?: Date | undefined
	scheduled_date?: Date | undefined
	completed_date?: Date | undefined
	created_date?: Date | undefined
	complete: boolean
	project?: string | undefined
	effort?: number | undefined
	contentLength?: number | undefined

	constructor(data: ITask) {
		this.title = data.title
		this.due_date = data.due_date
		this.complete = data.complete
		this.project = data.project
		this.scheduled_date = data.scheduled_date
		this.completed_date = data.completed_date
		this.created_date = data.created_date
		this.effort = data.effort
		this.contentLength = data.contentLength

		if (data.id) {
			this.id = data.id
		} else {
			this.id = this.createId()
		}
	}

	isOverdue() {
		return this.isOverDueForDate(new Date())
	}

	isOverDueForDate(dt: Date) {
		if (this.complete) {
			return false
		}
		if (!this.scheduled_date) {
			return false
		}
		if (isFuture(dt)) {
			return false
		}
		return startOfDay(dt) > this.scheduled_date
	}

	filename() {
		return `task-${this.id}`
	}

	filepath() {
		return `tasks/${this.id}.md`
	}

	createId() {
		let result = 'task-'
		const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for (let i = 0; i < 4; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}
}
