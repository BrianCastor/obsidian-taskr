<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allTasksCache } from '../cache'
	import type { Task } from '../task'
	import Container from '../svelte/Container.svelte'
	import TaskList from '../svelte/TaskList.svelte'

	export let plugin: TaskrPlugin
	export let addBottomPadding: boolean = false

	let tasks: Task[] = []

	allTasksCache.subscribe((ts: Task[]) => {
		tasks = ts.filter((task: Task) => {
			return !task.complete
		})
	})
</script>

<Container {addBottomPadding}>
	<TaskList {tasks} {plugin} />
</Container>

<style>
</style>
