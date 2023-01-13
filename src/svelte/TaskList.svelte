<script lang="ts">
    import type TaskrPlugin from "../main";
    import type { Task } from "../task";
    import DayView from "./DayView.svelte";
    import { sortTasksByDate } from "../utils";
    import { formatDateRelativeToNow } from "../date_utils";

    export let plugin: TaskrPlugin;
    export let tasks: Task[];
    export let descending: boolean = false;
    export let groupBy: "date" | "status" = "date";

    let groupings: any = {};
    let sections: string[] = []

    $: {
        if (groupBy === "status") {
            groupings = sortTasksByDate(tasks.slice(), descending).reduce(
                (accum: any, task: Task) => {
                    let key;
                    if (task.complete) key="Completed"
                    else if (task.isOverdue()) key="Overdue"
                    else if (task.scheduled_date) key="Scheduled"
                    else if (task.due_date) key = "Due"
                    else key = "Unscheduled"

                    accum[key] = (accum[key] || []).concat(task)
                    return accum
                }, {}
            )
            sections = ["Overdue", "Scheduled", "Due", "Unscheduled", "Completed"].filter((s) => Object.keys(groupings).includes(s))
        } else {
            groupings = sortTasksByDate(tasks.slice(), descending).reduce(
                (accum: any, task: Task) => {
                    const dt =
                        task.completed_date ||
                        task.scheduled_date ||
                        task.due_date;

                    let relativeDateStr = dt
                        ? formatDateRelativeToNow(dt)
                        : "Unscheduled";

                    if (!task.complete && task.isOverdue()) {
                        relativeDateStr = "Overdue";
                    }

                    accum[relativeDateStr] = (
                        accum[relativeDateStr] || []
                    ).concat([task]);
                    return accum;
                },
                {}
            );
            sections = Object.keys(groupings)
        }
    }
</script>

<ul class="task-list-ul">
    {#each sections as section, index}
        <DayView {plugin} dayLabel={section} tasks={groupings[section]} />
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
