<script lang="ts">
	import { eachDayOfInterval, format, startOfDay, startOfToday, subDays } from 'date-fns'
	import { allTasksCache } from '../cache'
	import type { Task } from 'src/task'
	import type TaskrPlugin from '../main'
	import { GoalService } from '../goalService'
	import { onDestroy, onMount } from 'svelte'
	import { FixedScaleAxis, LineChart, type SeriesObject } from 'chartist'

	export let plugin: TaskrPlugin

	let datasets: SeriesObject[] = []
	let filteredDatasets: SeriesObject[] = []
	let chart: LineChart | undefined
	let chartEl: HTMLElement

	onMount(() => {
		chart = new LineChart(
			chartEl,
			{
				series: filteredDatasets
			},
			{
				axisX: {
					type: FixedScaleAxis,
					showGrid: false,
					showLabel: false
				},
				axisY: {
					showLabel: false,
					position: 'end',
					showGrid: true
				},
				chartPadding: { right: -40, left: 0, top: 0, bottom: -30 },
				fullWidth: true,
				lineSmooth: true
			}
		)
	})

	onDestroy(() => {
		chart?.detach()
	})

	$: {
		const start = subDays(startOfToday(), 14)

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
				data: goalSeries,
				name: 'Goal',
				className: 'chart-line-goal'
			},
			{
				data: completedSeries,
				name: 'Completed',
				className: 'chart-line-completed'
			}
		]
	})
</script>

<div id="sparkline-chart" bind:this={chartEl} style="height:100%;width:100%" />

<style>
	@import './chartist.css';
	:global(#sparkline-chart .ct-line, #sparkline-chart .ct-point) {
		stroke-width: 4px !important;
	}
	:global(#sparkline-chart .chart-line-goal) {
		stroke: #cc5500;
	}
	:global(#sparkline-chart .chart-line-completed) {
		stroke: #00e396;
	}
	:global(#sparkline-chart .ct-grid) {
		stroke: rgba(140, 150, 150, 0.8);
		opacity: 0.2;
		stroke-dasharray: none;
	}
</style>
