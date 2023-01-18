import type TaskrPlugin from "main";
import { App, PopoverSuggest, Scope, TFile, prepareFuzzySearch, type FuzzyMatch, Platform } from "obsidian";

/**
 * Might be building on a shaky foundation here. A lot of the base class is undocumented
 */
export class FileSuggest extends PopoverSuggest<FuzzyMatch<TFile>> {
    app: App
    inputEl: HTMLElement
    plugin: TaskrPlugin
    onSelect: (file: TFile) => void;

    constructor(
        app: App,
        scope: Scope,
        plugin: TaskrPlugin,
        inputEl: HTMLElement,
        onSelect: (file: TFile) => void
    ) {
        super(app, scope);
        this.app = app;
        this.inputEl = inputEl;
        this.plugin = plugin;
        this.onSelect = onSelect;

        this.inputEl.addEventListener('blur', e => {
            //BLur was getting triggered before click
            this.close()
        })
    }

    getSuggestions(text: string, type: string) {
        let tfiles: TFile[] = []
        if (type === 'people') {
            const peopleDir = this.plugin.settings.PeopleDir;
            tfiles = this.app.vault.getMarkdownFiles().filter((f: TFile) => f.parent.name === peopleDir); //TODO, do we need to cache this when creating class
        }
        else {
            const projectsDir = this.plugin.settings.ProjectsDir;
            tfiles = this.app.vault.getMarkdownFiles().filter((f: TFile) => f.parent.name === projectsDir);
        }

        const fuzzy = prepareFuzzySearch(text)
        const result: FuzzyMatch<TFile>[] = []
        for (const f of tfiles) {
            const match = fuzzy(f.basename)
            match && result.push({
                item: f,
                match,
            })
        }
        //@ts-ignore
        this.suggestions.setSuggestions(result);
        return result;
    }

    renderSuggestion(value: FuzzyMatch<TFile>, el: HTMLElement) {
        let html = value.item.basename;
        let extraChars = 0
        value.match.matches.forEach((matchPos) => {
            const start = extraChars + matchPos[0];
            html = [html.slice(0, start), '<mark style="background:rgba(150,150,150,.4);color:white;font-weight:bold">', html.slice(start)].join('');
            extraChars += 75
            const end = extraChars + matchPos[1]
            html = [html.slice(0, end), '</mark>', html.slice(end)].join('');
            extraChars += 7
        })
        el.innerHTML = html
        el.setAttribute('title', value.item.basename)
        return el
    }

    suggestBasedOnText(text: string, type: string) {
        let rect;
        if (!Platform.isMobileApp) {
            //@ts-ignore
            rect = this.inputEl.getBoundingClientRect()
            //@ts-ignore
            this.suggestEl.style.width = rect.width + 'px'
            //@ts-ignore
            this.reposition(rect)
        }

        const suggestions = this.getSuggestions(text, type)

        if (suggestions.length > 0) {
            this.open()
        }
        else {
            this.close()
        }
    }

    selectSuggestion(match: FuzzyMatch<TFile>, evt: MouseEvent | KeyboardEvent): void {
        this.onSelect(match.item);
        this.close();
    }

    destroy() {
        this.inputEl.removeEventListener('blur', e => {
            this.close()
        })
        //@ts-ignore
        this.selectEl.remove()
    }
}