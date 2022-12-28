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

    let expanded: boolean = false;
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
        } else {
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
        task.completed_date = dt;
        plugin.fileInterface.createUpdateTask(task);
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
            if (vs.type === "markdown") {
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

        let leaf = plugin.app.workspace.getLeaf(true);
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
            <Checkbox
                checked={task.complete}
                onChange={() => onToggleTaskComplete()}
            />
        </div>
        <div style="display:block;flex-grow:1">
            <div style="display:flex; alignItems:center;flex-wrap:wrap;row-gap:10px;">
                <div
                    bind:this={taskContentEl}
                    on:click={() => navigateToTask()}
                    class={task.complete
                        ? "containerLi completed"
                        : "containerLi"}
                    style="margin-right:10px"
                />
                {#if !expanded}
                    <div style="display: flex; align-items:center">
                        {#if task.effort}
                            <LoeChip
                                effort={task.effort}
                                setEffort={onSetEffort}
                            />
                        {/if}
                        {#if task.project}
                            <ProjectSelector
                                project={task.project}
                                setProject={onSetProject}
                                hideText
                            />
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
        <div
            style="color:grey;padding-right:10px;cursor:pointer;"
            on:click={() => (expanded = !expanded)}
        >
            {#if expanded}
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
        </div>
    </div>
    {#if expanded}
        <div
            style="margin-left:9px; margin-top:6px; padding-left:20px; padding-top:10px; padding-bottom:20px; border-left:2px solid grey"
        >
            <div
                style="display:flex; alignItems:center;flex-wrap:wrap;row-gap:10px"
            >
                <DateChip
                    date={task.scheduled_date}
                    setDate={onSetScheduledDate}
                    emoji={"ON"}
                />
                <DateChip
                    date={task.due_date}
                    setDate={onSetDueDate}
                    emoji={"DUE"}
                />
                {#if task.complete}
                    <DateChip
                        date={task.completed_date}
                        setDate={onSetCompletedDate}
                        emoji={"✅"}
                        complete={task.complete}
                    />
                {/if}
                <LoeChip effort={task.effort} setEffort={onSetEffort} />
                <ProjectSelector
                    project={task.project}
                    setProject={onSetProject}
                />
            </div>
        </div>
    {/if}
</li>

<style>
.containerDiv {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    row-gap: 10px;
}
.containerLi:hover {
    background-color: rgb(1, 1, 1, 0.2);
    cursor: pointer;
}
.containerLi.completed {
    text-decoration: line-through;
    color: grey !important;
}
</style>
