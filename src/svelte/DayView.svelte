<script lang="ts">
    import type { Task } from "src/task";
    import type TaskrPlugin from "../main";
    import TaskListItem from "./TaskListItem.svelte";

    export let plugin: TaskrPlugin;
    export let dayLabel: string;
    export let tasks: Task[] = [];

    let totalEffort = 0;
    let hasUnknownEfforts: boolean = false;
    let showing = true;

    const getColor = (eff: any) => {
        if (!eff) return "grey";
        if (eff <= 10) return "rgb(60,250,60)";
        if (eff <= 30) return "rgb(30,235,250)";
        if (eff <= 60) return "rgb(255, 255, 20)";
        if (eff <= 120) return "rgb(255,87,51)";
        if (eff <= 240) return "rgb(255,20,255)";
        if (eff > 240) return "red";
    };

    $: {
        totalEffort = tasks.reduce((summer: number, task: Task) => {
            return summer + (task.effort || 0);
        }, 0);

        hasUnknownEfforts = tasks.find(
            (task: Task) => task.effort === undefined
        )
            ? true
            : false;
    }
</script>

<div class="card2">
    <div
        class="headerContainer"
        on:click={() => {
            showing = !showing;
        }}
    >
    <div style="flex-grow:1">
        <span
            class={dayLabel !== "Unscheduled"
                ? dayLabel !== "Overdue"
                    ? "header"
                    : "header headerOverdue"
                : "header headerUnscheduled"}
        >
            {dayLabel}
        </span>
        <span style={"font-size:13px;color:" + getColor(totalEffort)}
            >&nbsp;{totalEffort.toString()}{#if hasUnknownEfforts}?{/if}m</span
        >
    </div>
    <div>
        {#if !showing}
            <span style="color:rgb(100,100,100);font-size:12px">{tasks.length}&nbsp;&nbsp;></span>
        {:else}
        <span style="color:rgb(100,100,100);font-size:12px">v</span>
        {/if}
    </div>
    </div>
    {#if showing}
        <div style="margin-left:14px;">
            {#each tasks as task (task.id)}
                <div
                    style={!task.scheduled_date ? "color:grey !important" : ""}
                >
                    <TaskListItem {task} {plugin} hideDueDate={true} />
                    <div style="height:14px" />
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .headerUnscheduled {
        color: grey !important;
    }
    .headerOverdue {
        color: rgb(250, 45, 45) !important;
    }
    .header {
        display: inline;
        text-transform: uppercase;
        font-size: 13px;
        color: lightgrey;
    }

    .headerContainer {
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 4px;
        margin-bottom: 12px;
        padding-bottom: 6px;
        background-color: rgb(20, 20, 20);
        cursor: pointer;
        display:flex;
    }

    .card2 {
        background-color: rgb(25, 25, 25);
        border-radius: 2px;
        margin-bottom: 10px;
    }
</style>
