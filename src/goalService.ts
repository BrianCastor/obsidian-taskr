import {
	eachDayOfInterval,
	parseISO,
	format,
	isSameDay,
	subDays,
	startOfWeek,
	endOfWeek
} from 'date-fns'
import type TaskrPlugin from './main'
import type { DayOfWeek } from './types'

interface TimeSeriesPoint {
	date: Date
	value: number
}

export class GoalService {
	startDate: Date
	dailyIncrement: number
	effectiveDailyIncrement: number
	workingDays: DayOfWeek[]
	manualDaysOff: Date[]

	constructor(plugin: TaskrPlugin) {
		this.startDate = parseISO(plugin.settings.TaskCompletionStartDate)
		this.dailyIncrement = plugin.settings.DailyBandwidth
		this.workingDays = plugin.settings.WorkingDays
		this.manualDaysOff = []

		this.effectiveDailyIncrement = this.dailyIncrement * (this.workingDays.length / 7)
	}

	getEffortDueAtDay = (day: Date) => {
		const weekday: DayOfWeek = format(day, 'EEEE').toLowerCase() as DayOfWeek
		const dayIsOff =
			!this.workingDays.includes(weekday) ||
			Boolean(this.manualDaysOff.find((dt: Date) => isSameDay(dt, day)))
		return dayIsOff ? 0 : this.dailyIncrement
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

	projectCompletionInDays = (deficit: number, completionRate: number) => {
		return Math.ceil(-deficit / Math.max(completionRate - this.dailyIncrement, 0))
	}

	getDaysToRelax = (surplus: number) => {
		return Math.floor(surplus / this.dailyIncrement)
	}
}
