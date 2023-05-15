import { GoalService } from '../goalService'
import { expect, test, jest, beforeAll } from '@jest/globals'
import { Task, type ITask } from '../task'
import type { ISettings } from '../settings'
import { startOfDay } from 'date-fns'

let tasks: Task[] = []
let settings: ISettings

const date = (dateStr: string) => {
	const parts = dateStr.split('-')
	const dt = startOfDay(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
	return dt
}

beforeAll(() => {
	jest.useFakeTimers().setSystemTime(date('2023-01-08'))

	settings = {
		TasksDir: 'tasks',
		ProjectsDir: 'projects',
		PeopleDir: 'people',
		TaskCompletionStartDate: date('2023-01-01'),
		DailyBandwidth: 2,
		WorkingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'sunday'],
		ExemptDays: [date('2023-01-03')]
	}

	tasks = [
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-03'),
			effort: 60
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-04'),
			effort: 60
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-05'),
			effort: 60 * 4
		})
	]
})

const taskFactory = (params: Partial<ITask>) => {
	return new Task({
		...params,
		id: params.id ?? `task-${Math.round(Math.random() * 1000)}`,
		title: params.title ?? 'Test task',
		complete: !!params.complete
	})
}

test('Total completed', () => {
	const goalService = new GoalService(settings)
	expect(goalService.getTotalHoursCompleted(tasks)).toBe(7)
	expect(goalService.hoursToCompleteTotal()).toBe(12)
})

test('Days off', () => {
	const goalService = new GoalService(settings)
	goalService.exemptDays = [date('2023-01-03'), date('2023-01-28')]
	expect(goalService.isDayOff(date('2023-01-21'))).toBe(true)
	expect(goalService.getEffortDueToday()).toBe(2)
	expect(goalService.isDayOff(date('2023-01-28'))).toBe(true)
	expect(goalService.isDayOff(date('2023-01-29'))).toBe(false)
})

test('Less than complete and not fast enough completion rate', () => {
	const goalService = new GoalService(settings)
	expect(goalService.getCompletionRatePerBusinessDay(tasks)).toBe(1.2)
	const deficitHours =
		goalService.getTotalHoursCompleted(tasks) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(-5)
	expect(goalService.projectRelaxUntil(tasks)).toBe(undefined)
	expect(goalService.projectCompletionDate(tasks)).toBe(undefined) // Completion Rate/Bus Day is 1, so we'll never complete (because our goal/day si 2)
})

test('Normal relax days', () => {
	//8: today; 9: 1; 10: -1
	const goalService = new GoalService(settings)
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		})
	]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(3)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-10'))
	}
})

test('Relax days at 0', () => {
	//8: today; 9: -2;
	const goalService = new GoalService(settings)
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 5
		})
	]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(0)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-09'))
	}
})

test('Relax days off at end', () => {
	const goalService = new GoalService(settings)
	//8: today; 9: -2; 10: off; 11: -2
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 7
		})
	]
	goalService.exemptDays = [date('2023-01-10'), date('2023-01-03')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(2)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-11'))
	}
})

test('Relax days with exempt day for today', () => {
	const goalService = new GoalService(settings)
	//8: off; 9: 3; 10: 1; 11: -1
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		})
	]
	goalService.exemptDays = [date('2023-01-08'), date('2023-01-03')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(5)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-11'))
	}
})

test('Relax days with exempt day for today and exempt day at end', () => {
	//8: off; 9: 3; 10: 1; 11: off; 12: -1
	const goalService = new GoalService(settings)
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		})
	]
	goalService.exemptDays = [date('2023-01-08'), date('2023-01-11'), date('2023-01-03')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(5)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-12'))
	}
})

test('Relax days with saturday', () => {
	//8: off; 9: 3; 10: 1; 11: off; 12: -1
	const goalService = new GoalService(settings)
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 8
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 8
		})
	]
	goalService.exemptDays = [date('2023-01-03')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(11)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-15'))
	}
})

test('Relax days with saturday and exempt day at end', () => {
	//8: off; 9: 3; 10: 1; 11: off; 12: -1
	const goalService = new GoalService(settings)
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 8
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 8
		})
	]
	goalService.exemptDays = [date('2023-01-03'), date('2023-01-15')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(11)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-16'))
	}
})

test('Relax days with exempt day for today and exempt day at end', () => {
	//8: off; 9: 3; 10: 1; 11: off; 12: -1
	const goalService = new GoalService(settings)
	const tasksNew = [
		...tasks,
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		}),
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 4
		})
	]
	goalService.exemptDays = [date('2023-01-08'), date('2023-01-11'), date('2023-01-03')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(5)
	const relaxUntil = goalService.projectRelaxUntil(tasksNew)
	expect(relaxUntil).toBeDefined()
	if (relaxUntil) {
		expect(relaxUntil).toStrictEqual(date('2023-01-12'))
	}
})

test('Not fast enough completion, will never complete at current rate', () => {
	const goalService = new GoalService(settings)
	const tasksNew = [...tasks]
	goalService.exemptDays = [date('2023-01-03')]
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(-5)
	expect(goalService.getCompletionRatePerBusinessDay(tasks)).toBe(1.2)
	const breakEvenDate = goalService.projectCompletionDate(tasks)
	expect(breakEvenDate).toBeUndefined()
})

test('Normal Completion', () => {
	const goalService = new GoalService(settings)
	const tasksNew = [
		'2023-01-08',
		'2023-01-07',
		'2023-01-06',
		'2023-01-06',
		'2023-01-05',
		'2023-01-05'
	].map((dt) => {
		return taskFactory({
			complete: true,
			completed_date: date(dt),
			effort: 60 * 3
		})
	})

	goalService.exemptDays = []
	goalService.startDate = date('2022-12-25')
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(-8)
	expect(goalService.getCompletionRatePerBusinessDay(tasksNew)).toBe(3)
	const breakEvenDate = goalService.projectCompletionDate(tasksNew)
	expect(breakEvenDate).toStrictEqual(date('2023-01-17'))
})

test('Normal Completion2', () => {
	const goalService = new GoalService(settings)
	const tasksNew = [
		'2023-01-08',
		'2023-01-07',
		'2023-01-06',
		'2023-01-06',
		'2023-01-05',
		'2023-01-05'
	].map((dt) => {
		return taskFactory({
			complete: true,
			completed_date: date(dt),
			effort: 60 * 4
		})
	})
	tasksNew.push(
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 1
		})
	)

	goalService.exemptDays = []
	goalService.startDate = date('2022-12-25')
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(-1)
	expect(goalService.getCompletionRatePerBusinessDay(tasksNew)).toBe(4)
	const breakEvenDate = goalService.projectCompletionDate(tasksNew)
	expect(breakEvenDate).toStrictEqual(date('2023-01-09'))
})

test('Completion with end day as break', () => {
	const goalService = new GoalService(settings)
	const tasksNew = [
		'2023-01-08',
		'2023-01-07',
		'2023-01-06',
		'2023-01-06',
		'2023-01-05',
		'2023-01-05'
	].map((dt) => {
		return taskFactory({
			complete: true,
			completed_date: date(dt),
			effort: 60 * 4
		})
	})
	tasksNew.push(
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 1
		})
	)

	goalService.exemptDays = [date('2023-01-09')]
	goalService.startDate = date('2022-12-25')
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(-1)
	expect(goalService.getCompletionRatePerBusinessDay(tasksNew)).toBe(4)
	const breakEvenDate = goalService.projectCompletionDate(tasksNew)
	expect(breakEvenDate).toStrictEqual(date('2023-01-10'))
})

test('Completion at 0', () => {
	const goalService = new GoalService(settings)
	const tasksNew = [
		'2023-01-08',
		'2023-01-07',
		'2023-01-06',
		'2023-01-06',
		'2023-01-05',
		'2023-01-05'
	].map((dt) => {
		return taskFactory({
			complete: true,
			completed_date: date(dt),
			effort: 60 * 4
		})
	})
	tasksNew.push(
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 2
		})
	)

	goalService.exemptDays = [date('2023-01-09')]
	goalService.startDate = date('2022-12-25')
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(0)
	expect(goalService.getCompletionRatePerBusinessDay(tasksNew)).toBe(4)
	const breakEvenDate = goalService.projectCompletionDate(tasksNew)
	expect(breakEvenDate).toStrictEqual(date('2023-01-08')) //Today
})

test('Completion - exempt today', () => {
	const goalService = new GoalService(settings)
	const tasksNew = ['2023-01-08', '2023-01-07', '2023-01-06', '2023-01-06', '2023-01-05'].map(
		(dt) => {
			return taskFactory({
				complete: true,
				completed_date: date(dt),
				effort: 60 * 4
			})
		}
	)
	tasksNew.push(
		taskFactory({
			complete: true,
			completed_date: date('2023-01-01'),
			effort: 60 * 1
		})
	)

	goalService.exemptDays = [date('2023-01-08')]
	goalService.startDate = date('2022-12-25')
	const deficitHours =
		goalService.getTotalHoursCompleted(tasksNew) - goalService.hoursToCompleteTotal()
	expect(deficitHours).toBe(-3)
	expect(goalService.getCompletionRatePerBusinessDay(tasksNew)).toBe(4)
	const breakEvenDate = goalService.projectCompletionDate(tasksNew)
	expect(breakEvenDate).toStrictEqual(date('2023-01-10'))
})
