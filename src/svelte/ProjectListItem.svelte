<script lang="ts">
	import { getLeaf } from '../utils'
	import { allTasksCache } from '../cache'
	import type TaskrPlugin from '../main'
	import type { Project } from '../project'
	import { TaskModal } from '../components/taskModal'

	export let plugin: TaskrPlugin
	export let project: Project

	$: hourTotals = project.getHourTotals($allTasksCache)
	$: totals = project.getTotals($allTasksCache)
	$: progress = hourTotals.complete / (hourTotals.total ?? 1)

	function navigateToProject() {
		const file = plugin.fileInterface.getProjectFileById(project.id)

		const leaf = getLeaf()
		leaf.openFile(file)
	}

	function createTaskForProject() {
		new TaskModal(plugin.app, plugin, { project: project }).open()
	}
</script>

<div class="project-container" on:click={() => navigateToProject()}>
	<div style="margin-bottom:5px;display:flex; align-items:center;justify-content:space-between">
		<div style="font-size:18px;">{project.icon} {project.title}</div>
		<div style="font-size:12px">{totals.complete}/{totals.total} tasks</div>
	</div>
	<div style="display:flex; align-items:start;justify-content:space-between">
		<div style="font-size:12px;color:grey">{project.category}</div>
	</div>

	<div
		style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"
	>
		<div />
		<button
			on:click={(e) => {
				e.stopPropagation()
				createTaskForProject()
			}}
			style="height:25px;width:25px">+</button
		>
	</div>

	<div class="progress-bar-a-container">
		{#if progress > 0}
			<div
				class={`progress-bar-a ${progress >= 1 && 'progress-bar-a-complete'}`}
				style={`width:${Math.min(progress * 100, 100)}%`}
			/>
		{/if}
	</div>
	<div
		style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;width:100%;font-size:12px"
	>
		<div>Progress</div>
		<div>
			{Math.round(hourTotals.complete)}/{Math.round(hourTotals.total)}
			hours
		</div>
	</div>
</div>

<style>
	.project-container {
		border-radius: 8px;
		background-color: rgb(30, 30, 30);
		width: 100%;
		padding: 12px;
		cursor: pointer;
	}
	.project-container:hover {
		box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.025);
		transition: 300ms;
	}

	.progress-bar-a-container {
		border-radius: 5px;
		background-color: rgb(50, 50, 50);
		height: 5px;
		width: 100%;
	}
	.progress-bar-a {
		border-radius: 5px;
		background-color: lightblue;
		transition: all 0.1s ease-out;
		height: 100%;
	}
	.progress-bar-a-complete {
		background-color: lightgreen !important;
	}
</style>
