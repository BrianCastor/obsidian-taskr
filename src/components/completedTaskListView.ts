import type TaskrPlugin from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import TaskList from "../svelte/TaskList.svelte";

export const COMPLETED_TASK_LIST_VIEW_TYPE = 'taskr-completed-task-list-view';

export class CompletedTaskListView extends ItemView {
    view: TaskList;
    plugin: TaskrPlugin

    constructor(leaf: WorkspaceLeaf, plugin: TaskrPlugin) {
        super(leaf);
        this.plugin = plugin
    }

    getViewType(): string {
        return COMPLETED_TASK_LIST_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Completed Tasks";
    }

    getIcon(): string {
        return "medal";
    }

    async onOpen(): Promise<void> {
        this.view = new TaskList({
            target: (this as any).contentEl,
            props: {
                plugin: this.plugin,
                filterParams: {
                    completed: true
                }
            } 
        });
    }
}
