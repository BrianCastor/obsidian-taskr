<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { isThisWeek } from 'date-fns'
	import { GoalService } from '../goalService'

	export let plugin: TaskrPlugin

	let tasksCompletedThisWeek: Task[] = []

	allTasksCache.subscribe((tasks: Task[]) => {
		tasksCompletedThisWeek = tasks.filter((task: Task) => {
			return (
				task.complete &&
				task.completed_date &&
				isThisWeek(task.completed_date, { weekStartsOn: 1 })
			)
		})
	})

	const hoursToCompleteThisWeek = new GoalService(plugin.settings).hoursToCompleteThisWeek()

	$: hoursCompletedThisWeek =
		tasksCompletedThisWeek.reduce((accumulator: number, task: Task) => {
			return accumulator + (task.effort ?? 0)
		}, 0) / 60
	$: percentComplete = hoursCompletedThisWeek / hoursToCompleteThisWeek
</script>

<div style="width:100%;position:relative">
	<div
		style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;width:100%;font-size:12px"
	>
		<div>Weekly Goal</div>
		<div>
			{Math.round(hoursCompletedThisWeek * 10) / 10}/{hoursToCompleteThisWeek} HR
		</div>
	</div>
	<div class="progress-bar-a-container">
		<div
			class={`progress-bar-a ${percentComplete >= 1 && 'progress-bar-a-complete'}`}
			style={`width:${Math.min(percentComplete * 100, 100)}%`}
		/>
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
