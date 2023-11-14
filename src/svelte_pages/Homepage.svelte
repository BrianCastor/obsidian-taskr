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
	import CelebrateIllustration from '../assets/celebrate-illustration.svelte'

	export let plugin: TaskrPlugin
	export let addBottomPadding: boolean = false

	let selectedDate = new Date()
	let habits: Habit[] = []
	let allHabits: Habit[] = []
	let allTasks: Task[] = []
	let tasks: Task[] = []
	let showAllTasksCompleted = false
	let showAllHabitsCompleted = false
	let showAddMore = false
	let showRescheduleOverdue = false
	let showCompletedItems = false

	allTasksCache.subscribe((ts: Task[]) => {
		allTasks = ts
	})

	const rescheduleOverdueToCurrentDay = () => {
		tasks
			.filter((t) => t.isOverDueForDate(selectedDate))
			.map((t) => {
				t.scheduled_date = selectedDate
				plugin.fileInterface.createUpdateTask(t)
			})
	}

	$: {
		showRescheduleOverdue = tasks.some((t) => t.isOverDueForDate(selectedDate))
	}

	$: {
		// Edit page header
		const header = document.querySelector('.mod-active .view-header-title')
		if (header) header.innerHTML = format(selectedDate, 'EEEE, MMMM dd')
	}

	$: {
		showCompletedItems = isPast(selectedDate) && !isToday(selectedDate)
	}

	$: {
		showAllHabitsCompleted =
			!showCompletedItems && habits.every((h) => h.isCompleteForPeriodOfDate(selectedDate))
	}

	$: {
		const tempTasks = allTasks.filter((task: Task) => {
			const taskDt = task.completed_date ?? task.scheduled_date ?? task.due_date
			return (
				task.isOverDueForDate(selectedDate) || (taskDt && isSameDay(selectedDate, taskDt))
			)
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
		showAllTasksCompleted =
			tasks.every((t) => t.complete) && completedToday >= dueToday * 60 && !showCompletedItems
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
			<div
				style="display:flex;column-gap:15px;row-gap:10px;margin-bottom:15px;justify-content:center"
			>
				<div style="display:flex; flex-direction:column; max-width:100px;width:100px">
					<div
						style="height:90px;width:100px;overflow:none;cursor:pointer"
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

					<div style="display:flex;column-gap:20px;row-gap:10px;">
						<ProgressOnSchedule {plugin} displayAs="statistic" timePeriod="all-time" />
						<DaysToRelaxStat {plugin} />
					</div>
				</div>
			</div>

			<div
				style="display:flex;column-gap:10px; margin-bottom:25px;align-items:center;justify-content:space-between"
			>
				<div style="display:flex;column-gap:10px">
					<div
						class={`filter-toggle ${showCompletedItems && 'selected'}`}
						on:click={() => (showCompletedItems = true)}
					>
						<span>All</span>
						<span class="caption">{tasks.length + habits.length}</span>
					</div>
					<div
						class={`filter-toggle ${!showCompletedItems && 'selected'}`}
						on:click={() => (showCompletedItems = false)}
					>
						<span>To do</span>
						<span class="caption"
							>{tasks.filter((t) => !t.complete).length +
								habits.filter((h) => !h.isCompleteForPeriodOfDate(selectedDate))
									.length}</span
						>
					</div>
				</div>
				<div>
					{#if showRescheduleOverdue}
						<button
							on:click|stopPropagation={() => rescheduleOverdueToCurrentDay()}
							class="move-overdue-button"
						>
							Move overdue to today
						</button>
					{/if}
				</div>
			</div>

			<div style="display:grid;grid-row-gap:12px;">
				{#each tasks as task}
					{#if !task.complete}
						<TaskListItem {task} {plugin} viewForDate={selectedDate} />
					{/if}
					{#if showCompletedItems && task.complete}
						<TaskListItem {task} {plugin} viewForDate={selectedDate} />
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
			{#if showAllTasksCompleted}
				<div
					style="width:100%;display:flex; align-items:center; row-gap:10px;flex-direction:column"
				>
					<Complete />
					<div style="max-width:300px;font-size:13px;text-align:center">
						All tasks complete and goal met -- time to relax!
					</div>
				</div>
			{/if}

			{#if !tasks.length && !showAddMore && !showAllTasksCompleted}
				<div
					style="width:100%;max-width:100%;display:flex; align-items:center; row-gap:10px;flex-direction:column"
				>
					<NotFoundIllustration />
					<div>No tasks found.</div>
				</div>
			{/if}

			<div style="width:100%;display:flex;justify-content:center">
				<hr style="width:35%;margin-top:20px;margin-bottom:20px" />
			</div>
			<div style="display:flex;flex-direction:column;row-gap:12px;">
				{#each habits as habit}
					{#if showCompletedItems}
						<div>
							<HabitListItem {habit} {plugin} viewForDate={selectedDate} />
						</div>
					{/if}
					{#if !showCompletedItems && !habit.isCompleteForPeriodOfDate(selectedDate)}
						<div>
							<HabitListItem {habit} {plugin} viewForDate={selectedDate} />
						</div>
					{/if}
				{/each}
			</div>
			{#if showAllHabitsCompleted}
				<div
					style="width:100%;max-width:100%;display:flex; align-items:center; row-gap:14px;flex-direction:column"
				>
					<CelebrateIllustration />
					<div>All habits completed! Nice work.</div>
				</div>
			{/if}
			{#if !habits.length}
				<div
					style="width:100%;max-width:100%;display:flex; align-items:center; row-gap:14px;flex-direction:column"
				>
					<NotFoundIllustration />
					<div>No habits found.</div>
				</div>
			{/if}
			<div style="height:150px;width:100%;" />
		</Container>
	</div>
{/key}
<DateScroller {selectedDate} onSelectDate={(dt) => (selectedDate = dt)} />

<style>
	.move-overdue-button {
		height: 22px;
		font-size: 11px;
		text-transform: uppercase;
		background-color: none;
		border: none;
		border-radius: 2px;
		color: rgb(26, 213, 213);
		width: auto !important;
	}

	.filter-toggle {
		border-radius: 8px;
		background-color: rgb(50, 50, 50);
		padding: 5px 10px;
		display: flex;
		column-gap: 10px;
		align-items: center;
		cursor: pointer;
		vertical-align: middle;
	}
	.filter-toggle:hover {
		box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
		transition: 300ms;
	}

	.filter-toggle > span.caption {
		font-size: 12px;
		font-weight: bold;
	}

	:global(.filter-toggle.selected) {
		background-color: var(--interactive-accent) !important;
		color: var(--text-on-accent) !important;
	}
</style>
