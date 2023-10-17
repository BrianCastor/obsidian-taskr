<script lang="ts">
	import { allEfforts } from '../utils'
	import { showDropdownMenu } from '../components/DropdownMenu'

	export let effort: number | undefined
	export let setEffort: (effort: number | undefined) => void
	export let size: 'small' | 'large' = 'small'

	let container: HTMLDivElement
	let options = allEfforts.map((opt: any) => {
		return {
			...opt,
			onClick: () => setEffort(opt.value)
		}
	})

	let selectedOption: any = undefined

	$: {
		selectedOption = effort ? options.find((opt: any) => opt.value === effort) : undefined
	}
</script>

<div
	class={`chip-container ${size}`}
	style={`color:${selectedOption?.color ?? 'grey'}`}
	bind:this={container}
	on:click|stopPropagation={() => showDropdownMenu(options, container)}
>
	<div style="font-weight:bold;">
		{#if selectedOption}
			{selectedOption.icon}
		{:else}
			<em>LOE</em>
		{/if}
	</div>
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
