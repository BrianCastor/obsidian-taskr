<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { GoalService } from '../goalService'
	import { differenceInDays } from 'date-fns'

	export let plugin: TaskrPlugin

	let daysToRelax: number = 0

	allTasksCache.subscribe((tasks: Task[]) => {
		const gs = new GoalService(plugin.settings)
		const relaxUntilDate = gs.projectRelaxUntil(tasks)
		daysToRelax = differenceInDays(relaxUntilDate ?? new Date(), new Date())
	})
</script>

<div style="text-align:center;">
	<div style="font-size:18px;font-weight:bold">
		{daysToRelax}
		{#if daysToRelax > 0}
			🌴
		{/if}
	</div>
	<div style="font-size:10px;">{daysToRelax === 1 ? 'Day to Relax' : 'Days to Relax'}</div>
</div>
