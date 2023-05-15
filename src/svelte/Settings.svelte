<script lang="ts">
	import type { DayOfWeek } from '../types'
	import type TaskrPlugin from '../main'
	import { ALL_DAYS_OF_WEEK } from '../utils'
	import { Modal } from 'obsidian'
	import CalendarPopup from './CalendarPopup.svelte'
	import { format, isEqual, startOfDay } from 'date-fns'

	export let plugin: TaskrPlugin
	let workingDays: DayOfWeek[] = plugin.settings.WorkingDays
	let exemptDays: Date[] = plugin.settings.ExemptDays

	function handleDayClicked(day: DayOfWeek) {
		if (workingDays.includes(day)) {
			workingDays = workingDays.filter((d) => d !== day)
		} else {
			workingDays = [...workingDays, day]
		}
		plugin.settings.WorkingDays = [...workingDays]
		plugin.saveSettings()
	}

	function addExemptDate(date: Date) {
		exemptDays = [...new Set([...exemptDays, startOfDay(date)])].sort(
			(a, b) => b.getTime() - a.getTime()
		)
		plugin.settings.ExemptDays = exemptDays
		plugin.saveSettings()
	}

	function removeExemptDate(date: Date) {
		exemptDays = exemptDays.filter((dt: Date) => !isEqual(dt, date))
		plugin.settings.ExemptDays = exemptDays
		plugin.saveSettings()
	}

	const renderCalendar = () => {
		const modal = new Modal(app)
		modal.containerEl.style.padding = '0px'
		modal.containerEl.addClass('taskr-calendar-modal')
		modal.onOpen = () => {
			const { titleEl, contentEl } = modal
			new CalendarPopup({
				target: contentEl,
				props: {
					date: undefined,
					setDate: (dt) => {
						dt && addExemptDate(dt)
						modal.close()
					}
				}
			})
		}
		modal.onClose = (): void => {
			const { contentEl } = modal
			contentEl.empty()
		}

		modal.open()
	}
</script>

<div
	style="border-top: 1px solid var(--background-modifier-border);margin-bottom:20px; padding-top:10px"
>
	<div class="setting-item-info">
		<div class="setting-item-name">Working Days</div>
		<div class="setting-item-description">
			The days you expect to work towards your goals. Selected days will increment your
			completion benchmark.
		</div>
	</div>
	<div style="display:flex; column-gap: 5px; row-gap: 5px; margin-top:10px;flex-wrap:wrap">
		{#each ALL_DAYS_OF_WEEK as day}
			<button
				class={`day ${workingDays.includes(day) ? 'mod-cta' : ''}`}
				on:click={() => handleDayClicked(day)}
			>
				{day.charAt(0).toUpperCase() + day.slice(1)}
			</button>
		{/each}
	</div>
</div>

<div
	style="border-top: 1px solid var(--background-modifier-border); margin-top:10px; padding-top:10px"
>
	<div class="setting-item-info">
		<div class="setting-item-name">Days Off</div>
		<div class="setting-item-description">
			Manually select days you won't be able to perform work. This may be due to vacation or
			other priorities that come up in your life. Your completion benchmark won't be
			incremented on these days.
		</div>
	</div>
	<div
		style="display:flex; column-gap: 10px; row-gap: 5px; margin-top:10px; align-items: center; flex-wrap:wrap"
	>
		<button class="mod-cta" on:click={() => renderCalendar()}>Add</button>
		{#each exemptDays as dt}
			<button on:click={() => removeExemptDate(dt)}
				>X&nbsp;&nbsp;{format(dt, 'yyyy-MM-dd')}</button
			>
		{/each}
	</div>
</div>
