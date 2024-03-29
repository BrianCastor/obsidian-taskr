<script lang="ts">
	import {
		addDays,
		eachDayOfInterval,
		format,
		isSameDay,
		isToday,
		isWeekend,
		startOfDay,
		subDays
	} from 'date-fns'
	import { allTasksCache } from '../cache'
	import { onMount } from 'svelte'
	import Icon from './Icon.svelte'

	export let selectedDate: Date
	export let onSelectDate: (dt: Date) => void

	let dateToTaskCounts: Record<number, number> = {}

	allTasksCache.subscribe((ts) => {
		dateToTaskCounts = ts.reduce((accum: Record<number, number>, task) => {
			const dt = task.completed_date ?? task.scheduled_date ?? task.due_date
			if (dt) {
				accum[startOfDay(dt).getTime()] = Math.min(
					(accum[startOfDay(dt).getTime()] ?? 0) + 1,
					4
				)
			}
			return accum
		}, {})
	})

	$: {
		if (selectedDate) {
			document
				.querySelector(`[data-date='${format(selectedDate, 'yyyy-MM-dd')}']`)
				?.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'center'
				})
		}
	}

	onMount(() => {
		setTimeout(
			() =>
				document.querySelector('.date-chip.today')?.scrollIntoView({
					behavior: 'instant',
					block: 'nearest',
					inline: 'center'
				}),
			5
		)
	})
</script>

<div class="second-navbar">
	<div
		style="height:100%;width:60px;display:flex;justify-content:center;align-items:center;border-right:1px solid var(--divider-color);cursor:pointer;"
		on:click={() => onSelectDate(addDays(selectedDate, -1))}
	>
		<Icon name="chevron-left" />
	</div>
	<div class="date-chip-container">
		{#each eachDayOfInterval( { end: addDays(new Date(), 14), start: subDays(new Date(), 14) } ).reverse() as dt}
			<div
				class={`date-chip ${isToday(dt) && 'today'} ${
					isSameDay(dt, selectedDate) && 'selected'
				} ${isWeekend(dt) && 'weekend'}`}
				on:click={() => onSelectDate(dt)}
				on:dragstart={(e) => {
					e.preventDefault()
					e.stopPropagation()
				}}
				on:touchstart={(e) => {
					e.stopPropagation()
				}}
				data-date={format(dt, 'yyyy-MM-dd')}
			>
				<div style="font-size:11px">{format(dt, 'EEE').toLocaleUpperCase()}</div>
				<div
					style="display:flex;justify-content:center;column-gap:2px;min-height:3px;width:100%"
				>
					{#each Array(dateToTaskCounts[startOfDay(dt).getTime()] ?? 0) as i}
						<div class="date-chip-task-indicator" />
					{/each}
				</div>
				<div style="font-size:14px">{format(dt, 'dd').toLocaleUpperCase()}</div>
			</div>
		{/each}
	</div>
	<div
		style="height:100%;width:60px;display:flex;justify-content:center;align-items:center;border-left:1px solid var(--divider-color);cursor:pointer;"
		on:click={() => onSelectDate(addDays(selectedDate, 1))}
	>
		<Icon name="chevron-right" />
	</div>
</div>

<style>
	.date-chip {
		height: 40px;
		width: 40px;
		min-width: 40px;
		border-radius: 8px;
		background-color: rgb(50, 50, 50);
		padding: 5px;
		row-gap: 2px;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		cursor: pointer;
	}

	.date-chip:hover {
		box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
		transition: 300ms;
	}

	.date-chip-task-indicator {
		background-color: white;
		border-radius: 50%;
		height: 3px;
		width: 3px;
	}

	.date-chip.selected .date-chip-task-indicator {
		background-color: var(--text-on-accent) !important;
	}

	:global(.date-chip.today) {
		color: var(--interactive-accent);
	}
	:global(.date-chip.weekend) {
		background-color: rgb(0, 0, 0) !important;
	}

	:global(.date-chip.selected) {
		color: var(--text-on-accent) !important;
		background-color: var(--interactive-accent) !important;
	}

	.second-navbar {
		bottom: 0px;
		left: 0;
		right: 0;
		height: 50px;
		overflow-y: none;
		position: absolute;
		border-top: 1px solid var(--divider-color);
		border-bottom: 1px solid var(--divider-color);
		background-color: var(--background-primary);
		display: flex;
	}

	.date-chip-container {
		display: flex;
		flex-direction: row-reverse;
		column-gap: 10px;
		height: 100%;
		width: 100%;
		align-items: center;
		padding-left: 15px;
		padding-right: 15px;
		overflow-x: scroll;
		flex-grow: 1;
	}
	.date-chip-container::-webkit-scrollbar {
		display: none;
	}
	:global(.is-mobile .second-navbar) {
		bottom: 72px !important;
	}
</style>
