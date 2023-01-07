<script lang="ts">
    import type TaskrPlugin from "../main";
    import type { Task } from "../task";
    import DayView from "./DayView.svelte";
    import { sortTasksByDate } from "../utils";
    import { formatDateRelativeToNow } from "../date_utils";

    export let plugin: TaskrPlugin;
    export let tasks: Task[];
    export let descending: boolean = false;

    let groupings: any = {};

    $ : {
        groupings = sortTasksByDate(tasks.slice(), descending).reduce(
            (accum: any, task: Task) => {
                const dt =
                    task.completed_date || task.scheduled_date || task.due_date;

                let relativeDateStr = dt
                    ? formatDateRelativeToNow(dt)
                    : "Unscheduled";

                if (!task.complete && task.isOverdue()) {
                    relativeDateStr = "Overdue";
                }

                accum[relativeDateStr] = (accum[relativeDateStr] || []).concat([
                    task,
                ]);
                return accum;
            },
            {}
        );
    }
</script>

<ul class="task-list-ul">
    {#each Object.keys(groupings) as grouping, index}
        <DayView {plugin} dayLabel={grouping} tasks={groupings[grouping]} />
    {/each}

    {#if Object.keys(groupings).length === 0}
        <em style="font-size:12px;color:grey;text-align:center"
            >No tasks to display</em
        >
    {/if}
</ul>

<style>
    .task-list-ul {
        white-space: normal;
        list-style: none;
        padding-left: 0px;
        margin: 10px 0px;
    }
</style>
