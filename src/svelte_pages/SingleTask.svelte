<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import TaskListItem from "../svelte/TaskListItem.svelte";
    import Container from "../svelte/Container.svelte";

    export let plugin: TaskrPlugin;
    export let taskId: string;

    let task: Task | undefined = undefined;

    allTasksCache.subscribe((tasks: Task[]) => {
        task = tasks.find((task: Task) => task.id === taskId);
    });
</script>

<Container>
    <ul class="task-list-ul">
        {#if task}
            <TaskListItem {task} {plugin} />
        {:else}
            <em style="font-size:12px;color:grey;text-align:center"
                >Deleted task: {taskId}</em
            >
        {/if}
    </ul>
</Container>

<style>
    .task-list-ul {
        white-space: normal;
        list-style: none;
        padding-left: 0px;
        margin: 10px 0px;
    }
</style>
