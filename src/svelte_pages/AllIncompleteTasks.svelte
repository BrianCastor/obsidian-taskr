<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import Container from "../svelte/Container.svelte";
    import TaskList from "../svelte/TaskList.svelte";
    import WeeklyProgressRing from "../svelte/WeeklyProgressRing.svelte";
    import ProgressOnSchedule from "../svelte/ProgressOnSchedule.svelte";

    export let plugin: TaskrPlugin;

    let tasks: Task[] = [];

    allTasksCache.subscribe((ts: Task[]) => {
        tasks = ts.filter((task: Task) => {
            return !task.complete
        });
    });
</script>

<Container>
    <div style="display:flex;column-gap:10px; row-gap:10px;overflow-x:scroll">
        <WeeklyProgressRing {plugin} />
        <ProgressOnSchedule {plugin} />
    </div>
    <TaskList
        tasks={tasks}
        plugin={plugin}
    />
</Container>

<style>
</style>