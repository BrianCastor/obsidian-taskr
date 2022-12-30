<script lang="ts">
    import type TaskrPlugin from "main";
    import type { Task } from "../task";
    import { allTasksCache } from "../cache";
    import { isThisWeek } from "date-fns";
    import ProgressRing from "./ProgressRing.svelte";

    export let plugin: TaskrPlugin

    let tasksCompletedThisWeek: Task[] = []

    allTasksCache.subscribe((tasks: Task[]) => {
        tasksCompletedThisWeek = tasks.filter((task: Task) => {
            return task.complete && task.completed_date && isThisWeek(task.completed_date)
        })
    })

    $: hoursCompletedThisWeek = tasksCompletedThisWeek.reduce((accumulator: number, task: Task) => {
        return accumulator + (task.effort ?? 0)
    }, 0) / 60

    $: hoursToCompleteThisWeek = (plugin.settings.DailyBandwidth || 1) * 7;
    $: percentComplete = hoursCompletedThisWeek / hoursToCompleteThisWeek
</script>

<div class="statistic-container">
    <ProgressRing progress={percentComplete} color="cyan"></ProgressRing>
    <div style="flex-grow:1; padding-left:10px;">
        <span style="font-size:14px">Weekly Progress</span>
        <br/>
        <span style="color:cyan;font-weight:bold;">{Math.round(hoursCompletedThisWeek * 10) / 10}/{hoursToCompleteThisWeek} HR</span>
    </div>
</div>

<style>
    .statistic-container {
        border-radius: 6px;
        display:flex;
        background-color:#141414;
        max-width:178px;
        padding:10px;
        align-items: center;
    }
</style>