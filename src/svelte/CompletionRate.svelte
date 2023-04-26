<script lang="ts">
    import { isThisWeek, startOfWeek, differenceInDays, parseISO, isAfter, startOfDay, subDays } from "date-fns";
    import type TaskrPlugin from "main";
    import type { Task } from "../task";
    import { allTasksCache } from "../cache";

    export let plugin: TaskrPlugin;

    let completionRate: number = 0
    
    allTasksCache.subscribe((tasks: Task[]) => {
        const tasksCompletedInPeriod: Task[] = tasks.filter((task: Task) => {
           return task.complete && task.completed_date && isAfter(task.completed_date, subDays(startOfDay(new Date()), 7))
        })

        const hoursCompleted = tasksCompletedInPeriod.reduce((accumulator: number, task: Task) => {
            return accumulator + (task.effort ?? 0)
        }, 0) / 60
        completionRate = hoursCompleted/7
    })

    $: color = completionRate > plugin.settings.DailyBandwidth ? 'rgb(0,255,0)' : 'white'
</script>

<div class="statistic-container">
        <span style={`font-weight:bold; font-size:36px; color:${color};white-space:nowrap`}>{Math.abs(Math.round(completionRate*10)/10)}</span>
        <div style="flex-grow:1; padding-left:10px;">
            <span style="font-size:14px;white-space:nowrap">HR/DAY (W)</span>
            <br />
            <span style={`color:${color};white-space:nowrap`}>
                Completed
            </span>
        </div>
</div>

<style>
    .statistic-container {
        border-radius: 6px;
        display: flex;
        background-color: #141414;
        padding: 3px 10px;
        align-items: center;
    }
</style>
