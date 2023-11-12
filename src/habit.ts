import { isAfter, isBefore, isEqual } from 'date-fns'
import type { RRule } from 'rrule'
import type { LucideIcon } from './types/lucide'

export interface IHabitIn {
	id?: string
	title: string
	recurrence: RRule
	quantity: number
	created_date?: Date
	effort: number
	project?: string
	completion_dates?: Date[]
	icon?: LucideIcon
}

export class Habit {
	id: string
	title: string
	recurrence: RRule
	quantity: number
	created_date: Date
	effort: number
	project: string | undefined
	icon: LucideIcon

	// Track from Task completions or track internal completions?
	completion_dates: Date[] = []

	constructor(data: IHabitIn) {
		this.id = data.id ?? this.createId()
		this.title = data.title
		this.recurrence = data.recurrence
		this.quantity = data.quantity ?? 1
		this.created_date = data.created_date ?? new Date()
		this.effort = data.effort ?? 0
		this.project = data.project
		this.completion_dates = data.completion_dates ?? []
		this.icon = data.icon ?? 'activity'
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

	getDueDates = (): Date[] => {
		// TODO - replace with generator
		const safeRecurrence = this.recurrence
		// Safely limit the amount of recurrences for calculation
		safeRecurrence.options.count = 200
		const dueDates = (safeRecurrence.all() ?? []).map((dt: Date) => {
			return new Date(dt.getTime() + dt.getTimezoneOffset() * 60000)
		})

		return dueDates
	}

	getDueAtPeriodForDate = (dt: Date): number => {
		const currentPeriod = this.habitPeriodIterator(dt).next()
		return currentPeriod.value ? this.quantity : 0
	}

	getCompletionsForPeriodOfDate = (dt: Date): number => {
		return this.completionHistoryIterator(dt).next().value ?? 0
	}

	habitPeriodIterator = function* (endDate: Date): Generator<{ start: Date; end: Date }> {
		// Returns the current period that the end date is in as well
		let dueDates = this.getDueDates()
		const firstPeriodEndDate = dueDates.find((d: Date) => d.getTime() > endDate.getTime())

		dueDates = dueDates
			.filter((d: Date) => isBefore(d, firstPeriodEndDate) || isEqual(d, firstPeriodEndDate))
			.reverse()

		for (const periodEnd of dueDates) {
			const periodStart = dueDates[dueDates.indexOf(periodEnd) + 1]
			if (!periodStart) return
			yield { start: periodStart, end: periodEnd }
		}
	}

	completionHistoryIterator = function* (endDate: Date) {
		// Returns the current period that the end date is in as well
		for (const period of this.habitPeriodIterator(endDate)) {
			const completionsInPeriod = (this.completion_dates ?? []).filter(
				(d: Date) =>
					isBefore(d, period.end) &&
					(isAfter(d, period.start) || isEqual(d, period.start))
			)
			yield completionsInPeriod.length
		}
	}

	getStreak = () => {
		let streak = 0
		let skip = true
		for (const completionAmount of this.completionHistoryIterator(new Date())) {
			// Skip current period for calculating streak run
			if (skip) {
				skip = false
				continue
			}

			if (completionAmount < this.quantity) {
				break
			}
			streak += 1
		}

		//Check current time period, add 1 if its been completed
		if (this.getCompletionsForPeriodOfDate(new Date()) >= this.quantity) {
			streak += 1
		}

		return streak
	}
}
