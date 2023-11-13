import {
	eachDayOfInterval,
	format,
	isSameDay,
	subDays,
	startOfWeek,
	endOfWeek,
	isAfter,
	startOfDay,
	addDays,
	endOfDay,
	isBefore
} from 'date-fns'
import type { DayOfWeek } from './types'
import type { Task } from './task'
import type { ISettings } from './settings'

interface TimeSeriesPoint {
	date: Date
	value: number
}

export class GoalService {
	startDate: Date
	dailyIncrement: number
	effectiveDailyIncrement: number
	workingDays: DayOfWeek[]
	exemptDays: Date[]

	constructor(settings: ISettings) {
		this.startDate = settings.TaskCompletionStartDate
		this.dailyIncrement = settings.DailyBandwidth
		this.workingDays = settings.WorkingDays
		this.exemptDays = settings.ExemptDays
		this.effectiveDailyIncrement = this.dailyIncrement * (this.workingDays.length / 7)
	}

	isDayOff = (day: Date) => {
		const weekday: DayOfWeek = format(day, 'EEEE').toLowerCase() as DayOfWeek

		return (
			!this.workingDays.includes(weekday) ||
			Boolean(this.exemptDays.find((dt: Date) => isSameDay(dt, day)))
		)
	}

	getEffortDueAtDay = (day: Date) => {
		return this.isDayOff(day) ? 0 : this.dailyIncrement
	}

	getEffortDueToday = (): number => {
		return this.getEffortDueAtDay(new Date())
	}

	getGoalTimeSeriesAccum = (): TimeSeriesPoint[] => {
		const days: Date[] = eachDayOfInterval({
			start: this.startDate,
			end: new Date()
		})

		let accumulated = 0
		const res = days.map((day: Date) => {
			accumulated += this.getEffortDueAtDay(day)
			return {
				date: day,
				value: accumulated
			}
		})
		res.unshift({
			date: subDays(this.startDate, 1),
			value: 0
		})
		return res
	}

	hoursToCompleteThisWeek = () => {
		const days: Date[] = eachDayOfInterval({
			start: startOfWeek(new Date(), { weekStartsOn: 1 }),
			end: endOfWeek(new Date(), { weekStartsOn: 1 })
		})
		return days.reduce((agg: number, val: Date) => {
			return (agg += this.getEffortDueAtDay(val))
		}, 0)
	}

	hoursToCompleteThisWeekByToday = () => {
		const days: Date[] = eachDayOfInterval({
			start: startOfWeek(new Date(), { weekStartsOn: 1 }),
			end: new Date()
		})
		return days.reduce((agg: number, val: Date) => {
			return (agg += this.getEffortDueAtDay(val))
		}, 0)
	}

	hoursToCompleteTotal = (): number => {
		return this.getGoalTimeSeriesAccum().slice(-1)[0]?.value ?? 0
	}

	getCompletedTasks = (
		tasks: Task[],
		{
			startDate,
			endDate
		}: {
			startDate?: Date | undefined
			endDate?: Date | undefined
		}
	): Task[] => {
		return tasks.filter((task: Task) => {
			return (
				task.complete &&
				task.completed_date &&
				(startDate ? isAfter(task.completed_date, startOfDay(startDate)) : true) &&
				(endDate ? isBefore(task.completed_date, endOfDay(endDate)) : true)
			)
		})
	}

	getCompletionRatePerBusinessDay = (tasks: Task[]): number => {
		const hoursCompleted = this.getTotalHoursCompleted(
			this.getCompletedTasks(tasks, { startDate: startOfDay(subDays(new Date(), 6)) })
		)

		const totalWorkDays = eachDayOfInterval({
			start: startOfDay(subDays(new Date(), 6)),
			end: startOfDay(new Date())
		}).filter((day: Date) => !this.isDayOff(day)).length

		return hoursCompleted / totalWorkDays
	}

	getDaysToRelax = (tasks: Task[]): number => {
		// We've completed more tasks than our goal - project how many days of inaction can happen before total hours completed falls below (rising) goal
		const completedVSGoalDiff = this.getTotalHoursCompleted(tasks) - this.hoursToCompleteTotal()

		if (completedVSGoalDiff < 0) return 0 // We haven't completed more tasks than goal, so can't relax

		return completedVSGoalDiff / this.dailyIncrement
	}

	projectRelaxUntil = (tasks: Task[]): Date | undefined => {
		// We've completed more tasks than our goal - project how many days of inaction can happen before total hours completed falls below (rising) goal
		let daysToRelax = this.getDaysToRelax(tasks)

		if (daysToRelax <= 0) return undefined // We haven't completed more tasks than goal, so can't relax

		// Starting at tomorrow, iterate through upcoming days
		let relaxUntilDate = startOfDay(new Date())
		while (daysToRelax >= 0) {
			relaxUntilDate = addDays(relaxUntilDate, 1)
			if (!this.isDayOff(relaxUntilDate)) {
				daysToRelax -= 1
			}
		}

		return relaxUntilDate
	}

	projectCompletionDate = (tasks: Task[]): Date | undefined => {
		// We've completed less tasks than our goal - project how many days it will take (including days off) to achieve the goal at our current rate of completion (avg. hrs/day over past week)
		const completedVSGoalDiff = this.getTotalHoursCompleted(tasks) - this.hoursToCompleteTotal()

		const projectedNetGainPerWorkDay =
			this.getCompletionRatePerBusinessDay(tasks) - this.dailyIncrement

		if (projectedNetGainPerWorkDay <= 0 || completedVSGoalDiff > 0) {
			// Completion is not possible at current rate, or we've already completed enough
			return undefined
		} else {
			let workingDaysUntilAchieve = Math.abs(completedVSGoalDiff / projectedNetGainPerWorkDay)

			let breakEvenDate = startOfDay(new Date()) // Assuming no more work is done until tomorrow
			while (workingDaysUntilAchieve > 0) {
				breakEvenDate = addDays(breakEvenDate, 1)
				if (!this.isDayOff(breakEvenDate)) {
					workingDaysUntilAchieve -= 1
				}
			}
			return breakEvenDate
		}
	}

	getTotalHoursCompleted = (tasks: Task[]) => {
		return (
			tasks
				.filter((task: Task) => {
					return task.complete && task.completed_date
				})
				.reduce((accumulator: number, task: Task) => {
					return accumulator + (task.effort ?? 0)
				}, 0) / 60
		)
	}
}
