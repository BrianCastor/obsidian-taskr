<script lang="ts">
	import { LUCIDE_ICONS, type LucideIcon } from '../types/lucide'
	import Icon from './Icon.svelte'

	export let close: () => void
	export let onSelect: (icon: LucideIcon) => void

	let searchText: string = ''
	$: filteredIcons = LUCIDE_ICONS.filter((i) => {
		return i.toLocaleLowerCase().contains(searchText.trim().toLocaleLowerCase())
	})

	const onIconSelected = (icon: LucideIcon) => {
		onSelect(icon)
		close()
	}
</script>

<div style="width:100%; position: relative;margin-bottom:10px">
	<input bind:value={searchText} class="icon-input" />
</div>

<div
	style="display:flex;justify-content: space-between; align-items:center;overflow-y:scroll;flex-wrap:wrap;max-width:100%;max-height:500px;gap:10px;border-radius:8px;border: 1px solid var(--divider)"
>
	{#each filteredIcons as i}
		<div
			style="border-radius:8px;background-color:black;height:55px;width:55px;cursor:pointer;text-align:center;display:flex;flex-direction:column;word-wrap:break-word"
			on:click={() => onIconSelected(i)}
		>
			<Icon name={i} />
			<span style="font-size:7px">{i}</span>
		</div>
	{/each}
</div>

<style>
	.icon-input {
		width: 100%;
		border: 1px solid rgb(54, 54, 54);
		background-color: rgba(1, 1, 1, 0.2);
		border-radius: 4px;
		padding: 8px;
		z-index: 1 !important;
		position: relative;
	}
</style>
