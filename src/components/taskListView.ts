import type TaskrPlugin from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import TaskList from "../svelte/TaskList.svelte";

const VIEW_TYPE = 'svelte-obsidian';

export class TaskListView extends ItemView {
    view: TaskList;
    plugin: TaskrPlugin

    constructor(leaf: WorkspaceLeaf, plugin: TaskrPlugin) {
        super(leaf);
        this.plugin = plugin
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Tasks";
    }

    getIcon(): string {
        return "list";
    }

    async onOpen(): Promise<void> {
        this.view = new TaskList({
            target: (this as any).contentEl,
            props: {
                plugin: this.plugin,
                filterParams: {}
            } 
        });
    }
}
