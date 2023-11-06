<script lang="ts">
	import { eachDayOfInterval, format, startOfDay, startOfToday, subDays } from 'date-fns'
	import { allTasksCache } from '../cache'
	import type { Task } from 'src/task'
	import type TaskrPlugin from '../main'
	import ButtonGroup from './ButtonGroup.svelte'
	import { GoalService } from '../goalService'
	import { onDestroy, onMount } from 'svelte'
	import { FixedScaleAxis, LineChart, type SeriesObject } from 'chartist'

	export let plugin: TaskrPlugin

	let datasets: SeriesObject[] = []
	let filteredDatasets: SeriesObject[] = []
	let datePreset: string = 'All'
	let chart: LineChart | undefined
	let chartEl: HTMLElement

	const presetToDaysAgo: Record<string, number | undefined> = {
		W: 7,
		M: 31,
		'6M': 182,
		Y: 365,
		All: undefined
	}

	onMount(() => {
		chart = new LineChart(
			chartEl,
			{
				series: filteredDatasets
			},
			{
				axisX: {
					type: FixedScaleAxis,
					divisor: 5,
					labelInterpolationFnc: (value) =>
						new Date(value).toLocaleString(undefined, {
							month: 'short',
							year: '2-digit'
						}),
					showGrid: false
				},
				axisY: {
					showGrid: true,
					showLabel: true,
					position: 'end'
				},
				height: 220,
				showArea: true
			}
		)
	})

	onDestroy(() => {
		chart?.detach()
	})

	$: {
		const daysAgo = presetToDaysAgo[datePreset]
		const start = daysAgo ? subDays(startOfToday(), daysAgo) : undefined

		filteredDatasets = datasets.map((dataset: any) => {
			return {
				...dataset,
				data: dataset.data.filter((point: any) => (start ? point.x >= start : true))
			}
		})

		chart?.update({ series: filteredDatasets })
	}

	allTasksCache.subscribe((ts: Task[]) => {
		const tasks: Task[] = ts.filter((task: Task) => {
			return task.complete
		})

		if (tasks.length === 0) {
			datasets = []
			return
		}

		const goalStartDate = plugin.settings.TaskCompletionStartDate

		const temp = Math.min(
			...ts.map((t: Task) => {
				return t.completed_date?.getTime() || new Date().getTime()
			}),
			goalStartDate.getTime()
		)
		const startDate = subDays(startOfDay(new Date(temp)), 1)

		const groupedByDate = tasks.reduce(function (rv: Record<string, number>, task) {
			const dt_string = format(task.completed_date ?? 0, 'yyyy-MM-dd')
			rv[dt_string] = (rv[dt_string] ?? 0) + (task.effort ?? 0) / 60
			return rv
		}, {})

		let runningTotal = 0
		const completedSeries = eachDayOfInterval({
			start: startDate,
			end: new Date()
		}).map((date: Date) => {
			const dtStr = format(date, 'yyyy-MM-dd')
			if (groupedByDate[dtStr]) {
				runningTotal += groupedByDate[dtStr]
			}
			return {
				x: date,
				y: runningTotal
			}
		})

		const goalSeries = new GoalService(plugin.settings)
			.getGoalTimeSeriesAccum()
			.map((value) => {
				return {
					x: value.date,
					y: value.value
				}
			})

		datasets = [
			{
				data: completedSeries,
				name: 'Completed',
				className: 'chart-line-completed'
			},
			{
				data: goalSeries,
				name: 'Goal',
				className: 'chart-line-goal'
			}
		]
	})
</script>

<ButtonGroup
	options={Object.keys(presetToDaysAgo)}
	value={datePreset}
	onChange={(value) => (datePreset = value)}
/>
<div id="chart" bind:this={chartEl} style="height:220px" />

<style>
	@import './chartist.css';
	:global(.ct-line, .ct-point) {
		stroke-width: 2px !important;
	}
	:global(.ct-label) {
		color: rgba(140, 150, 150, 0.5) !important;
	}
	:global(.chart-line-goal) {
		stroke: #cc5500;
	}
	:global(.chart-line-completed) {
		stroke: #00e396;
	}
	:global(.chart-line-completed .ct-area) {
		fill: #00a36c;
	}
	:global(.ct-grid) {
		stroke: rgba(140, 150, 150, 0.8);
		opacity: 0.2;
		stroke-dasharray: none;
	}
</style>
