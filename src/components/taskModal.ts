import type TaskrPlugin from "main";
import { App, MarkdownView, Modal } from "obsidian";
import type { Task } from "../task";
import CreateTask from '../svelte/CreateTask.svelte';

export class TaskModal extends Modal {
    plugin: TaskrPlugin;
  
    constructor(app: App, plugin: TaskrPlugin) {
      super(app);
      this.plugin = plugin;
    }
  
    onOpen = (): void => {
      const { titleEl, contentEl } = this;
      titleEl.setText('Create New Task');
      new CreateTask({
        target: contentEl,
        props: {
          close: () => this.close(),
          //@ts-ignore
          store: this.onSave,
          app: this.app,
        },
      });
    };
  
    onClose = (): void => {
      const { contentEl } = this;
      contentEl.empty();
    };

    onSave = (task: Task): void => {
      this.plugin.fileInterface?.createUpdateTask(task);

      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      // Make sure the user is editing a Markdown file.
      if (view) {
        const cursor = view.editor.getCursor();

        if (cursor.line) {
          view.editor.replaceRange(`\`\`\`taskr\nid: ${task.id}\n\`\`\`\n`, cursor)
        }

        // ...
      }
    }
  }
  