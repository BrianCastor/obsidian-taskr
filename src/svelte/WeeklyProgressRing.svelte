<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { isThisWeek } from 'date-fns'
	import ProgressRing from './ProgressRing.svelte'
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

<div class="statistic-container">
	<ProgressRing progress={percentComplete} color="cyan" />
	<div style="flex-grow:1; padding-left:10px;">
		<span style="font-size:14px;white-space:nowrap">Weekly Progress</span>
		<br />
		<span style="color:cyan;font-weight:bold;white-space:nowrap"
			>{Math.round(hoursCompletedThisWeek * 10) / 10}/{hoursToCompleteThisWeek} HR</span
		>
	</div>
</div>

<style>
	.statistic-container {
		border-radius: 6px;
		display: flex;
		background-color: #141414;
		max-width: 178px;
		padding: 3px 10px;
		align-items: center;
	}
</style>
