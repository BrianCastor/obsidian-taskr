<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allProjectsCache } from '../cache'
	import Container from '../svelte/Container.svelte'
	import type { Project } from '../project'
	import ProjectListItem from '../svelte/ProjectListItem.svelte'

	export let plugin: TaskrPlugin

	let projects: Project[] = []

	allProjectsCache.subscribe((ps: Project[]) => {
		projects = ps
	})

	$: {
	}
</script>

<Container>
	<div style="display:flex;row-gap:15px;flex-direction:column;">
		{#each projects as project}
			<ProjectListItem {project} {plugin} />
		{/each}
	</div>
</Container>

<style>
</style>
