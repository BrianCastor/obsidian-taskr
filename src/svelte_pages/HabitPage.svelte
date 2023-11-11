<script lang="ts">
	import type TaskrPlugin from '../main'
	import { allHabitsCache } from '../cache'
	import Container from '../svelte/Container.svelte'
	import type { Habit } from '../habit'
	import GithubChart from '../svelte/GithubChart.svelte'
	import { isSameDay } from 'date-fns'

	export let plugin: TaskrPlugin
	export let id: string | undefined

	let habit: Habit | undefined = undefined

	allHabitsCache.subscribe((habits: Habit[]) => {
		habit = habits.find((h) => h.id === id)
	})

	$: timeSeries = habit
		? habit.getDueDates().map((dt) => {
				const quantity = habit?.completion_dates.filter((d) => isSameDay(d, dt)).length ?? 0
				return {
					date: dt,
					quantity: quantity,
					metGoal: quantity >= (habit?.quantity ?? 99999)
				}
		  })
		: []
</script>

<Container>
	{#if habit}
		<h1>{habit.title}</h1>
		<p>{habit.recurrence.toText()}</p>
		<p>{habit.effort}</p>
		<p>{habit.project}</p>

		---

		<GithubChart {timeSeries} />
	{/if}
</Container>

<style>
</style>
