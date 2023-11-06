/*import { test, jest, beforeAll } from '@jest/globals'
import { Task, type ITask } from '../task'
import { isAfter, isBefore, startOfDay } from 'date-fns'
import { RRule, datetime } from 'rrule'
import { Habit } from 'src/habit'
import type { ISettings } from 'src/settings'

let settings: ISettings

beforeAll(() => {
	jest.useFakeTimers().setSystemTime(date('2023-10-23'))
	settings = {
		TasksDir: 'tasks',
		ProjectsDir: 'projects',
		PeopleDir: 'people',
		HabitsDir: 'habits',
		TaskCompletionStartDate: date('2023-10-20'),
		DailyBandwidth: 2,
		WorkingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'sunday'],
		ExemptDays: [date('2023-10-20')]
	}
})

const date = (dateStr: string) => {
	const parts = dateStr.split('-')
	const dt = startOfDay(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
	return dt
}

const habitFactory = (params: Partial<Habit>) => {
	//@ts-expect-error
	return new Habit({
		...params,
		id: params.id ?? `task-${Math.round(Math.random() * 1000)}`,
		title: params.title ?? 'Test task',
		quantity: 1,
	})
}*/
