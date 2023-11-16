<script lang="ts">
	import { onMount } from 'svelte'
	import type { App } from 'obsidian'
	import type TaskrPlugin from '../main'
	import { Project } from '../project'
	import ProjectCategoryPicker from './ProjectCategoryPicker.svelte'

	export let close: () => void
	export let store: (project: Project) => void
	export let app: App
	export let plugin: TaskrPlugin
	export let modalEl: any

	let inputHTML = ''
	let title: string = ''
	let icon: string | undefined
	let category: string = 'Personal'

	let inputEl: HTMLElement

	const save = () => {
		const newProject = new Project({
			title: title,
			category: category,
			icon: icon ?? '🔵'
		})
		store(newProject)
		close()
	}

	$: {
		// Unescape the div content
		const doc = new DOMParser().parseFromString(inputHTML, 'text/html')
		let textContent = doc.documentElement.textContent ?? ''

		//Remove extra spaces
		let text = textContent.replace(/\s+/g, ' ')
		title = text.trim()
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
		class="project-input"
		bind:this={inputEl}
		on:keypress={handleKeyPress}
	/>
</div>
<div
	style="width:100%;margin-top:5px;display:flex;justify-content:space-between; margin-bottom:4px"
>
	<div style="display:flex; alignItems:center; margin-top:5px;flex-wrap:wrap;row-gap:10px;">
		<ProjectCategoryPicker {category} setCategory={(c) => (category = c)} />
	</div>
</div>

<div style="width:100%;margin-top:3px">
	<button class="button" on:click={save} style="width:100%;height:30px">Save</button>
</div>

<style>
	.project-input {
		width: 100%;
		border: 1px solid rgb(54, 54, 54);
		background-color: rgba(1, 1, 1, 0.2);
		border-radius: 4px;
		padding: 8px;
		z-index: 1 !important;
		position: relative;
	}
</style>
