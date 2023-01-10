<script lang="ts">
    import { parse as NLPParse } from "chrono-node";
    import { Task } from "../task";
    import DateChip from "./DateChip.svelte";
    import LoeChip from "./LOE_Chip.svelte";
    import ProjectSelector from "./ProjectSelector.svelte";
    import { allEfforts } from "../utils";
    import { allProjectsCache } from "../cache";
    import type { Project } from "../project";
    import { onDestroy, onMount } from "svelte";
    import { FileSuggest } from "../components/fileSuggest";
    import type { App, TFile } from "obsidian";
    import type TaskrPlugin from "main";

    export let close: () => void;
    export let store: (task: Task) => void;
    export let app: App;
    export let plugin: TaskrPlugin;

    let inputText = "";
    let title: string = "";
    let due: Date | undefined;
    let scheduled: Date | undefined;
    let effort: number | undefined;
    let project: string | undefined;

    let inputEl: HTMLElement;
    let suggest: FileSuggest | undefined;

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
        // Unescape the div content
        const doc = new DOMParser().parseFromString(inputText, "text/html");
        let text = doc.documentElement.textContent ?? '';

        //Remove extra spaces
        text = text.replace(/\s+/g, " ");

        //Get dates
        const parsedDates: any = NLPParse(text);
        parsedDates.forEach((pd: any) => {
            const parsedDate = pd.start.date();
            const duePossibilities = [`Due ${pd.text}`, `due ${pd.text}`];
            const foundDue = duePossibilities.find((poss: string) =>
                text.includes(poss)
            );
            if (foundDue) {
                due = parsedDate;
                text = text.replace(foundDue, "");
            } else {
                scheduled = parsedDate;
                text = text.replace(pd.text, "");
            }
        });

        //Get projects
        const projects = $allProjectsCache;
        const tags = text
            .split(" ")
            .filter((term: string) => term.startsWith("#"));
        tags.map((tag: string) => {
            const matchingProject = projects.find(
                (proj: Project) =>
                    proj.title
                        .toLowerCase()
                        .replace(
                            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                            ""
                        )
                        .trim() === tag.toLowerCase().replace("#", "").trim()
            );
            if (matchingProject) {
                project = matchingProject.title;
                text = text.replace(tag, "");
            }
        });

        //Get Effort
        text.split(" ").map((term: string) => {
            const matchingEffort = allEfforts().find(
                (t: any) =>
                    t.autoSuggestTerm?.toLowerCase() ===
                    term.toLowerCase().trim()
            );
            if (matchingEffort) {
                effort = matchingEffort.value;
                text = text.replace(term, "");
            }
        });

        title = text.trim();

        //TODO - split out text better
        if (inputText.contains("@")) {
            suggest?.suggestBasedOnText(inputText.split("@")[1], 'people');
        } else if (inputText.contains('#')) {
            suggest?.suggestBasedOnText(inputText.split("#")[1], 'projects');
        } else {
            suggest?.close();
        }
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
        if (e.key === "Enter" && !suggest?.open()) {
            save();
        }
    }

    function onSuggestSelect(tfile: TFile) {
        const backLink = ` [[${tfile.basename}]] `;

        //TODO this could be less hacky
        if (inputText.contains('@')) {
            inputText = inputText.split("@")[0] + backLink + "&nbsp;"
        } else if (inputText.contains('#')) {
            inputText = inputText.split("#")[0] + backLink + "&nbsp;"
            onSetProject(tfile.basename)
        } else {
            return;
        }        

        inputEl.focus();

        //TODO - make less hacky
        setTimeout(() => {
            if (
                typeof window.getSelection != "undefined" &&
                typeof document.createRange != "undefined"
            ) {
                var range = document.createRange();
                range.selectNodeContents(inputEl);
                range.collapse(false);
                var sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 50);
    }

    onMount(() => {
        suggest = new FileSuggest(app, app.scope, plugin, inputEl, onSuggestSelect);
    });

    onDestroy(() => {
        suggest?.close();
        suggest?.destroy();
    });
</script>

<div style="width:100%">
    <div
        contenteditable="true"
        bind:innerHTML={inputText}
        class="task-input"
        bind:this={inputEl}
        on:keypress={handleKeyPress}
    />
</div>
<div style="width:100%;margin-top:10px">
    <div
        style="display:flex; alignItems:center; margin-top:5px;flex-wrap:wrap;row-gap:10px;"
    >
        <DateChip
            date={scheduled}
            setDate={onSetScheduledDate}
            emoji={"ON"}
            size="normal"
        />
        <DateChip
            date={due}
            setDate={onSetDueDate}
            emoji={"DUE"}
            size="normal"
        />
        <LoeChip {effort} setEffort={onSetEffort} size="small" />
        <ProjectSelector {project} setProject={onSetProject} size="small" />
    </div>
</div>

<div style="width:100%;margin-top:10px">
    <button class="button" on:click={save} style="width:100%;height:40px"
        >Save</button
    >
</div>

<style>
    .task-input {
        width: 100%;
        border: 1px solid rgb(54, 54, 54);
        background-color: black;
        border-radius: 4px;
        padding: 10px;
    }
</style>
