<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allProjectsCache } from '../cache'
	import Container from '../svelte/Container.svelte'
	import type { Project } from '../project'
	import ProjectListItem from '../svelte/ProjectListItem.svelte'
	import { ProjectModal } from '../components/projectModal'

	export let plugin: TaskrPlugin

	let projects: Project[] = []

	const openNewProjectModal = () => {
		new ProjectModal(plugin.app, plugin).open()
	}

	allProjectsCache.subscribe((ps: Project[]) => {
		projects = ps.sort((a, b) => b.created_date.getTime() - a.created_date.getTime())
	})
</script>

<Container addBottomPadding>
	<div class="projects-container">
		{#each projects as project}
			<ProjectListItem {project} {plugin} />
		{/each}
		<div class="new-project-button" on:click={() => openNewProjectModal()}>
			<span style="font-size:40px">+</span>
			<span style="font-size:12px">Create new project</span>
		</div>
	</div>
</Container>

<style>
	.projects-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		grid-gap: 1rem;
	}

	.new-project-button {
		border-radius: 8px;
		background-color: black;
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		cursor: pointer;
		min-height: 120px;
	}

	.new-project-button:hover {
		box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.025);
		transition: 300ms;
	}
</style>
