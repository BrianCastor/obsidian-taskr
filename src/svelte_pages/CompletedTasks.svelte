<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allTasksCache } from '../cache'
	import type { Task } from '../task'
	import Container from '../svelte/Container.svelte'
	import TaskList from '../svelte/TaskList.svelte'
	import CompletionChart from '../svelte/CompletionChart.svelte'
	import ProgressOnSchedule from '../svelte/ProgressOnSchedule.svelte'
	import CompletionRate from '../svelte/CompletionRate.svelte'
	import BreakEven from '../svelte/BreakEven.svelte'

	export let plugin: TaskrPlugin
	export let addBottomPadding: boolean = false

	let tasks: Task[] = []

	allTasksCache.subscribe((ts: Task[]) => {
		tasks = ts.filter((task: Task) => {
			return task.complete
		})
	})
</script>

<Container {addBottomPadding}>
	<CompletionChart {plugin} />
	<div
		style="display:flex;column-gap:5px; row-gap:10px;overflow-x:scroll; margin-bottom: 10px;max-width:100vw"
	>
		<ProgressOnSchedule {plugin} timePeriod="all-time" />
		<BreakEven {plugin} />
		<CompletionRate {plugin} />
	</div>
	<TaskList {tasks} {plugin} descending={true} />
</Container>

<style>
</style>
