<script lang="ts">
    import type { Task } from "src/task";
    import { slide } from "svelte/transition";
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

    const moveOverdueTasksToToday = () => {
        const overDueTasks = tasks.filter((task: Task) => task.isOverdue())
        overDueTasks.forEach((task: Task) => {
            task.scheduled_date = new Date()
            plugin.fileInterface.createUpdateTask(task);
        })
    }

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
        {#if dayLabel === 'Overdue'}
            <button on:click|stopPropagation={() => moveOverdueTasksToToday()} class="move-overdue-button">
                Move to today
            </button>
        {/if}
        {#if !showing}
            <span style="color:rgb(100,100,100);font-size:12px">
                {tasks.length}&nbsp;&nbsp;
            </span>
        {/if}

        <span style="color:grey;">
            {#if showing}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><polyline points="18 15 12 9 6 15" /></svg
                >
            {:else}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><polyline points="6 9 12 15 18 9" /></svg
                >
            {/if}
        </span>
    </div>
    {#if showing}
        <div transition:slide="{{ duration: 300 }}" style="margin-left:10px;display:grid;grid-row-gap:12px;padding-bottom:8px;">
            {#each tasks as task (task.id)}
                <div
                    style={!task.scheduled_date ? "color:grey !important" : ""}
                >
                    <TaskListItem {task} {plugin} />
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
    display: flex;
    align-items: center;
}

.card2 {
    background-color: rgb(25, 25, 25);
    border-radius: 2px;
    margin-bottom: 10px;
}

.move-overdue-button {
    margin-right:10px;
    height:22px;
    font-size:11px;
    text-transform: uppercase;
    background-color: none;
    border: none;
    border-radius: 2px;
    color: rgb(26, 213, 213);
    width: auto !important;
}
</style>
