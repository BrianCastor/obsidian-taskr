<script lang="ts">
	import { showDropdownMenu } from '../components/DropdownMenu'
	import { Frequency } from 'rrule'

	export let frequency: Frequency | undefined
	export let setFrequency: (frequency: Frequency) => void
	export let size: 'small' | 'large' = 'small'

	let container: HTMLDivElement
	let options = ['DAILY', 'WEEKLY', 'MONTHLY'].map((opt: keyof Frequency) => {
		return {
			label: opt,
			//@ts-ignore
			value: Frequency[opt],
			//@ts-ignore
			onClick: () => setFrequency(Frequency[opt])
		}
	})

	let selectedOption: any = undefined

	$: {
		selectedOption = options.find((obj) => obj.value === frequency)
	}
</script>

<div
	class={`chip-container ${size}`}
	style={`color:grey}`}
	bind:this={container}
	on:click|stopPropagation={() => showDropdownMenu(options, container)}
>
	<div style="font-weight:bold;">
		{selectedOption?.label}
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
