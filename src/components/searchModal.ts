import type TaskrPlugin from "main";
import { App, Modal } from "obsidian";
import SearchTasks from '../svelte/SearchTasks.svelte';
import type { SvelteComponent } from "svelte";

export class SearchModal extends Modal {
    plugin: TaskrPlugin;
    svelteComponent?: SvelteComponent;
  
    constructor(app: App, plugin: TaskrPlugin) {
      super(app);
      this.plugin = plugin;
      this.svelteComponent = undefined
    }
  
    onOpen = (): void => {
      const { titleEl, contentEl, modalEl } = this;
      titleEl.setText('Search Tasks');
      modalEl.style.height = "auto"
      modalEl.style.transition = "none !important"
      this.svelteComponent = new SearchTasks({
        target: contentEl,
        props: {
          close: () => this.close(),
          app: this.app,
          plugin: this.plugin,
          modalEl
        },
      });
    };
  
    onClose = (): void => {
      const { contentEl } = this;
      this.svelteComponent?.$destroy()
      contentEl.empty();
    };
  }
  