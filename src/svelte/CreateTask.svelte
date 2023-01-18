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

    //TODO - this all could use a refactor

    let inputHTML = "";
    let title: string = "";
    let due: Date | undefined;
    let scheduled: Date | undefined;
    let effort: number | undefined;
    let project: string | undefined;
    //let backlinks: string[] = [];

    let inputEl: HTMLElement;
    let suggest: FileSuggest | undefined;
    let marked: string = "";

    const mentions_re = /\B@\w*/g;
    const hashtags_re = /\B#\w*/g;
    const backlinks_re = /\[\[.*?\]\]/g;

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
            effort,
            //backlinks
        );
        store(newTask);
        close();
    };

    const getCursorPosition = () : number | undefined => {
        const selection = document.getSelection()
        if (!selection) return undefined;
        //@ts-ignore
        return selection.baseOffset
    }

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
            textContent = textContent.replace(repl, `<mark class="blue">${repl}</mark>`)
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
                textContent = textContent.replace(term, `<mark class="green">${term}</mark>`)
            }
        });

        const mentions = [...(doc.documentElement.textContent ?? '').matchAll(mentions_re)];
        const hashtags = [...(doc.documentElement.textContent ?? '').matchAll(hashtags_re)];
        //backlinks = [...(doc.documentElement.textContent ?? '').matchAll(backlinks_re)].map((val) => val[0]);
        const currentMention = getCurrentToken(mentions);
        const currentHashtag = getCurrentToken(hashtags);

        if (currentMention) {
            suggest?.suggestBasedOnText(currentMention[0].replace('@', ''), 'people');
        } else if (currentHashtag) {
            suggest?.suggestBasedOnText(currentHashtag[0].replace('#', ''), 'projects');
        } else {
            suggest?.close();
        }

        textContent = textContent.replace(mentions_re, (x: string) => `<mark class="purple">${x}</mark>`)
        textContent = textContent.replace(hashtags_re, (x: string) => `<mark class="white">${x}</mark>`)
        textContent = textContent.replace(backlinks_re, (x: string) => `<mark class="darkblue">${x}</mark>`)

        text = text.replace(mentions_re, '')
        text = text.replace(hashtags_re, '')
        //text = text.replace(backlinks_re, '')
        title = text.trim();

        marked = textContent;
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

    const getCurrentToken = (tokens: RegExpMatchArray[]) : RegExpMatchArray | undefined => {
        const cursorIndex = getCursorPosition()
        if (cursorIndex === undefined) return undefined;
        return tokens.find((val) => {
            if (val.index === undefined) return false;
            return cursorIndex > val.index && cursorIndex <= val.index + val[0].length
        })
    }

    const replaceToken = (token: RegExpMatchArray, text: string, replacement: string) : string => {
        if (token.index === undefined) return text;
        text = text.substring(0, token.index) + replacement + text.substring(token.index + token[0].length)
        return text
    }

    function onSuggestSelect(tfile: TFile) {
        const backLink = `[[${tfile.basename}]]&nbsp;`;

        const cursorIndex = getCursorPosition()  
        if (!cursorIndex) return;

        const doc = new DOMParser().parseFromString(inputHTML, "text/html");
        let textContent = doc.documentElement.textContent ?? '';

        const mentions = [...textContent.matchAll(mentions_re)];
        const hashtags = [...textContent.matchAll(hashtags_re)];

        const currentMention = getCurrentToken(mentions)
        if (currentMention) {
            textContent = replaceToken(currentMention, textContent, backLink)
        }

        const currentHashtag = getCurrentToken(hashtags)
        if (currentHashtag) {
            textContent = replaceToken(currentHashtag, textContent, '')
            onSetProject(tfile.basename)
        }

        inputHTML = textContent

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
        inputEl.focus()
    });

    onDestroy(() => {
        suggest?.close();
        suggest?.destroy();
    });
</script>

<div style="width:100%; position: relative">
    <div
        contenteditable="true"
        bind:innerHTML={inputHTML}
        class="task-input"
        bind:this={inputEl}
        on:keypress={handleKeyPress}
    ></div>
    <div class="highlight-overlay" contenteditable bind:innerHTML={marked}>
    </div>
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
        background-color: rgba(1,1,1,.2);
        border-radius: 4px;
        padding: 10px;
        z-index:999999 !important;
        position:relative;
    }

    .highlight-overlay {
        color: rgba(0,0,0,0);
        background-color: black;
        position: absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        padding: 10px;
        z-index:0 !important;
        border: 1px solid rgba(0,0,0,0);
        border-radius: 4px;
    }

    :global(.highlight-overlay .blue) {
        background-color: rgba(108, 240, 255, 0.4) !important;
    }

    :global(.highlight-overlay .green) {
        background-color: rgba(255, 199, 115, 0.5) !important;
    }

    :global(.highlight-overlay .purple) {
        background-color: rgba(215, 141, 255, 0.5) !important;
    }

    :global(.highlight-overlay .white) {
        background-color: rgba(255, 255, 255, 0.5) !important;
    }

    :global(.highlight-overlay .darkblue) {
        background-color: rgba(113, 127, 255, 0.5) !important;
    }
</style>
