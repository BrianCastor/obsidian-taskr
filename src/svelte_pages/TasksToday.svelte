<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allHabitsCache, allTasksCache } from '../cache'
	import type { Task } from '../task'
	import Container from '../svelte/Container.svelte'
	import { isToday } from 'date-fns'
	import WeeklyProgressRing from '../svelte/WeeklyProgressRing.svelte'
	import ProgressOnSchedule from '../svelte/ProgressOnSchedule.svelte'
	import { sortTasksByDate } from '../utils'
	import DayView from '../svelte/DayView.svelte'
	import type { Habit } from 'src/habit'
	import HabitListItem from '../svelte/HabitListItem.svelte'

	export let plugin: TaskrPlugin
	export let addBottomPadding: boolean = false

	let sections: string[] = []
	let groupings: Record<string, Task[]> = {}
	let habits: Habit[] = []

	allTasksCache.subscribe((ts: Task[]) => {
		const tasks = ts.filter((task: Task) => {
			if (
				task.isOverdue() ||
				(task.completed_date && isToday(task.completed_date)) ||
				(task.scheduled_date && isToday(task.scheduled_date)) ||
				(task.due_date && isToday(task.due_date) && !task.scheduled_date)
			) {
				return true
			}
			return false
		})

		groupings = sortTasksByDate(tasks.slice(), false).reduce((accum: any, task: Task) => {
			let key
			if (task.complete) key = 'Completed'
			else if (task.isOverdue()) key = 'Overdue'
			else if (task.scheduled_date) key = 'Scheduled'
			else if (task.due_date) key = 'Due'
			else key = 'Unscheduled'

			accum[key] = (accum[key] || []).concat(task)
			return accum
		}, {})
		sections = ['Overdue', 'Scheduled', 'Due', 'Unscheduled', 'Completed'].filter((s) =>
			Object.keys(groupings).includes(s)
		)

		if (sections.includes('Completed')) {
			groupings['Completed'] = sortTasksByDate(groupings['Completed'], true)
		}
	})

	allHabitsCache.subscribe((hs: Habit[]) => {
		habits = hs
			.filter((h) => {
				return h.getDueCurrentPeriod() > 0
			})
			.sort((a, b) => a.title.localeCompare(b.title))
	})
</script>

<Container {addBottomPadding}>
	<div style="display:flex;column-gap:10px; row-gap:10px;overflow-x:scroll;margin-bottom:10px">
		<WeeklyProgressRing {plugin} />
		<ProgressOnSchedule {plugin} />
	</div>

	<!--{#if !["Overdue", "Scheduled", "Due"].some(s => sections.includes(s))}
        <span>Day complete. Schedule more?</span>
    {/if}-->

	{#each sections as section}
		<DayView {plugin} dayLabel={section} tasks={groupings[section]} />
	{/each}

	{#if sections.length === 0}
		<em style="font-size:12px;color:grey;text-align:center">No tasks to display</em>
	{/if}

	<div style="margin-bottom:10px;margin-top:15px">Habits</div>
	<div style="display:flex;flex-direction:column;row-gap:12px;">
		{#each habits as habit}
			<div>
				<HabitListItem {habit} {plugin} />
			</div>
		{/each}
	</div>
</Container>

<style>
</style>
