<script lang="ts">
	import { showDropdownMenu } from '../components/DropdownMenu'

	export let quantity: number | undefined
	export let setQuantity: (quantity: number) => void
	export let size: 'small' | 'large' = 'small'

	let container: HTMLDivElement
	let options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((opt: number) => {
		return {
			label: `${opt.toString()} time${opt !== 1 ? 's' : ''}`,
			value: opt,
			onClick: () => setQuantity(opt)
		}
	})
</script>

<div
	class={`chip-container ${size}`}
	style={`color:grey}`}
	bind:this={container}
	on:click|stopPropagation={() => showDropdownMenu(options, container)}
>
	<div style="font-weight:bold;">
		{`${quantity?.toString() ?? '-'} time${quantity !== 1 ? 's' : ''}`}
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
