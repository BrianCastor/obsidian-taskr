<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Habit } from 'src/habit'
	import Icon from './Icon.svelte'
	import type { RRule } from 'rrule'
	import { type WorkspaceLeaf, MarkdownView } from 'obsidian'
	import { TaskListView } from '../components/taskListView'

	export let habit: Habit
	export let plugin: TaskrPlugin

	let quantityCompleted = 0
	let percentComplete = 0
	let streak = 0

	const completeHabit = () => {
		habit.completion_dates.push(new Date())
		plugin.fileInterface.createUpdateHabit(habit)
	}

	const formatRRule = (rule: RRule) => {
		const temp = rule.clone()
		temp.options.until = null
		temp.options.count = null
		return temp.toText()
	}

	function navigateToHabit() {
		const file = plugin.fileInterface.getHabitFileById(habit.id)
		let existingLeaf: WorkspaceLeaf | undefined = undefined

		const lv = app.workspace.getActiveViewOfType(TaskListView)
		if (lv) existingLeaf = lv?.leaf

		if (!existingLeaf) {
			const lv = app.workspace.getActiveViewOfType(MarkdownView)
			if (lv) existingLeaf = lv?.leaf
		}

		if (existingLeaf !== undefined) {
			//@ts-ignore
			existingLeaf.openFile(file)
			return
		}
		let leaf = plugin.app.workspace.getLeaf(false)
		leaf.openFile(file)
	}

	const onClickContainer = (evt: MouseEvent) => {
		evt.stopPropagation()
		evt.preventDefault()
	}

	$: {
		quantityCompleted = habit.getCompletionsCurrentPeriod().length
		percentComplete = quantityCompleted / (habit.quantity ?? 1)
		streak = habit.getStreak()
	}
</script>

<div
	style="border-radius:5px;width:100%;background-color:rgb(25,25,25);position:relative"
	on:contextmenu={onClickContainer}
>
	<div
		style="display:flex;align-items:center;padding:7px 12px;column-gap:5px;justify-content: space-between;"
		class="habit-container"
	>
		<div
			style="display:flex;column-gap:15px;align-items:center;flex-grow:1"
			on:click|stopPropagation={() => navigateToHabit()}
		>
			<Icon name="glass-water" color="lightblue" />
			<div>
				<div style="margin-bottom:3px">{habit.title}</div>
				<div style="font-size:12px;color:rgb(150,150,150);">
					<span
						>{quantityCompleted}/{habit.quantity} ({formatRRule(
							habit.recurrence
						)})</span
					>
					{#if streak > 1}
						<span>&nbsp;&nbsp;•&nbsp;&nbsp;{`🔥 ${streak}`}</span>
					{/if}
				</div>
			</div>
		</div>
		<div>
			<button on:click={() => completeHabit()}>+</button>
		</div>
	</div>
	<div style="height:3px;background-color:rgb(50,50,50);border-radius:0px 0px 5px 5px;width:100%">
		<div
			style={`width:${Math.min(percentComplete, 1) * 100}%;height:100%;background-color:${
				percentComplete >= 1 ? 'lightgreen' : 'lightblue'
			};border-radius:0px 20px 20px 5px;transition: all 0.4s ease-out;`}
		/>
	</div>
</div>

<style>
	.habit-container:hover {
		background-color: rgb(10, 10, 10);
		cursor: pointer;
	}
</style>
