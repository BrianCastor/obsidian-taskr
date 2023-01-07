<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import Container from "../svelte/Container.svelte";
    import TaskList from "../svelte/TaskList.svelte";
    import { isThisWeek } from "date-fns";
    import WeeklyProgressRing from "../svelte/WeeklyProgressRing.svelte";
    import ProgressOnSchedule from "../svelte/ProgressOnSchedule.svelte";

    export let plugin: TaskrPlugin;

    let tasks: Task[] = [];

    allTasksCache.subscribe((ts: Task[]) => {
        tasks = ts.filter((task: Task) => {
            if (
                task.isOverdue() || 
                (task.completed_date && isThisWeek(task.completed_date, {weekStartsOn: 1})) || 
                (task.scheduled_date && isThisWeek(task.scheduled_date, {weekStartsOn: 1})) || 
                (task.due_date && isThisWeek(task.due_date, {weekStartsOn: 1})) 
            ) {
                return true;
            }
            return false;
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