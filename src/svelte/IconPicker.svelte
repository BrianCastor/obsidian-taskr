<script lang="ts">
	import { LUCIDE_ICONS, type LucideIcon } from '../types/lucide'
	import { showDropdownMenu } from '../components/DropdownMenu'
	import Icon from './Icon.svelte'

	export let icon: LucideIcon | undefined
	export let setIcon: (icon: LucideIcon) => void
	export let size: 'small' | 'large' = 'small'

	let container: HTMLDivElement
	let options = LUCIDE_ICONS.map((icon: LucideIcon) => {
		return {
			label: icon,
			value: icon,
			onClick: () => setIcon(icon)
		}
	})
</script>

<div
	class={`chip-container ${size}`}
	style={`color:grey}`}
	bind:this={container}
	on:click|stopPropagation={() => showDropdownMenu(options, container)}
>
	<em style="margin-right:8px; color:grey;">ICON</em>
	<div style="max-height:12px;height:12px;"><Icon name={icon ?? 'activity'} /></div>
</div>

<style>
	.chip-container {
		background-color: rgb(52, 52, 52);
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 10px;
		padding: 0px 5px;
		cursor: pointer;
		font-size: 14px;
	}
	.chip-container.small {
		font-size: 13px;
	}
	.chip-container.large {
		padding: 5px 10px;
		font-size: 14px;
	}
</style>
