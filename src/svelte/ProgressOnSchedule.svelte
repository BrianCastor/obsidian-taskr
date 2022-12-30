<script lang="ts">
    import { isThisWeek, startOfWeek, differenceInDays } from "date-fns";
    import type TaskrPlugin from "main";
    import type { Task } from "../task";
    import { allTasksCache } from "../cache";

    export let plugin: TaskrPlugin;

    let tasksCompletedThisWeek: Task[] = []
    
    allTasksCache.subscribe((tasks: Task[]) => {
        tasksCompletedThisWeek = tasks.filter((task: Task) => {
            return task.complete && task.completed_date && isThisWeek(task.completed_date)
        })
    })

    $: hoursCompletedThisWeek = tasksCompletedThisWeek.reduce((accumulator: number, task: Task) => {
        return accumulator + (task.effort ?? 0)
    }, 0) / 60

    $: hoursToCompleteByToday = (plugin.settings.DailyBandwidth || 1) * Math.ceil(differenceInDays(new Date(), startOfWeek(new Date())));
    $: hoursToCompleteThisWeek = (plugin.settings.DailyBandwidth || 1) * 7;
    $: deficit = hoursCompletedThisWeek - hoursToCompleteByToday
    $: color = deficit > 0 ? 'rgb(0,255,0)' : (deficit === 0 ? 'white' : 'rgb(255,0,0)')
    $: isCompleteForWeek = hoursCompletedThisWeek >= hoursToCompleteThisWeek
</script>

<div class="statistic-container">
    {#if isCompleteForWeek}
        <span style="font-size:12px; text-transform: uppercase;color:rgb(0,255,100);text-align:center">Week complete</span>
    {:else}
        <span style={`font-weight:bold; font-size:36px; color:${color}`}>{Math.abs(Math.round(deficit*10)/10)}</span>
        <div style="flex-grow:1; padding-left:10px;">
            <span style="font-size:14px">HR</span>
            <br />
            <span style={`color:${color}`}>
                {#if deficit >= 0}
                    Ahead
                {:else}
                    Behind
                {/if}
            </span>
        </div>
    {/if}
</div>

<style>
    .statistic-container {
        border-radius: 6px;
        display: flex;
        background-color: #141414;
        padding: 10px;
        align-items: center;
    }
</style>
