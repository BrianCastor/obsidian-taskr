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

<div style={`color:${color}`}>
	{@html iconHTML}
</div>

<style>
</style>
