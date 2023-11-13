<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { isToday } from 'date-fns'

	export let plugin: TaskrPlugin

	let hoursToCompleteToday: number = 0
	let hoursCompletedToday: number = 0

	allTasksCache.subscribe((tasks: Task[]) => {
		const tasksCompletedToday = tasks.filter((task: Task) => {
			return task.complete && task.completed_date && isToday(task.completed_date)
		})
		const tasksToCompleteToday = tasks.filter((task: Task) => {
			const date = task.completed_date ?? task.scheduled_date ?? task.due_date
			return (date && isToday(date)) || task.isOverdue()
		})

		hoursToCompleteToday =
			tasksToCompleteToday.reduce((accumulator: number, task: Task) => {
				return accumulator + (task.effort ?? 0)
			}, 0) / 60
		hoursCompletedToday =
			tasksCompletedToday.reduce((accumulator: number, task: Task) => {
				return accumulator + (task.effort ?? 0)
			}, 0) / 60
	})
</script>

<div style="width:100%;position:relative">
	<div
		style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;width:100%;font-size:12px"
	>
		<div>Today</div>
		<div>
			{Math.round(hoursCompletedToday * 10) / 10}/{hoursToCompleteToday} HR
		</div>
	</div>
	<div class="progress-bar-a-container">
		{#if hoursToCompleteToday > 0}
			<div
				class={`progress-bar-a ${
					hoursCompletedToday / (hoursToCompleteToday ?? 1) >= 1 &&
					'progress-bar-a-complete'
				}`}
				style={`width:${Math.min(
					(hoursCompletedToday / (hoursToCompleteToday ?? 1)) * 100,
					100
				)}%`}
			/>
		{/if}
	</div>
</div>

<style>
	.progress-bar-a-container {
		border-radius: 5px;
		background-color: rgb(50, 50, 50);
		height: 5px;
		width: 100%;
	}
	.progress-bar-a {
		border-radius: 5px;
		background-color: lightblue;
		transition: all 0.1s ease-out;
		height: 100%;
	}
	.progress-bar-a-complete {
		background-color: lightgreen !important;
	}
</style>
