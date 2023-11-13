<script lang="ts">
	import { isThisWeek } from 'date-fns'
	import type TaskrPlugin from '../main'
	import type { Task } from '../task'
	import { allTasksCache } from '../cache'
	import { GoalService } from '../goalService'
	import Icon from './Icon.svelte'

	type TimePeriodOption = 'all-time' | 'week'

	export let plugin: TaskrPlugin
	export let timePeriod: TimePeriodOption = 'week'
	export let displayAs: 'chip' | 'statistic' = 'chip'

	let difference: number = 0

	allTasksCache.subscribe((tasks: Task[]) => {
		const tasksCompletedInPeriod: Task[] = tasks.filter((task: Task) => {
			if (task.complete && task.completed_date) {
				if (timePeriod === 'week') {
					return isThisWeek(task.completed_date, { weekStartsOn: 1 })
				}
				return true
			}
			return false
		})

		const hoursCompleted =
			tasksCompletedInPeriod.reduce((accumulator: number, task: Task) => {
				return accumulator + (task.effort ?? 0)
			}, 0) / 60
		const gs = new GoalService(plugin.settings)
		const hoursToCompleteByToday =
			timePeriod === 'week' ? gs.hoursToCompleteThisWeekByToday() : gs.hoursToCompleteTotal()
		difference = hoursCompleted - hoursToCompleteByToday
	})

	$: color = difference > 0 ? 'rgb(0,255,0)' : difference === 0 ? 'white' : 'rgb(255,0,0)'
</script>

{#if displayAs === 'chip'}
	<div class="statistic-container">
		<span style={`font-weight:bold; font-size:36px; color:${color}`}
			>{Math.abs(Math.round(difference * 10) / 10)}</span
		>
		<div style="flex-grow:1; padding-left:10px;">
			<span style="font-size:14px;white-space:nowrap"
				>{`Hour${Math.abs(Math.round(difference * 10) / 10) === 1 ? '' : 's'}`}</span
			>
			<br />
			<span style={`color:${color};white-space:nowrap`}>
				{#if difference >= 0}
					Ahead
				{:else}
					Behind
				{/if}
			</span>
		</div>
	</div>
{/if}

{#if displayAs === 'statistic'}
	<div style="text-align:center;">
		<div style={`font-size:18px;display:flex;justify-content:center;color:${color}`}>
			{Math.abs(Math.round(difference * 10) / 10)}
			{#if difference >= 0}<Icon name="arrow-up" {color} />
			{/if}
			{#if difference < 0}<Icon name="arrow-down" {color} />
			{/if}
		</div>
		<div style="font-size:10px;">
			{`Hour${Math.abs(Math.round(difference * 10) / 10) === 1 ? '' : 's'} ${
				difference >= 0 ? 'Ahead' : 'Behind'
			}`}
		</div>
	</div>
{/if}

<style>
	.statistic-container {
		border-radius: 6px;
		display: flex;
		background-color: #141414;
		padding: 3px 10px;
		align-items: center;
	}
</style>
