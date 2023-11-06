<script lang="ts">
	import { getIcon, type IconName } from 'obsidian'
	export let name: IconName
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
