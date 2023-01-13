<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import Container from "../svelte/Container.svelte";
    import TaskList from "../svelte/TaskList.svelte";
    import { isToday } from "date-fns";
    import WeeklyProgressRing from "../svelte/WeeklyProgressRing.svelte";
    import ProgressOnSchedule from "../svelte/ProgressOnSchedule.svelte";

    export let plugin: TaskrPlugin;
    export let addBottomPadding: boolean = false;

    let tasks: Task[] = [];

    allTasksCache.subscribe((ts: Task[]) => {
        tasks = ts.filter((task: Task) => {
            if (
                task.isOverdue() || 
                (task.completed_date && isToday(task.completed_date)) || 
                (task.scheduled_date && isToday(task.scheduled_date)) || 
                (task.due_date && isToday(task.due_date)) 
            ) {
                return true;
            }
            return false;
        });
    });
</script>

<Container addBottomPadding={addBottomPadding}>
    <div style="display:flex;column-gap:10px; row-gap:10px;overflow-x:scroll">
        <WeeklyProgressRing {plugin} />
        <ProgressOnSchedule {plugin} />
    </div>
    <TaskList
        tasks={tasks}
        plugin={plugin}
        groupBy="status"
    />
</Container>

<style>
</style>