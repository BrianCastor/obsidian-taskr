<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import DayView from './DayView.svelte'
	import { sortTasksByDate } from '../utils'
	import { formatDateRelativeToNow } from '../date_utils'

	export let plugin: TaskrPlugin
	export let tasks: Task[]
	export let descending: boolean = false

	let groupings: any = {}
	let sections: string[] = []

	$: {
		groupings = sortTasksByDate(tasks.slice(), descending).reduce((accum: any, task: Task) => {
			const dt = task.completed_date || task.scheduled_date || task.due_date

			let relativeDateStr = dt ? formatDateRelativeToNow(dt) : 'Unscheduled'

			if (!task.complete && task.isOverdue()) {
				relativeDateStr = 'Overdue'
			}

			accum[relativeDateStr] = (accum[relativeDateStr] || []).concat([task])
			return accum
		}, {})
		sections = Object.keys(groupings)
	}
</script>

{#each sections as section (section)}
	<DayView {plugin} dayLabel={section} tasks={groupings[section]} />
{/each}

{#if Object.keys(groupings).length === 0}
	<em style="font-size:12px;color:grey;text-align:center">No tasks to display</em>
{/if}

<style>
</style>
