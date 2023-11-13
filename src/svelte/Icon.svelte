<script lang="ts">
	import { getIcon, type IconName } from 'obsidian'
	import type { LucideIcon } from '../types/lucide'
	export let name: LucideIcon
	export let color: string | undefined = 'inherit'

	let iconHTML: string

	$: {
		iconHTML = getIcon(name)?.outerHTML ?? ''
	}
</script>

<div class="svelte-lucide-icon" style={`color:${color}`}>
	{@html iconHTML}
</div>

<style>
	.svelte-lucide-icon {
		height: 100%;
		max-height: 100%;
	}
	:global(.svelte-lucide-icon .svg-icon) {
		height: 100% !important;
	}
</style>
