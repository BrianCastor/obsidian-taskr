<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { GoalService } from '../goalService'

	export let plugin: TaskrPlugin

	let daysUntilComplete: number = 0

	allTasksCache.subscribe((tasks: Task[]) => {
		const gs = new GoalService(plugin)
		daysUntilComplete = gs.projectCompletionInDays(tasks)
	})

	const color = 'cyan'
</script>

{#if isFinite(daysUntilComplete) && daysUntilComplete > 0}
	<div class="statistic-container">
		<span style={`font-weight:bold; font-size:36px; color:${color}`}>{daysUntilComplete}</span>
		<div style="flex-grow:1; padding-left:10px;">
			<span style="font-size:14px;white-space:nowrap"
				>{`Day${daysUntilComplete === 1 ? '' : 's'}`} Until</span
			>
			<br />
			<span style={`color:${color};white-space:nowrap`}> Break-Even </span>
		</div>
	</div>
{/if}

{#if daysUntilComplete < 0}
	<div class="statistic-container">
		<span style={`font-weight:bold; font-size:36px; color:rgb(0,255,0)`}
			>{-daysUntilComplete}</span
		>
		<div style="flex-grow:1; padding-left:10px;">
			<span style="font-size:14px">{`Day${-daysUntilComplete === 1 ? '' : 's'}`}</span>
			<br />
			<span style={`color:rgb(0,255,0)`}> To Relax </span>
		</div>
	</div>
{/if}

<style>
	.statistic-container {
		border-radius: 6px;
		display: flex;
		background-color: #141414;
		padding: 3px 10px;
		align-items: center;
	}
</style>
