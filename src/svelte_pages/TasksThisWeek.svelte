<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import Container from "../svelte/Container.svelte";
    import { isThisWeek } from "date-fns";
    import WeeklyProgressRing from "../svelte/WeeklyProgressRing.svelte";
    import ProgressOnSchedule from "../svelte/ProgressOnSchedule.svelte";
    import { sortTasksByDate } from "../utils";
    import { formatDateRelativeToNow } from "../date_utils";
    import DayView from "../svelte/DayView.svelte";

    export let plugin: TaskrPlugin;
    export let addBottomPadding: boolean = false;

    let sections: string[] = [];
    let groupings: Record<string, Task[]> = {};

    allTasksCache.subscribe((ts: Task[]) => {
        const tasks = ts.filter((task: Task) => {
            if (
                task.isOverdue() ||
                (task.completed_date &&
                    isThisWeek(task.completed_date, { weekStartsOn: 1 })) ||
                (task.scheduled_date &&
                    isThisWeek(task.scheduled_date, { weekStartsOn: 1 })) ||
                (task.due_date &&
                    isThisWeek(task.due_date, { weekStartsOn: 1 }))
            ) {
                return true;
            }
            return false;
        });

        groupings = sortTasksByDate(tasks.slice(), false).reduce(
            (accum: any, task: Task) => {
                const dt = task.scheduled_date || task.due_date;

                let relativeDateStr = dt
                    ? formatDateRelativeToNow(dt)
                    : "Unscheduled";

                if (!task.complete && task.isOverdue()) {
                    relativeDateStr = "Overdue";
                }
                if (task.complete) {
                    relativeDateStr = "Completed";
                }

                accum[relativeDateStr] = (accum[relativeDateStr] || []).concat([
                    task,
                ]);
                return accum;
            },
            {}
        );
        sections = Object.keys(groupings);

        if (sections.includes("Completed")) {
            sections.push(sections.splice(sections.indexOf("Completed"), 1)[0]);
            groupings["Completed"] = sortTasksByDate(
                groupings["Completed"],
                true
            );
        }
    });
</script>

<Container {addBottomPadding}>
    <div
        style="display:flex;column-gap:10px; row-gap:10px;overflow-x:scroll;margin-bottom:10px"
    >
        <WeeklyProgressRing {plugin} />
        <ProgressOnSchedule {plugin} />
    </div>

    {#each sections as section}
        <DayView {plugin} dayLabel={section} tasks={groupings[section]} />
    {/each}

    {#if sections.length === 0}
        <em style="font-size:12px;color:grey;text-align:center"
            >No tasks to display</em
        >
    {/if}
</Container>

<style>
</style>
