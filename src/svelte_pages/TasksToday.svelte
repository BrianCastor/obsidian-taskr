<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allHabitsCache, allTasksCache } from '../cache'
	import type { Task } from '../task'
	import Container from '../svelte/Container.svelte'
	import { format, isFuture, isPast, isSameDay, isToday } from 'date-fns'
	import ProgressOnSchedule from '../svelte/ProgressOnSchedule.svelte'
	import { navigateToTaskPage, sortTasksByDate } from '../utils'
	import type { Habit } from 'src/habit'
	import HabitListItem from '../svelte/HabitListItem.svelte'
	import { onMount } from 'svelte'
	import TaskListItem from '../svelte/TaskListItem.svelte'
	import { GoalService } from '../goalService'
	import Complete from '../assets/complete.svelte'
	import Icon from '../svelte/Icon.svelte'
	import NotFoundIllustration from '../assets/not-found-illustration.svelte'
	import DateScroller from '../svelte/DateScroller.svelte'
	import CompletionSparklineChart from '../svelte/CompletionSparklineChart.svelte'
	import WeeklyProgressBar from '../svelte/WeeklyProgressBar.svelte'
	import DailyProgressBar from '../svelte/DailyProgressBar.svelte'
	import DaysToRelaxStat from '../svelte/DaysToRelaxStat.svelte'
	import { TASK_LIST_TYPES } from '../components/taskListView'

	export let plugin: TaskrPlugin
	export let addBottomPadding: boolean = false

	let selectedDate = new Date()
	let habits: Habit[] = []
	let allHabits: Habit[] = []
	let allTasks: Task[] = []
	let tasks: Task[] = []
	let showComplete = false
	let showAddMore = false

	let showCompletedTasks = false

	allTasksCache.subscribe((ts: Task[]) => {
		allTasks = ts
	})

	$: {
		// Edit page header
		const header = document.querySelector('.mod-active .view-header-title')
		if (header) header.innerHTML = format(selectedDate, 'EEEE, MMMM dd')
	}

	$: {
		showCompletedTasks = isPast(selectedDate) && !isToday(selectedDate)
	}

	$: {
		const tempTasks = allTasks.filter((task: Task) => {
			if (
				task.isOverDueForDate(selectedDate) ||
				(task.completed_date && isSameDay(selectedDate, task.completed_date)) ||
				(task.scheduled_date && isSameDay(selectedDate, task.scheduled_date)) ||
				(task.due_date && isSameDay(selectedDate, task.due_date) && !task.scheduled_date)
			) {
				return true
			}
			return false
		})
		tasks = sortTasksByDate(tempTasks.slice(), false)
	}

	$: habits = allHabits.filter((h) => {
		return h.getDueAtPeriodForDate(selectedDate) > 0
	})
	$: {
		const dueToday = new GoalService(plugin.settings).getEffortDueAtDay(selectedDate)
		const completedToday =
			tasks
				.filter((t) => t.complete)
				.map((t) => t.effort)
				.reduce((a, b) => {
					return (a ?? 0) + (b ?? 0)
				}, 0) ?? 0
		showComplete = tasks.every((t) => t.complete) && completedToday >= dueToday * 60
	}

	$: {
		const dueToday = new GoalService(plugin.settings).getEffortDueAtDay(selectedDate)
		const scheduledOrCompletedToday =
			tasks
				.map((t) => t.effort)
				.reduce((a, b) => {
					return (a ?? 0) + (b ?? 0)
				}, 0) ?? 0
		showAddMore =
			scheduledOrCompletedToday < dueToday * 60 &&
			(isToday(selectedDate) || isFuture(selectedDate))
	}

	allHabitsCache.subscribe((hs: Habit[]) => {
		allHabits = hs.sort((a, b) => a.title.localeCompare(b.title))
	})

	onMount(() => {
		setTimeout(() => {
			const header = document.querySelector('.mod-active .view-header-title')
			if (header) header.innerHTML = format(selectedDate, 'EEEE, MMMM dd')
		}, 5)
	})
</script>

{#key selectedDate}
	<div>
		<Container {addBottomPadding}>
			<div style="display:flex;column-gap:20px;row-gap:10px;margin-bottom:10px;">
				<div style="display:flex; flex-direction:column; max-width:120px;width:120px">
					<div
						style="height:90px;width:120px;overflow:none;cursor:pointer"
						on:click={() => navigateToTaskPage(TASK_LIST_TYPES.completed)}
					>
						<CompletionSparklineChart {plugin} />
					</div>
				</div>
				<div
					style="flex-grow:1;max-width:300px;display:flex;flex-direction:column;row-gap:10px;"
				>
					<DailyProgressBar {plugin} />
					<WeeklyProgressBar {plugin} />

					<div
						style="display:flex;column-gap:10px;row-gap:10px;justify-content:space-evenly"
					>
						<ProgressOnSchedule {plugin} displayAs="statistic" timePeriod="all-time" />
						<DaysToRelaxStat {plugin} />
					</div>
				</div>
			</div>

			<div style="margin-bottom:10px;">Tasks</div>
			<div style="margin-left:10px;display:grid;grid-row-gap:12px;padding-bottom:8px;">
				{#each tasks as task}
					{#if !showCompletedTasks && !task.complete}
						<TaskListItem {task} {plugin} />
					{/if}
					{#if showCompletedTasks && task.complete}
						<TaskListItem {task} {plugin} />
					{/if}
				{/each}
				{#if showAddMore}
					<div style="display:flex;column-gap:15px;align-items:center">
						<Icon name="alert-circle" color="orange" />
						<div style="display:flex;flex-direction:column;row-gap:5px">
							<div>Schedule more tasks to complete your daily goal.</div>
							<div style="display:flex; column-gap:10px">
								<button style="height:25px">Autoschedule</button>
								<button style="height:25px">Find More</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
			{#if !showCompletedTasks}
				{#if showComplete}
					<div
						style="width:100%;display:flex; align-items:center; row-gap:10px;flex-direction:column"
					>
						<Complete />
						<div style="max-width:300px;font-size:13px;text-align:center">
							All tasks complete and goal met -- time to relax!
						</div>
					</div>
				{/if}
			{/if}

			{#if tasks.filter((t) => t.complete).length > 0 && !showCompletedTasks}
				<div style="width:100%;display:flex; justify-content:center; margin-top:10px;">
					<button style="height:30px" on:click={() => (showCompletedTasks = true)}
						>Show Completed Tasks</button
					>
				</div>
			{/if}
			{#if showCompletedTasks && isToday(selectedDate)}
				<div style="width:100%;display:flex;  justify-content:center; margin-top:10px;">
					<button style="height:30px" on:click={() => (showCompletedTasks = false)}
						>Show Scheduled Tasks</button
					>
				</div>
			{/if}

			{#if !tasks.length && !showAddMore && !showComplete}
				<div
					style="width:100%;max-width:100%;display:flex; align-items:center; row-gap:10px;flex-direction:column"
				>
					<NotFoundIllustration />
					<div>No tasks found.</div>
				</div>
			{/if}

			<div style="margin-bottom:10px;margin-top:15px">Habits</div>
			<div style="display:flex;flex-direction:column;row-gap:12px;">
				{#each habits as habit}
					<HabitListItem {habit} {plugin} viewForDate={selectedDate} />
				{/each}
			</div>
			{#if !habits.length}
				<div
					style="width:100%;max-width:100%;display:flex; align-items:center; row-gap:14px;flex-direction:column"
				>
					<NotFoundIllustration />
					<div>No habits found.</div>
				</div>
			{/if}
			<div style="height:50px;width:100%;" />
		</Container>
	</div>
{/key}
<DateScroller {selectedDate} onSelectDate={(dt) => (selectedDate = dt)} />

<style></style>
