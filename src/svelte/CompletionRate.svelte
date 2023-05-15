<script lang="ts">
	import { isAfter, startOfDay, subDays } from 'date-fns'
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { GoalService } from '../goalService'

	export let plugin: TaskrPlugin

	let completionRate: number = 0

	allTasksCache.subscribe((tasks: Task[]) => {
		const gs = new GoalService(plugin)
		completionRate = gs.getCompletionRatePerBusinessDay(tasks)
	})

	$: color = completionRate > new GoalService(plugin).dailyIncrement ? 'rgb(0,255,0)' : 'white'
</script>

<div class="statistic-container">
	<span style={`font-weight:bold; font-size:36px; color:${color};white-space:nowrap`}
		>{Math.abs(Math.round(completionRate * 10) / 10)}</span
	>
	<div style="flex-grow:1; padding-left:10px;">
		<span style="font-size:14px;white-space:nowrap">HR/Workday</span>
		<br />
		<span style={`white-space:nowrap;color:${color}`}> Completed </span>
	</div>
</div>

<style>
	.statistic-container {
		border-radius: 6px;
		display: flex;
		background-color: #141414;
		padding: 3px 10px;
		align-items: center;
	}
</style>
