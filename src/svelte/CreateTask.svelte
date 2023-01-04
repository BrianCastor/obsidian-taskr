<script lang="ts">
    import type { App } from "obsidian";
    import { parse as NLPParse } from "chrono-node";
    import { Task } from "../task";
    import DateChip from "./DateChip.svelte";
    import LoeChip from "./LOE_Chip.svelte";
    import ProjectSelector from "./ProjectSelector.svelte";
    import { allEfforts } from "../utils";
    import { allProjectsCache } from "../cache";
    import type { Project } from "../project";

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

        //Remove extra spaces
        text = text.replace(/\s+/g, " ");

        //Get dates
        const parsedDates: any = NLPParse(text);
        parsedDates.forEach((pd: any) => {
            const parsedDate = pd.start.date();
            const duePossibilities = [
                `Due ${pd.text}`,
                `due ${pd.text}`,
            ]
            const foundDue = duePossibilities.find((poss: string) => text.includes(poss))
            if (foundDue) {
                due = parsedDate
                text = text.replace(foundDue, "")
            }
            else {
                scheduled = parsedDate
                text = text.replace(pd.text, "")
            }
        })

        //Get projects
        const projects = $allProjectsCache
        const tags = text.split(' ').filter((term: string) => term.startsWith('#'))
        tags.map((tag: string) => {
            const matchingProject = projects.find((proj: Project) => proj.title.toLowerCase().replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim() === tag.toLowerCase().replace('#', '').trim())
            if (matchingProject) {
                project = matchingProject.title
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
    <div style="display:flex; alignItems:center; margin-top:5px;flex-wrap:wrap;row-gap:10px;">
        <DateChip date={scheduled} setDate={onSetScheduledDate} emoji={"ON"} size="normal"/>
        <DateChip date={due} setDate={onSetDueDate} emoji={"DUE"} size="normal" />
        <LoeChip {effort} setEffort={onSetEffort} size="small" />
        <ProjectSelector project={project} setProject={onSetProject} size="small"/>
    </div>
</div>

<div style="width:100%;margin-top:10px">
    <button class="button" on:click={save} style="width:100%;height:40px">Save</button>
</div>

<style>
    .task-input {
        width:100%;
        border:1px solid rgb(54, 54, 54);
        background-color:black;
        border-radius: 4px;
        padding:10px;
        
    }
</style>
