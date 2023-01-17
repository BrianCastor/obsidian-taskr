<script lang="ts">
    import { parse as NLPParse } from "chrono-node";
    import { Task } from "../task";
    import DateChip from "./DateChip.svelte";
    import LoeChip from "./LOE_Chip.svelte";
    import ProjectSelector from "./ProjectSelector.svelte";
    import { allEfforts } from "../utils";
    import { onDestroy, onMount } from "svelte";
    import { FileSuggest } from "../components/fileSuggest";
    import type { App, TFile } from "obsidian";
    import type TaskrPlugin from "main";

    export let close: () => void;
    export let store: (task: Task) => void;
    export let app: App;
    export let plugin: TaskrPlugin;

    let inputHTML = "";
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

    

    $ : {
        // Unescape the div content
        const doc = new DOMParser().parseFromString(inputHTML, "text/html");
        let textContent = doc.documentElement.textContent ?? '';

        //Remove extra spaces
        let text = textContent.replace(/\s+/g, " ");

        //Get dates
        const parsedDates: any = NLPParse(text);
        parsedDates.forEach((pd: any) => {
            const parsedDate = pd.start.date();
            const duePossibilities = [`Due ${pd.text}`, `due ${pd.text}`, `by ${pd.text}`, `By ${pd.text}`];
            const scheduledPossibilities = [`on ${pd.text}`, `On ${pd.text}`, pd.text]
            const foundDue = duePossibilities.find((poss: string) =>
                text.includes(poss)
            );
            const foundScheduled = scheduledPossibilities.find((poss: string) =>
                text.includes(poss)
            );
            if (foundDue) {
                due = parsedDate;
                text = text.replace(foundDue, "");
            }
            else if (foundScheduled) {
                scheduled = parsedDate;
                text = text.replace(foundScheduled, "");
            }
            else {
                scheduled = pd.text;
                text = text.replace(foundScheduled, pd.text);
            }
            let repl = foundDue || foundScheduled || pd.text;
            //textContent = textContent.replace(repl, `<mark>${repl}</mark>`)
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
        if (inputHTML.contains("@")) {
            suggest?.suggestBasedOnText(inputHTML.split("@")[1], 'people');
        } else if (inputHTML.contains('#')) {
            suggest?.suggestBasedOnText(inputHTML.split("#")[1], 'projects');
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
        if (inputHTML.contains('@')) {
            inputHTML = inputHTML.split("@")[0] + backLink + "&nbsp;"
        } else if (inputHTML.contains('#')) {
            inputHTML = inputHTML.split("#")[0]// + backLink + "&nbsp;"
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
        bind:innerHTML={inputHTML}
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
