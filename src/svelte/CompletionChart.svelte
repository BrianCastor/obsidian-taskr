<script lang="ts">
	import { eachDayOfInterval, format, startOfDay, startOfToday, subDays } from 'date-fns'
	import { allTasksCache } from '../cache'
	import type { Task } from 'src/task'
	import type TaskrPlugin from '../main'
	import ApexChart from './ApexChart.svelte'
	import ButtonGroup from './ButtonGroup.svelte'
	import { GoalService } from '../goalService'

	export let plugin: TaskrPlugin

	let datasets: any[] = []
	let filteredDatasets: any[] = []
	let datePreset: string = 'All'

	const presetToDaysAgo: Record<string, number | undefined> = {
		W: 7,
		M: 31,
		'6M': 182,
		Y: 365,
		All: undefined
	}

	const FONT_COLOR = 'rgba(140,150,150,.5)'

	let options: any = {
		chart: {
			height: 220,
			toolbar: {
				show: false
			},
			zoom: {
				enabled: false
			}
		},
		dataLabels: {
			enabled: false
		},
		legend: {
			show: true,
			labels: {
				colors: FONT_COLOR
			}
		},
		series: filteredDatasets,
		yaxis: {
			title: { text: 'Hours', style: { color: FONT_COLOR } },
			opposite: true,
			labels: {
				formatter: function (value: number) {
					return value.toLocaleString('us-EN', {
						maximumFractionDigits: 1
					})
				},
				style: {
					colors: FONT_COLOR
				}
			},
			forceNiceScale: true
		},
		xaxis: {
			type: 'datetime',
			max: startOfToday().getTime(),
			labels: {
				style: {
					colors: FONT_COLOR
				}
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: true,
				color: 'rgba(150,150,150,.4)'
			}
		},
		grid: {
			show: true,
			borderColor: 'rgba(150,150,150,.2)'
		},
		stroke: {
			curve: 'straight'
		},
		tooltip: {
			theme: 'dark'
		},
		fill: {
			type: ['gradient', 'solid'],
			gradient: {
				shade: 'dark',
				opacityFrom: 0.8,
				opacityTo: 0.1,
				stops: [0, 100],
				type: 'vertical'
			}
		},
		colors: ['#00E396', '#CC5500']
	}

	$: {
		const daysAgo = presetToDaysAgo[datePreset]
		const start = daysAgo ? subDays(startOfToday(), daysAgo) : undefined
		options.xaxis.min = start?.getTime()

		filteredDatasets = datasets.map((dataset: any) => {
			return {
				...dataset,
				data: dataset.data.filter((point: any) =>
					start ? point.x >= format(start, 'yyyy-MM-dd') : true
				)
			}
		})
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
				x: dtStr,
				y: runningTotal
			}
		})

		const goalSeries = new GoalService(plugin.settings)
			.getGoalTimeSeriesAccum()
			.map((value) => {
				return {
					x: format(value.date, 'yyyy-MM-dd'),
					y: value.value
				}
			})

		datasets = [
			{
				data: completedSeries,
				name: 'Completed',
				type: 'area'
			},
			{
				data: goalSeries,
				name: 'Goal',
				type: 'line'
			}
		]
	})
</script>

<ButtonGroup
	options={Object.keys(presetToDaysAgo)}
	value={datePreset}
	onChange={(value) => (datePreset = value)}
/>
<ApexChart datasets={filteredDatasets} chartOptions={options} />

<style>
</style>
