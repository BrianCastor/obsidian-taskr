<script lang="ts">
    import type { Task } from "../task";
    import type TaskrPlugin from "../main";
    import { onMount } from "svelte";
    import { MarkdownRenderer, WorkspaceLeaf } from "obsidian";
    import DateChip from "./DateChip.svelte";
    import LoeChip from "./LOE_Chip.svelte";
    import Checkbox from "./Checkbox.svelte";
    import ProjectSelector from "./ProjectSelector.svelte";

    export let plugin: TaskrPlugin;
    export let task: Task;
    export let hideDueDate: boolean = false;

    let taskContentEl: HTMLDivElement;

    onMount(async () => {
        await renderMarkdown(task.title);
    });

    async function renderMarkdown(content: string): Promise<void> {
        // Escape leading '#' or '-' so they aren't rendered as headers/bullets.
        if (content.startsWith("#") || content.startsWith("-")) {
            content = `\\${content}`;
        }

        //@ts-ignore
        await MarkdownRenderer.renderMarkdown(content, taskContentEl, "", null);

        // Remove the wrapping '<p>' tag to force it to inline.
        const markdownContent = taskContentEl.querySelector("p");

        if (markdownContent) {
            markdownContent.parentElement?.removeChild(markdownContent);
            taskContentEl.innerHTML += markdownContent.innerHTML;
        }
    }

    function onToggleTaskComplete() {
        task.complete = !task.complete;
        if (task.complete) {
            task.completed_date = new Date();
        }
        else {
            task.completed_date = undefined;
        }
        plugin.fileInterface.createUpdateTask(task);
    }

    function onDeleteTask(task: Task) {
        plugin.fileInterface.deleteTask(task);
    }

    function onSetDueDate(dt: Date | undefined) {
        task.due_date = dt;
        plugin.fileInterface.createUpdateTask(task);
    }

    function onSetScheduledDate(dt: Date | undefined) {
        task.scheduled_date = dt;
        plugin.fileInterface.createUpdateTask(task);
    }

    function onSetCompletedDate(dt: Date | undefined) {
        //Don't want this to work yet
        return;
    }

    function onSetProject(project: string | undefined) {
        task.project = project;
        plugin.fileInterface.createUpdateTask(task);
    }

    function onSetEffort(effort: number | undefined) {
        task.effort = effort;
        plugin.fileInterface.createUpdateTask(task);
    }

    function navigateToTask() {
        const file = plugin.fileInterface.getTaskFileById(task.id);
        let existingLeaf = undefined;

        //Navigate to existing leaf instead of opening in new tab
        plugin.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
            const vs = leaf.getViewState();
            if (vs.type === 'markdown') {
                if (vs.state.file === task.filepath()) {
                    existingLeaf = leaf;
                    return;
                }
            }
        });
        if (existingLeaf) {
            plugin.app.workspace.setActiveLeaf(existingLeaf);
            return;
        }
        
        let leaf = plugin.app.workspace.getLeaf(true)
        leaf.openFile(file);
    }

    function onClickTaskContainer(evt: MouseEvent) {
        evt.stopPropagation();
        evt.preventDefault();
    }
</script>

<li on:contextmenu={onClickTaskContainer} style="margin-bottom:5px">
    <div class="containerDiv">
        <div style="margin-right:12px;display:flex;align-items:center;">
            <Checkbox checked={task.complete} onChange={() => onToggleTaskComplete()}></Checkbox>
        </div>
        <div style="display:block;flex-grow:1">
            <div style="display:flex; alignItems:center;flex-wrap:wrap">
                <div bind:this={taskContentEl} on:click={() => navigateToTask()} class={task.complete ? "containerLi completed" : "containerLi"} style="margin-right:15px"/>
                <div style="display: flex; align-items:center">
                {#if task.completed_date}
                    <DateChip date={task.completed_date} setDate={onSetCompletedDate} emoji={'✅'} complete={task.complete}></DateChip>
                {:else}
                    <DateChip date={task.scheduled_date} setDate={onSetScheduledDate} emoji={'🗓️'}></DateChip>
                    {#if !hideDueDate}
                    <DateChip date={task.due_date} setDate={onSetDueDate} emoji={'🕒'}></DateChip>
                    {/if}
                {/if}
                <LoeChip effort={task.effort} setEffort={onSetEffort}></LoeChip>
                <ProjectSelector project={task.project} setProject={onSetProject}></ProjectSelector>
                </div>
            </div>
        </div>
        <!--<div>
            <button
                style="margin-right:15px"
                on:click={() => onDeleteTask(task)}>❌</button
            >
        </div>-->
    </div>
</li>

<style>
    .containerDiv {
        width:100%;
        display:flex;
        flex-wrap:nowrap;
        align-items:center;
    }
    .containerLi:hover {
        background-color: rgb(1,1,1,.2);
        cursor:pointer;
    }
    .containerLi.completed {
        text-decoration: line-through;
        color: grey !important;
    }
</style>
