<script lang="ts">
	import { SearchModal } from '../components/searchModal'
	import { TASK_LIST_TYPES } from '../components/taskListView'
	import { navigateToTaskPage } from '../utils'
	import { onMount } from 'svelte'
	import type TaskrPlugin from 'main'
	import Icon from './Icon.svelte'
	import { activeViewTypeCache } from '../cache'

	export let plugin: TaskrPlugin
	let activeViewType: string | undefined

	// Modify Mobile Buttons
	onMount(() => {
		const searchButton =
			document.querySelector('.mobile-navbar-action > .clickable-icon .lucide-plus-circle')
				?.parentNode?.parentNode ?? undefined
		const lastButton =
			document.querySelector('.mobile-navbar-action.has-longpress-menu') ?? undefined

		if (searchButton) document.querySelector('#btn1')?.replaceWith(searchButton)
		if (lastButton) document.querySelector('#btn2')?.replaceWith(lastButton)

		const existing = document.querySelector('.mobile-navbar-actions')
		existing?.remove()

		app.workspace.on('active-leaf-change', (leaf) => {
			const activePageType = leaf?.view.getViewType()
			activeViewTypeCache.set(activePageType)
		})
	})

	activeViewTypeCache.subscribe((val) => {
		activeViewType = val
	})
</script>

<div class="mobile-navbar-actions">
	<button
		class={`mobile-navbar-action clickable-icon mod-tappable`}
		on:click={() => new SearchModal(plugin.app, this).open()}
	>
		<Icon name="search" />
	</button>
	<div id="btn1" />
	<button
		class={`mobile-navbar-action clickable-icon mod-tappable ${
			activeViewType === TASK_LIST_TYPES.today && 'mod-cta'
		}`}
		on:click={() => navigateToTaskPage(TASK_LIST_TYPES.today)}
	>
		<Icon name="home" />
	</button>
	<button
		class={`mobile-navbar-action clickable-icon mod-tappable ${
			activeViewType === TASK_LIST_TYPES.incomplete && 'mod-cta'
		}`}
		on:click={() => navigateToTaskPage(TASK_LIST_TYPES.incomplete)}
	>
		<Icon name="list" />
	</button>
	<div id="btn2" />
</div>
