<script lang="ts">
    import { differenceInDays, parseISO, isAfter, startOfDay, subDays } from "date-fns";
    import type TaskrPlugin from "main";
    import type { Task } from "../task";
    import { allTasksCache } from "../cache";

    export let plugin: TaskrPlugin;

    let daysUntilComplete: number = 0
    let difference: number = 0
    
    allTasksCache.subscribe((tasks: Task[]) => {
        // Rate of completion (hr/day) over past week
        const completionRate = tasks.filter((task: Task) => {
           return task.complete && task.completed_date && isAfter(task.completed_date, subDays(startOfDay(new Date()), 7))
        }).reduce((accumulator: number, task: Task) => {
            return accumulator + (task.effort ?? 0)
        }, 0) / 60 / 7


        const hoursCompleted: number = tasks.filter((task: Task) => {
            return task.complete && task.completed_date
        }).reduce((accumulator: number, task: Task) => {
            return accumulator + (task.effort ?? 0)
        }, 0) / 60
        const hoursToCompleteByToday = (plugin.settings.DailyBandwidth || 1) * Math.ceil(differenceInDays(new Date(), parseISO(plugin.settings.TaskCompletionStartDate)));
        difference = hoursCompleted - hoursToCompleteByToday

        daysUntilComplete = Math.ceil(-difference / (Math.max(completionRate - plugin.settings.DailyBandwidth, 0)))
        
    })

    const color = 'cyan'
</script>

{#if isFinite(daysUntilComplete) && daysUntilComplete > 0}
<div class="statistic-container">
        <span style={`font-weight:bold; font-size:36px; color:${color}`}>{daysUntilComplete}</span>
        <div style="flex-grow:1; padding-left:10px;">
            <span style="font-size:14px;white-space:nowrap">Days Until</span>
            <br />
            <span style={`color:${color};white-space:nowrap`}>
                Break-Even
            </span>
        </div>
</div>
{/if}

{#if difference > 0}
<div class="statistic-container">
        <span style={`font-weight:bold; font-size:36px; color:rgb(0,255,0)`}>{Math.floor(difference / (plugin.settings.DailyBandwidth ?? 1))}</span>
        <div style="flex-grow:1; padding-left:10px;">
            <span style="font-size:14px">{`Day${Math.floor(difference / (plugin.settings.DailyBandwidth ?? 1)) === 1 ? '' : 's'}`}</span>
            <br />
            <span style={`color:rgb(0,255,0)`}>
                To Relax
            </span>
        </div>
</div>
{/if}

<style>
    .statistic-container {
        border-radius: 6px;
        display: flex;
        background-color: #141414;
        padding: 3px 10px;
        align-items: center;
    }
</style>
