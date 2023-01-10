<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import Container from "../svelte/Container.svelte";
    import TaskList from "../svelte/TaskList.svelte";

    export let plugin: TaskrPlugin;
    export let filePath: any;

    let tasks: Task[] = [];

    

    allTasksCache.subscribe((ts: Task[]) => {
        const linkingTaskIds = plugin.fileInterface.getTaskIdsLinkingToFile(filePath)
        tasks = ts.filter((task: Task) => {
            return !task.complete && linkingTaskIds.includes(task.id)
        });
    });
</script>

<Container>
    <TaskList
        tasks={tasks}
        plugin={plugin}
    />
</Container>

<style>
</style>