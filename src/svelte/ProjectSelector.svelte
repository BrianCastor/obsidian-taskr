<script lang="ts">
	import type { Project } from '../project'
	import { allProjectsCache } from '../cache'
	import { showDropdownMenu, type DropdownMenuOption } from '../components/DropdownMenu'

	export let project: Project | undefined
	export let setProject: (project: Project | undefined) => void
	export let size: 'small' | 'large' = 'small'
	export let hideText: boolean | undefined = false

	let container: HTMLDivElement
	let options: DropdownMenuOption[] = [
		...$allProjectsCache.map((opt: Project) => {
			return {
				label: `${opt.icon} ${opt.title}`,
				onClick: () => setProject(opt)
			}
		}),
		{
			label: 'Remove',
			onClick: () => setProject(undefined)
		}
	]

	function getColor(proj: Project | undefined) {
		if (!proj) return 'grey'

		return 'white'
	}
</script>

<div
	class={`chip-container ${size}`}
	style={`color:${getColor(project)}`}
	bind:this={container}
	on:click|stopPropagation={() => showDropdownMenu(options, container)}
>
	<div>
		{#if project}
			{#if hideText && project.title && project.title.length > 0}
				{project.icon ?? project.title[0]}
			{:else}
				{project.icon} {project.title}
			{/if}
		{:else}
			<em>Project</em>
		{/if}
	</div>
</div>

<style>
	.chip-container {
		background-color: rgb(52, 52, 52);
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 10px;
		padding: 0px 5px;
		cursor: pointer;
		font-size: 14px;
	}
	.chip-container.small {
		font-size: 13px;
	}
	.chip-container.large {
		padding: 5px 10px;
		font-size: 14px;
	}
</style>
