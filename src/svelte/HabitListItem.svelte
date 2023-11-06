<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Habit } from 'src/habit'
	import Icon from './Icon.svelte'

	export let habit: Habit
	export let plugin: TaskrPlugin

	let quantityCompleted = 0
	let percentComplete = 0
	let streak = 0

	const completeHabit = () => {
		habit.completion_dates.push(new Date())
		plugin.fileInterface.createUpdateHabit(habit)
	}

	$: {
		quantityCompleted = habit.getCompletionsCurrentPeriod().length
		percentComplete = quantityCompleted / (habit.quantity ?? 1)
		streak = habit.getStreak()
	}
</script>

<div style="border-radius:5px;width:100%;background-color:rgb(25,25,25);position:relative">
	<div
		style="display:flex;align-items:center;padding:7px 12px;column-gap:5px;justify-content: space-between;"
	>
		<div
			style="display:flex;column-gap:15px;justify-content: space-between;align-items:center;"
		>
			<Icon name="glass-water" color="lightblue" />
			<div>
				<div style="margin-bottom:3px">{habit.title}</div>
				<div style="font-size:12px;color:rgb(150,150,150);">
					<span>{quantityCompleted}/{habit.quantity}</span>
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
</style>
