<script lang="ts">
	import { showDropdownMenu } from '../components/DropdownMenu'
	export let category: string | undefined
	export let setCategory: (category: string) => void
	export let size: 'small' | 'large' = 'small'

	let container: HTMLDivElement
	let options = [
		'Personal',
		'Health',
		'Social',
		'Career',
		'Music',
		'Chore',
		'Apartment',
		'Fitness'
	].map((opt: string) => {
		return {
			label: opt,
			//@ts-ignore
			onClick: () => setCategory(opt)
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
		{category}
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
