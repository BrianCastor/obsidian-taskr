<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { GoalService } from '../goalService'
	import { isFuture, isPast, isToday } from 'date-fns'
	import { formatDateRelativeToNow } from '../date_utils'

	export let plugin: TaskrPlugin

	let completionDate: Date | undefined = undefined
	let relaxUntil: Date | undefined = undefined

	allTasksCache.subscribe((tasks: Task[]) => {
		const gs = new GoalService(plugin.settings)
		completionDate = gs.projectCompletionDate(tasks)
		relaxUntil = gs.projectRelaxUntil(tasks)
	})

	const color = 'cyan'
</script>

{#if completionDate}
	<div class="statistic-container">
		<div style="flex-grow:1;">
			<span style="font-size:14px;white-space:nowrap">Break-Even</span>
			<br />
			<span style={`color:${color};white-space:nowrap`}
				>{formatDateRelativeToNow(completionDate)}</span
			>
		</div>
	</div>
{/if}

{#if relaxUntil}
	<div class="statistic-container">
		<div style="flex-grow:1">
			<span style="font-size:14px">Relax Until</span>
			<br />
			<span style={`color:rgb(0,255,0)`}>{formatDateRelativeToNow(relaxUntil)}</span>
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
