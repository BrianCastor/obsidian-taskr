<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Habit } from 'src/habit'
	import Icon from './Icon.svelte'
	import type { RRule } from 'rrule'
	import { getLeaf } from '../utils'
	import { isSameDay, isToday } from 'date-fns'

	export let habit: Habit
	export let plugin: TaskrPlugin
	export let viewForDate: Date = new Date()

	let quantityCompleted = 0
	let percentComplete = 0
	let streak = 0
	let habitHistory: ('complete' | 'partial' | 'none')[] = []

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
		quantityCompleted = habit.getCompletionsForPeriodOfDate(viewForDate)
		percentComplete = quantityCompleted / (habit.quantity ?? 1)
		streak = habit.getStreak()

		const temp: ('complete' | 'partial' | 'none')[] = []
		let amountLeft = 14
		for (const completionAmount of habit.completionHistoryIterator(viewForDate)) {
			if (completionAmount >= habit.quantity) temp.push('complete')
			else if (completionAmount > 0) temp.push('partial')
			else temp.push('none')

			amountLeft -= 1

			if (amountLeft === 0) break
		}
		if (temp.length < 14) {
			temp.push(...new Array(14 - temp.length).fill('none'))
		}
		habitHistory = temp.reverse()
	}
</script>

<div style="border-radius:5px;width:100;position:relative" on:contextmenu={onClickContainer}>
	<div class="habit-container">
		<div class="habit-progress-line-container">
			<div
				style={`height:${Math.min(percentComplete, 1) * 100}%;background-color:${
					percentComplete >= 1 ? 'lightgreen' : 'lightblue'
				};transition: all 0.1s ease-out;width:100%;border-radius:5px;`}
			/>
		</div>
		<div
			style="display:flex;column-gap:10px;align-items:center;flex-grow:1;padding-left:13px;"
			on:click|stopPropagation={() => navigateToHabit()}
		>
			<Icon name={habit.icon} color="lightblue" />
			<div>
				<div style="margin-bottom:1px">{habit.title}</div>
				<div
					style="font-size:12px;color:rgb(150,150,150);display:flex;column-gap:10px;align-items:center"
				>
					<div style="min-width:95px;">
						{quantityCompleted}/{habit.quantity} ({formatRRule(habit.recurrence)})
					</div>
					{#if isToday(viewForDate)}
						<div style="display:flex;min-width:50px;justify-content:end;">
							{#each habitHistory as hh}
								<div
									style={`background-color:${
										hh === 'complete'
											? 'lightgreen'
											: hh === 'partial'
											? 'yellow'
											: 'rgb(80,80,80)'
									};height:10px;width:3px;opacity:.8`}
								/>
							{/each}
						</div>
						{#if streak > 1}
							<span>{`🔥 ${streak}`}</span>
						{/if}
					{/if}
				</div>
			</div>
		</div>
		<div>
			{#if quantityCompleted}<button on:click={() => uncompleteHabit()} style="height:30px"
					>-</button
				>{/if}
			<button on:click={() => completeHabit()} style="height:30px">+</button>
		</div>
	</div>
</div>

<style>
	.habit-container {
		display: flex;
		align-items: center;
		column-gap: 5px;
		justify-content: space-between;
		position: relative;
		cursor: pointer;
	}

	.habit-progress-line-container {
		width: 3px;
		background-color: rgb(50, 50, 50);
		border-radius: 5px;
		height: 100%;
		top: 0;
		left: 0;
		bottom: 0;
		position: absolute;
		display: flex;
		align-items: end;
	}
</style>
