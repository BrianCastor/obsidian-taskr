import { isAfter, isBefore, isEqual } from 'date-fns'
import type { RRule } from 'rrule'

export interface IHabitIn {
	id?: string
	title: string
	recurrence: RRule
	quantity: number
	created_date?: Date
	effort: number
	project?: string
	completion_dates?: Date[]
}

export class Habit {
	id: string
	title: string
	recurrence: RRule
	quantity: number
	created_date: Date
	effort: number
	project: string | undefined

	// Track from Task completions or track internal completions?
	completion_dates: Date[]

	constructor(data: IHabitIn) {
		this.id = data.id ?? this.createId()
		this.title = data.title
		this.recurrence = data.recurrence
		this.quantity = data.quantity ?? 1
		this.created_date = data.created_date ?? new Date()
		this.effort = data.effort ?? 0
		this.project = data.project
		this.completion_dates = data.completion_dates ?? []
	}

	createId() {
		let result = 'habit-'
		const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for (let i = 0; i < 4; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}

	getDueDates = () => {
		const safeRecurrence = this.recurrence
		// Safely limit the amount of recurrences for calculation
		safeRecurrence.options.count = 200
		const dueDates = (safeRecurrence.all() ?? []).map((dt: Date) => {
			return new Date(dt.getTime() + dt.getTimezoneOffset() * 60000)
		})

		return dueDates
	}

	getDueAtPeriodForDate = (dt: Date): number => {
		const dueDates = this.getDueDates()
		const currentPeriodEnd = dueDates.find((d) => d.getTime() > dt.getTime())
		if (currentPeriodEnd && dueDates.indexOf(currentPeriodEnd) > 0) {
			return this.quantity
		}
		return 0
	}

	getDueCurrentPeriod = (): number => {
		return this.getDueAtPeriodForDate(new Date())
	}

	getCompletionsForPeriodOfDate = (dt: Date): Date[] => {
		const dueDates = this.getDueDates()
		const periodEnd = dueDates.find((d) => d.getTime() > dt.getTime())
		if (periodEnd && dueDates.indexOf(periodEnd) > 0) {
			const periodStart = dueDates[dueDates.indexOf(periodEnd) - 1]
			return (this.completion_dates ?? []).filter(
				(d) =>
					isBefore(d, periodEnd) && (isAfter(d, periodStart) || isEqual(d, periodStart))
			)
		}
		return []
	}

	getCompletionsCurrentPeriod = (): Date[] => {
		return this.getCompletionsForPeriodOfDate(new Date())
	}

	isCompleteForPeriod = () => {
		return this.getCompletionsCurrentPeriod().length >= (this.quantity ?? 0)
	}

	getStreak = () => {
		const dueDates = this.getDueDates()
		let currentDueDate = dueDates.find((d) => d.getTime() > new Date().getTime())

		let stop = false
		let streak = 0
		while (stop === false) {
			if (!currentDueDate || dueDates.indexOf(currentDueDate) === 0) {
				stop = true
			} else {
				currentDueDate = dueDates[dueDates.indexOf(currentDueDate) - 1]
				const prevDueDate = dueDates[dueDates.indexOf(currentDueDate) - 1]
				const completions = (this.completion_dates ?? []).filter(
					(d) =>
						//@ts-expect-error
						isBefore(d, currentDueDate) &&
						(isAfter(d, prevDueDate) || isEqual(d, prevDueDate))
				)
				if (completions.length >= this.quantity) {
					streak += 1
				} else {
					stop = true
				}
			}
		}

		//Check current time period, add 1 if its been completed
		if (this.getCompletionsCurrentPeriod().length >= this.quantity) {
			streak += 1
		}

		return streak
	}
}
