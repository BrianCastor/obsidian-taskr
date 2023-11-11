<script lang="ts">
	import { eachDayOfInterval, endOfWeek, isFuture, isSameDay, startOfWeek } from 'date-fns'

	interface TSItem {
		date: Date
		quantity: number
		metGoal: boolean
	}

	export let timeSeries: TSItem[] = []

	const topDate = endOfWeek(new Date(), { weekStartsOn: 1 })

	$: sortedTimeSeries = timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime())
	$: minDate = startOfWeek(sortedTimeSeries[0]?.date, { weekStartsOn: 1 })
	$: allDates = eachDayOfInterval({ start: minDate, end: topDate }) ?? []
</script>

<div
	style="display:flex; justify-content: end; align-items: end; align-content: end;flex-direction:column; flex-wrap: wrap; height:154px; row-gap:2px; column-gap:2px; width:100%"
>
	{#each allDates as date}
		<div
			class={`chart-block ${
				timeSeries.find((i) => isSameDay(i.date, date))?.metGoal
					? 'chart-block-success'
					: isFuture(date)
					? ''
					: 'chart-block-fail'
			}`}
		/>
	{/each}
</div>

<style>
	.chart-block {
		height: 20px;
		width: 20px;
		background-color: rgb(50, 50, 50);
		cursor: pointer;
	}
	.chart-block-success {
		background-color: rgb(0, 237, 0);
	}
	.chart-block-fail {
		background-color: rgb(148, 0, 0);
	}

	.chart-block:hover {
		box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.3);
	}
</style>
