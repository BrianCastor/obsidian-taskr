<script lang="ts">
	import type { LucideIcon } from '../types/lucide'
	import Icon from './Icon.svelte'
	import { IconPickerModal } from '../components/iconPickerModal'
	import type TaskrPlugin from '../main'

	export let icon: LucideIcon | undefined
	export let setIcon: (icon: LucideIcon) => void
	export let size: 'small' | 'large' = 'small'
	export let plugin: TaskrPlugin

	let container: HTMLDivElement

	const showIconPickerModal = () => {
		new IconPickerModal(plugin.app, plugin, (i: LucideIcon) => setIcon(i)).open()
	}
</script>

<div
	class={`chip-container ${size}`}
	style={`color:grey}`}
	bind:this={container}
	on:click|stopPropagation={() => showIconPickerModal()}
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
