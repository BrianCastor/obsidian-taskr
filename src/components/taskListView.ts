import { format } from "date-fns";
import type TaskrPlugin from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import TaskList from "../svelte/TaskList.svelte";

export const TASK_LIST_VIEW_TYPE = 'taskr-task-list-view';

export class TaskListView extends ItemView {
    view: TaskList;
    plugin: TaskrPlugin

    constructor(leaf: WorkspaceLeaf, plugin: TaskrPlugin) {
        super(leaf);
        this.plugin = plugin
    }

    getViewType(): string {
        return TASK_LIST_VIEW_TYPE;
    }

    getDisplayText(): string {
        return `Tasks - ${format(new Date(), 'EEEE, MMM d')}`;
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
