<script lang="ts">
    import type TaskrPlugin from "../main";
    import { allTasksCache } from "../cache";
    import type { Task } from "../task";
    import { onMount } from "svelte";
    import { prepareFuzzySearch, type FuzzyMatch } from "obsidian";
    import TaskListItem from "./TaskListItem.svelte";

    export let close: () => void;
    export let plugin: TaskrPlugin;

    let inputEl: HTMLElement;

    let tasks: Task[] = [];
    let displayTasks: Task[] = [];
    let searchText = "";

    let timer: string | number | NodeJS.Timeout | undefined;

    const debounce = (v: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchText = v;
        }, 250);
    };

    allTasksCache.subscribe((ts: Task[]) => {
        tasks = ts
    });

    $: {
        if (searchText.length === 0) {
            displayTasks = tasks;
        } else {
            const fuzzy = prepareFuzzySearch(searchText);
            const results: FuzzyMatch<Task>[] = [];
            for (const t of tasks) {
                const match = fuzzy(t.title);
                if (match) {
                    if (t.complete) {
                        match.score = match.score * 2
                    }
                    results.push({
                        item: t,
                        match: match,
                    });
                }                    
            }
            displayTasks = results
                .sort((a, b) => b.match.score - a.match.score)
                .map((result) => result.item);
        }
    }

    onMount(() => {
        inputEl.focus();
    });
</script>

<div style="width:100%; position: relative">
    <div class="search-input-container" style="margin-bottom:10px">
        <input
            bind:this={inputEl}
            on:input={(event) => {
                //@ts-ignore
                debounce(event.target.value);
            }}
            enterkeyhint="search"
            type="search"
            spellcheck="false"
            placeholder="Search Tasks"
        />
    </div>
    <div style="display:grid;grid-row-gap:12px;">
        {#if displayTasks.length === 0}
            <em style="font-size:12px;color:grey;text-align:center;margin-top:20px; margin-bottom:15px"
                >No tasks found</em
            >
        {:else}
        <ul class="task-list-ul" style="padding-left:0px">
            {#each displayTasks as task (task.id)}
                <div
                    style={!task.scheduled_date ? "color:grey !important" : ""}
                    class="task-container"
                >
                    <TaskListItem {task} {plugin} onNavigateAway={() => close()} />
                </div>
                <div style="border-bottom:1px solid rgb(50,50,50); width:100%; margin-top:20px;margin-bottom:20px">
                </div>
            {/each}
        </ul>
        {/if}
    </div>
</div>

<style>
    .task-container {
        white-space: normal;
        list-style: none;
    }
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
        margin-right: 10px;
        height: 22px;
        font-size: 11px;
        text-transform: uppercase;
        background-color: none;
        border: none;
        border-radius: 2px;
        color: rgb(26, 213, 213);
        width: auto !important;
    }
</style>
