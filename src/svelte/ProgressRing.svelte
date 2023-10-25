<script lang="ts">
	export let progress: number
	export let color: string

	$: background = `
        radial-gradient(#141414 50%, transparent 51%),
        conic-gradient(transparent 0deg ${360 * progress}deg, rgb(70,70,70) ${
		360 * progress
	}deg 360deg),
        ${color};
    `

	$: cssVarStyles = `--background:${background}`
</script>

<div id="progress-circle" style={cssVarStyles} />

<style>
	#progress-circle {
		background: var(--background);
		border-radius: 50%;
		width: 40px;
		height: 40px;
	}
</style>
