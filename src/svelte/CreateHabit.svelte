<script lang="ts">
	import { Habit } from '../habit'
	import DateChip from './DateChip.svelte'
	import LoeChip from './LOE_Chip.svelte'
	import ProjectSelector from './ProjectSelector.svelte'
	import { allEfforts } from '../utils'
	import { onMount } from 'svelte'
	import type { App } from 'obsidian'
	import type TaskrPlugin from '../main'
	import { Frequency, RRule } from 'rrule'
	import FrequencyPicker from './FrequencyPicker.svelte'
	import QuantityPicker from './QuantityPicker.svelte'
	import IconPicker from './IconPicker.svelte'
	import type { LucideIcon } from '../types/lucide'
	import type { Project } from '../project'

	export let close: () => void
	export let store: (habit: Habit) => void
	export let app: App
	export let plugin: TaskrPlugin
	export let modalEl: any

	//TODO - this all could use a refactor

	let inputHTML = ''
	let title: string = ''
	let effort: number | undefined
	let project: Project | undefined
	let icon: LucideIcon | undefined
	let recurrence: RRule | undefined
	let freq: Frequency = Frequency.DAILY
	let quantity: number = 1
	let startDate: Date = new Date()

	let inputEl: HTMLElement
	let marked: string = ''

	const hashtags_re = /\B#\w*/g

	const save = () => {
		const startDt = startDate ?? new Date()
		const newHabit = new Habit({
			title: title,
			recurrence: new RRule({
				...recurrence?.options,
				dtstart: new Date(
					Date.UTC(startDt.getFullYear(), startDate.getMonth(), startDate.getDate())
				),
				freq: freq,
				count: undefined
			}),
			project: project,
			effort: effort ?? 0,
			quantity: quantity,
			icon: icon ?? 'activity'
		})
		store(newHabit)
		close()
	}

	$: {
		// Unescape the div content
		const doc = new DOMParser().parseFromString(inputHTML, 'text/html')
		let textContent = doc.documentElement.textContent ?? ''

		//Remove extra spaces
		let text = textContent.replace(/\s+/g, ' ')

		const options = RRule.parseText(text) ?? {}
		if (Object.keys(options).length > 0) {
			if (options.dtstart) startDate = options.dtstart
			if (options.freq) freq = options.freq
			if (options.count) quantity = options.count
		}

		//Get Effort
		text.split(' ').map((term: string) => {
			const matchingEffort = allEfforts.find((t: any) =>
				t.autoSuggestTerms.find(
					(ts: string) => ts.toLowerCase() === term.toLowerCase().trim()
				)
			)
			if (matchingEffort) {
				effort = matchingEffort.value
				text = text.replace(term, '')
				textContent = textContent.replace(term, `<mark class="green">${term}</mark>`)
			}
		})

		textContent = textContent.replace(
			hashtags_re,
			(x: string) => `<mark class="white">${x}</mark>`
		)
		text = text.replace(hashtags_re, '')
		title = text.trim()

		marked = textContent
	}

	function onSetSartDate(dt: Date) {
		startDate = dt
		inputEl.focus()
	}

	function onSetProject(pj: Project | undefined) {
		project = pj
		inputEl.focus()
	}

	function handleKeyPress(e: any) {
		if (e.key === 'Enter') {
			save()
		}
	}

	onMount(() => {
		inputEl.focus()
	})
</script>

<div style="width:100%; position: relative">
	<div
		contenteditable="true"
		bind:innerHTML={inputHTML}
		class="habit-input"
		bind:this={inputEl}
		on:keypress={handleKeyPress}
	/>
	<div class="highlight-overlay" contenteditable bind:innerHTML={marked} />
</div>
<div
	style="width:100%;margin-top:5px;display:flex;justify-content:space-between; margin-bottom:4px"
>
	<div style="display:flex; alignItems:center; margin-top:5px;flex-wrap:wrap;row-gap:10px;">
		<DateChip date={startDate} setDate={onSetSartDate} emoji={'STARTING'} size="normal" />
		<QuantityPicker {quantity} setQuantity={(q) => (quantity = q)} />
		<FrequencyPicker frequency={freq} setFrequency={(f) => (freq = f)} />
		<LoeChip {effort} setEffort={(e) => (effort = e)} size="small" />
		<ProjectSelector {project} setProject={onSetProject} size="small" />
		<IconPicker {icon} setIcon={(iconName) => (icon = iconName)} size="small" {plugin} />
	</div>
</div>

<div style="width:100%;margin-top:3px">
	<button class="button" on:click={save} style="width:100%;height:30px">Save</button>
</div>

<style>
	.habit-input {
		width: 100%;
		border: 1px solid rgb(54, 54, 54);
		background-color: rgba(1, 1, 1, 0.2);
		border-radius: 4px;
		padding: 8px;
		z-index: 1 !important;
		position: relative;
	}

	.highlight-overlay {
		color: rgba(0, 0, 0, 0);
		background-color: black;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 8px;
		z-index: 0 !important;
		border: 1px solid rgba(0, 0, 0, 0);
		border-radius: 4px;
	}

	:global(.highlight-overlay .blue) {
		background-color: rgba(108, 240, 255, 0.4) !important;
	}

	:global(.highlight-overlay .green) {
		background-color: rgba(255, 199, 115, 0.5) !important;
	}

	:global(.highlight-overlay .purple) {
		background-color: rgba(215, 141, 255, 0.5) !important;
	}

	:global(.highlight-overlay .white) {
		background-color: rgba(255, 255, 255, 0.5) !important;
	}

	:global(.highlight-overlay .darkblue) {
		background-color: rgba(113, 127, 255, 0.5) !important;
	}
</style>
