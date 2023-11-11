<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Habit } from 'src/habit'
	import Icon from './Icon.svelte'
	import type { RRule } from 'rrule'
	import { getLeaf } from '../utils'
	import { isSameDay } from 'date-fns'

	export let habit: Habit
	export let plugin: TaskrPlugin
	export let viewForDate: Date = new Date()

	let quantityCompleted = 0
	let percentComplete = 0
	let streak = 0

	const completeHabit = () => {
		habit.completion_dates.push(viewForDate)
		plugin.fileInterface.createUpdateHabit(habit)
	}
	const uncompleteHabit = () => {
		const index = habit.completion_dates.findIndex((dt) => isSameDay(viewForDate, dt))
		if (index === -1) return
		const temp = [...habit.completion_dates]
		temp.splice(index, 1)
		habit.completion_dates = temp
		plugin.fileInterface.createUpdateHabit(habit)
	}

	const formatRRule = (rule: RRule) => {
		const temp = rule.clone()
		temp.options.until = null
		temp.options.count = null
		return temp.toText()
	}
	/*async function navigateToHabit(id: string) {
		console.log(id)
		const leaf = getLeaf()
		leaf.open(new HabitView(leaf, plugin, id))
		app.workspace.revealLeaf(leaf)
	}*/

	function navigateToHabit() {
		const file = plugin.fileInterface.getHabitFileById(habit.id)
		const leaf = getLeaf()
		leaf.openFile(file)
		app.workspace.revealLeaf(leaf)
	}

	const onClickContainer = (evt: MouseEvent) => {
		evt.stopPropagation()
		evt.preventDefault()
	}

	$: {
		quantityCompleted = habit.getCompletionsForPeriodOfDate(viewForDate).length
		percentComplete = quantityCompleted / (habit.quantity ?? 1)
		streak = habit.getStreak()
	}
</script>

<div
	style="border-radius:5px;width:100%;background-color:rgb(25,25,25);position:relative"
	on:contextmenu={onClickContainer}
>
	<div
		style="display:flex;align-items:center;padding:3px 7px;column-gap:5px;justify-content: space-between;"
		class="habit-container"
	>
		<div
			style="display:flex;column-gap:10px;align-items:center;flex-grow:1"
			on:click|stopPropagation={() => navigateToHabit()}
		>
			<Icon name="glass-water" color="lightblue" />
			<div>
				<div style="margin-bottom:1px">{habit.title}</div>
				<div style="font-size:12px;color:rgb(150,150,150);margin-bottom:2px;">
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
			{#if quantityCompleted}<button on:click={() => uncompleteHabit()} style="height:35px"
					>-</button
				>{/if}
			<button on:click={() => completeHabit()} style="height:35px">+</button>
		</div>
	</div>
	<div style="height:3px;background-color:rgb(50,50,50);border-radius:0px 0px 5px 5px;width:100%">
		<div
			style={`width:${Math.min(percentComplete, 1) * 100}%;height:100%;background-color:${
				percentComplete >= 1 ? 'lightgreen' : 'lightblue'
			};border-radius:0px 20px 20px 5px;transition: all 0.1s ease-out;`}
		/>
	</div>
</div>

<style>
	.habit-container:hover {
		background-color: rgb(10, 10, 10);
		cursor: pointer;
	}
</style>
