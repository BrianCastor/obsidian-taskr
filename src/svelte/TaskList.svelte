<script lang="ts">
    import type TaskrPlugin from "../main";
    import TaskListItem from "./TaskListItem.svelte";
    import { allTasksCache } from "../cache";
    import type { Task } from "src/task";
    import { startOfDay } from "date-fns";
    import DayView from "./DayView.svelte";
    import { sortTasksByDate } from "../utils";
    import { formatDateRelativeToNow } from "../date_utils";
    import WeeklyProgressRing from "./WeeklyProgressRing.svelte";
    import ProgressOnSchedule from "./ProgressOnSchedule.svelte";

    export let plugin: TaskrPlugin;
    export let filterParams: any;

    let displayTask: Task | undefined = undefined;
    let groupings: any = {};

    allTasksCache.subscribe((tasks: Task[]) => {
        if (filterParams.id) {
            const task = tasks.find(
                (task: Task) => task.id === filterParams.id
            );
            displayTask = task;
            return;
        }

        let reverse = false;
        if (filterParams.completed) {
            reverse = true;
            tasks = tasks.slice().filter((task: Task) => task.complete);
        } else {
            tasks = tasks.filter(
                (task: Task) =>
                    !task.complete ||
                    (task.scheduled_date &&
                        task.scheduled_date >= startOfDay(new Date()))
            );
        }

        if (filterParams.project) {
            tasks = tasks.filter((task: Task) => task.project === filterParams.project)
        }

        groupings = sortTasksByDate(tasks, reverse).reduce(
            (accum: any, task: Task) => {
                const dt =
                    task.completed_date || task.scheduled_date || task.due_date;

                let relativeDateStr = dt
                    ? formatDateRelativeToNow(dt)
                    : "Unscheduled";

                if (!filterParams.completed && task.isOverdue()) {
                    relativeDateStr = "Overdue";
                }

                accum[relativeDateStr] = (accum[relativeDateStr] || []).concat([
                    task,
                ]);
                return accum;
            },
            {}
        );
    });
</script>

<div style="display:flex;justify-content:center;">
    <div style="max-width:725px; margin:auto; flex-grow:1">
        <div style="display:flex;column-gap:10px; row-gap:10px;overflow-x:scroll">
            {#if !filterParams.id && !filterParams.project}
                <WeeklyProgressRing plugin={plugin}></WeeklyProgressRing>
                <ProgressOnSchedule plugin={plugin}></ProgressOnSchedule>
            {/if}
        </div>
        <ul class="task-list-ul">
            {#if filterParams.id}
                {#if displayTask}
                    <TaskListItem task={displayTask} {plugin} />
                {:else}
                    <em style="font-size:12px;color:grey;text-align:center"
                        >Deleted task: {filterParams.id}</em
                    >
                {/if}
            {:else}
                {#each Object.keys(groupings) as grouping, index}
                    <DayView
                        {plugin}
                        dayLabel={grouping}
                        tasks={groupings[grouping]}
                    />
                {/each}

                {#if (Object.keys(groupings).length === 0)}
                    <em style="font-size:12px;color:grey;text-align:center">No tasks to display</em>
                {/if}
            {/if}

        </ul>
    </div>
</div>

<style>
    .task-list-ul {
        white-space: normal;
        list-style: none;
        padding-left: 0px;
        margin: 10px 0px;
    }
</style>
