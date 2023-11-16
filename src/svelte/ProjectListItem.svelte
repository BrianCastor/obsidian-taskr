<script lang="ts">
	import type TaskrPlugin from '../main'
	import type { Project } from '../project'

	export let plugin: TaskrPlugin
	export let project: Project
</script>

<div class="project-container">
	<div style="font-size:18px">
		{project.title}
	</div>
	<div style="font-size:18px">
		{project.getProgress()}
	</div>
</div>

<style>
	.project-container {
		border-radius: 8px;
		background-color: rgb(30, 30, 30);
		width: 100%;
	}
</style>
