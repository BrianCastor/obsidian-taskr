import {
	eachDayOfInterval,
	parseISO,
	format,
	isSameDay,
	subDays,
	startOfWeek,
	endOfWeek,
	isAfter,
	startOfDay,
	addDays,
	differenceInDays,
	endOfDay,
	isBefore
} from 'date-fns'
import type TaskrPlugin from './main'
import type { DayOfWeek } from './types'
import type { Task } from './task'

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

	constructor(plugin: TaskrPlugin) {
		this.startDate = parseISO(plugin.settings.TaskCompletionStartDate)
		this.dailyIncrement = plugin.settings.DailyBandwidth
		this.workingDays = plugin.settings.WorkingDays
		this.exemptDays = plugin.settings.ExemptDays

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
			this.getCompletedTasks(tasks, { startDate: subDays(new Date(), 7) })
		)

		const totalWorkDays = eachDayOfInterval({
			start: subDays(new Date(), 7),
			end: new Date()
		}).filter((day: Date) => !this.isDayOff(day)).length

		console.log(tasks, totalWorkDays, hoursCompleted)

		return hoursCompleted / totalWorkDays
	}

	projectCompletionInDays = (tasks: Task[]) => {
		const completedVSGoalDiff = this.getTotalHoursCompleted(tasks) - this.hoursToCompleteTotal()

		if (completedVSGoalDiff >= 0) {
			// We've completed more tasks than our goal - project how many days of inaction can happen before total hours completed falls below (rising) goal
			let workingDaysLeft = Math.floor(completedVSGoalDiff / this.dailyIncrement)

			let date = startOfDay(new Date())
			while (workingDaysLeft > 0) {
				if (!this.isDayOff(date)) {
					workingDaysLeft -= 1
				}
				date = addDays(date, 1)
			}
			const totalDaysToRelax = -differenceInDays(date, startOfDay(new Date()))
			return totalDaysToRelax
		} else {
			// We've completed less tasks than our goal - project how many days it will take (including days off) to achieve the goal at our current rate of completion (avg. hrs/day over past week)
			const projectedNetGainPerWorkDay =
				this.getCompletionRatePerBusinessDay(tasks) - this.dailyIncrement

			if (projectedNetGainPerWorkDay <= 0) {
				// Completion is not possible at current rate
				return NaN
			} else {
				let workingDaysUntilAchieve = Math.ceil(
					Math.abs(completedVSGoalDiff / projectedNetGainPerWorkDay)
				)

				let date = startOfDay(new Date())
				while (workingDaysUntilAchieve > 0) {
					if (!this.isDayOff(date)) {
						workingDaysUntilAchieve -= 1
					}
					date = addDays(date, 1)
				}
				const totalDaysUntilAchieve = differenceInDays(date, startOfDay(new Date()))
				return totalDaysUntilAchieve
			}
		}
	}

	getDaysToRelax = (surplus: number) => {
		return Math.floor(surplus / this.dailyIncrement)
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
