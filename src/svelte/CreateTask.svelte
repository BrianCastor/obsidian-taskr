<script lang="ts">
    import type { App } from "obsidian";
    import { parse as NLPParse } from "chrono-node";
    import { Task } from "../task";
    import DateChip from "./DateChip.svelte";
    import LoeChip from "./LOE_Chip.svelte";
    import ProjectSelector from "./ProjectSelector.svelte";
    import { allEfforts, allProjects } from "../utils";

    export let close: () => void;
    export let store: (task: Task) => void;
    export let app: App;

    let inputText = "";
    let title: string = "";
    let due: Date | undefined;
    let scheduled: Date | undefined;
    let effort: number | undefined;
    let project: string | undefined;

    let inputEl: HTMLElement;

    const save = () => {
        const newTask = new Task(
          undefined,
          title,
          due,
          false,
          project,
          scheduled,
          undefined,
          undefined,
          effort
        );
        store(newTask);
        close();
    };

    $: {
        let text = inputEl ? inputEl.textContent || inputEl.innerText || "" : inputText;

        //Get dates
        const parsedDates: any = NLPParse(text);
        if (parsedDates.length > 0) {
            const parsedDate = parsedDates[0].start.date();
            due = parsedDate;
        }

        parsedDates.forEach((parsedDate:any) => {
            text = text.replace(parsedDate.text, "")
        })

        //Get projects
        const projects = allProjects()
        const tags = text.split(' ').filter((term: string) => term.startsWith('#'))
        tags.map((tag: string) => {
            const matchingProject = projects.find((proj: Record<string,string>) => proj.label.toLowerCase().replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim() === tag.toLowerCase().replace('#', '').trim())
            if (matchingProject) {
                project = matchingProject.label
                text = text.replace(tag, "")
            }
        })

        //Get Effort
        text.split(' ').map((term: string) => {
            const matchingEffort = allEfforts().find((t: any)=> t.autoSuggestTerm?.toLowerCase() === term.toLowerCase().trim());
            if (matchingEffort) {
                effort = matchingEffort.value
                text = text.replace(term, "")
            }
        })

        title = text.trim();
    }

    function onSetDueDate(dt: Date | undefined) {
        due = dt;
    }

    function onSetScheduledDate(dt: Date | undefined) {
        scheduled = dt;
    }

    function onSetEffort(eff: number | undefined) {
        effort = eff;
    }

    function onSetProject(pj: string | undefined) {
        project = pj;
    }

    function handleKeyPress(e: any) {
        if (e.key === 'Enter') {
            save();
        }
    }
</script>

<div style="width:100%">
    <div
        contenteditable="true"
        bind:innerHTML={inputText}
        class="task-input"
        bind:this={inputEl}
        on:keypress={handleKeyPress}
    ></div>

</div>
<div style="width:100%;margin-top:10px">
    <div><span>{title}</span></div>
    <div style="display:flex; alignItems:center; margin-top:5px">
        <DateChip date={scheduled} setDate={onSetScheduledDate} emoji={"🗓️"} size="large"/>
        <DateChip date={due} setDate={onSetDueDate} emoji={"🕒"} size="large" />
        <LoeChip {effort} setEffort={onSetEffort} size="large" />
        <ProjectSelector project={project} setProject={onSetProject} size="large"/>
    </div>
</div>

<div style="width:100%;margin-top:10px">
    <button on:click={save} style="width:100%;height:40px">Save</button>
</div>

<style>
    .hidden {
        display: none;
    }

    label {
        width: 150px;
        display: inline-block;
    }

    #task-inputText {
        width: 100%;
        height: 40px;
    }

    .task-input {
        width:100%;
        border:1px solid rgb(54, 54, 54);
        background-color:black;
        border-radius: 4px;
        padding:10px;
        
    }
</style>
