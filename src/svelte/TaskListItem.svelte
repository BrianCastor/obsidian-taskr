<script lang="ts">
	import type { Task } from '../task'
	import type TaskrPlugin from '../main'
	import DateChip from './DateChip.svelte'
	import LoeChip from './LOE_Chip.svelte'
	import Checkbox from './Checkbox.svelte'
	import ProjectSelector from './ProjectSelector.svelte'
	import { getLeaf } from '../utils'
	import Icon from './Icon.svelte'

	export let plugin: TaskrPlugin
	export let task: Task
	export let onNavigateAway: (() => void) | undefined = undefined
	export let viewForDate: Date = new Date()

	let expanded: boolean = false
	let showDeleteConfirm: boolean = false

	function onToggleTaskComplete() {
		task.complete = !task.complete
		if (task.complete) {
			task.completed_date = new Date()
		} else {
			task.completed_date = undefined
		}
		plugin.fileInterface.createUpdateTask(task)
	}

	function onSetDueDate(dt: Date | undefined) {
		task.due_date = dt
		plugin.fileInterface.createUpdateTask(task)
	}

	function onSetScheduledDate(dt: Date | undefined) {
		task.scheduled_date = dt
		plugin.fileInterface.createUpdateTask(task)
	}

	function onSetCompletedDate(dt: Date | undefined) {
		task.completed_date = dt
		plugin.fileInterface.createUpdateTask(task)
		return
	}

	function onSetProject(project: string | undefined) {
		task.project = project
		plugin.fileInterface.createUpdateTask(task)
	}

	function onSetEffort(effort: number | undefined) {
		task.effort = effort
		plugin.fileInterface.createUpdateTask(task)
	}

	function navigateToTask() {
		if (!task.id) {
			return
		}

		if (onNavigateAway) onNavigateAway()
		const file = plugin.fileInterface.getTaskFileById(task.id)

		const leaf = getLeaf()
		leaf.openFile(file)
	}

	function onDelete() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true
			return
		}

		if (showDeleteConfirm) {
			plugin.fileInterface.deleteTask(task)
			showDeleteConfirm = false
			return
		}
	}

	function onClickTaskContainer(evt: MouseEvent) {
		evt.stopPropagation()
		evt.preventDefault()
	}
</script>

<div style={!task.scheduled_date ? 'color:grey !important' : ''} class="task-container">
	<li on:contextmenu={onClickTaskContainer} style="margin-bottom:5px">
		<div class="containerDiv" on:click={() => (expanded = !expanded)}>
			<div style="margin-right:12px;display:flex;align-items:center;">
				<Checkbox checked={task.complete} onChange={() => onToggleTaskComplete()} />
			</div>
			<div style="display:block;flex-grow:1">
				<div style="display:flex; alignItems:center;flex-wrap:wrap;row-gap:10px;">
					<div
						on:click|stopPropagation={() => navigateToTask()}
						class={task.complete ? 'containerLi completed' : 'containerLi'}
						style="text-decoration:none;"
					>
						{#if task.isOverDueForDate(viewForDate)}
							❗
						{/if}
						{task.title}
					</div>
					{#if task.contentLength && task.contentLength > 0}
						<span style="margin-left:4px;">📄</span>
					{/if}
					{#if !expanded}
						<div style="display: flex; align-items:center; margin-left: 10px">
							{#if task.effort}
								<LoeChip effort={task.effort} setEffort={onSetEffort} />
							{/if}
							{#if task.project}
								<ProjectSelector
									project={task.project}
									setProject={onSetProject}
									hideText
								/>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<div style="color:grey;padding-right:10px;cursor:pointer;">
				{#if expanded}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="18 15 12 9 6 15" /></svg
					>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg
					>
				{/if}
			</div>
		</div>
		{#if expanded}
			<div
				style="margin-left:9px; margin-top:4px; padding-left:20px; padding-top:10px; padding-bottom:5px; border-left:2px solid grey"
			>
				<div style="display:flex; alignItems:center;flex-wrap:wrap;row-gap:10px">
					<DateChip
						date={task.scheduled_date}
						setDate={onSetScheduledDate}
						emoji={'ON'}
					/>
					<DateChip date={task.due_date} setDate={onSetDueDate} emoji={'DUE'} />
					{#if task.complete}
						<DateChip
							date={task.completed_date}
							setDate={onSetCompletedDate}
							emoji={'✅'}
							complete={task.complete}
						/>
					{/if}
					<LoeChip effort={task.effort} setEffort={onSetEffort} />
					<ProjectSelector project={task.project} setProject={onSetProject} />
				</div>
				<div style="height:38px; width:100%;" />
				<button
					on:click={() => onDelete()}
					style="color:rgb(250,130,130); height:26px; font-size:14px; text-decoration:uppercase; width: auto !important;"
				>
					{#if !showDeleteConfirm}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M3 6h18" /><path
								d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
							/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg
						>
					{:else}
						Are you sure?
					{/if}
				</button>
			</div>
		{/if}
	</li>
</div>

<style>
	.task-container {
		white-space: normal;
		list-style: none;
	}
	.containerDiv {
		width: 100%;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		row-gap: 10px;
		cursor: pointer;
	}

	.containerDiv:hover svg {
		color: white !important;
	}

	.containerLi:hover {
		background-color: rgb(1, 1, 1);
		cursor: pointer;
	}
	.containerLi.completed {
		text-decoration: line-through;
		color: grey !important;
	}

	/*:global(span.cm-hmd-frontmatter) { 
    display: none; 
}

:global(.cm-line:has(.cm-hmd-frontmatter)) { 
    display: none !important; 
    color:red;
}*/
</style>
