import { Plugin, TAbstractFile, TFile, type MarkdownPostProcessorContext } from 'obsidian';
import { allProjectsCache, allTasksCache } from './cache';
import { CompletedTaskListView, COMPLETED_TASK_LIST_VIEW_TYPE } from './components/completedTaskListView';
import { TaskListView, TASK_LIST_VIEW_TYPE } from './components/taskListView';
import { TaskModal } from './components/taskModal';
import { FileInterface } from './fileInterface';
import type { Project } from './project';
import { SettingsTab, settingsWithDefaults, type ISettings } from './settings';
import TaskList from './svelte/TaskList.svelte';
import type { Task } from './task';

export default class TaskrPlugin extends Plugin {
    fileInterface: FileInterface;
    settings: ISettings;

    async onload(): Promise<void> {
        this.fileInterface = new FileInterface(this, this.app);

        await this.loadSettings();

        this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

        this.addRibbonIcon('plus-square', 'New Task (TASKR)', () => {
            new TaskModal(this.app, this).open();
        });

        this.addCommand({
            id: "taskr-add-task",
            name: "Add Task (Taskr)",
            hotkeys: [{ modifiers: ["Mod"], key: "t" }],
            callback: () => {
              new TaskModal(this.app, this).open();
            },
        });

        this.registerView(
            TASK_LIST_VIEW_TYPE,
            (leaf) => new TaskListView(leaf, this)
        );

        this.addRibbonIcon("list-checks", "Today (TASKR)", async () => {
            this.app.workspace.detachLeavesOfType(TASK_LIST_VIEW_TYPE);
    
            await this.app.workspace.getLeaf(false).setViewState({
              type: TASK_LIST_VIEW_TYPE,
              active: true,
            });
        
            this.app.workspace.revealLeaf(
              this.app.workspace.getLeavesOfType(TASK_LIST_VIEW_TYPE)[0]
            );
        });

        this.registerView(
            COMPLETED_TASK_LIST_VIEW_TYPE,
            (leaf) => new CompletedTaskListView(leaf, this)
        );

        this.addRibbonIcon("medal", "Completed (TASKR)", async () => {
            this.app.workspace.detachLeavesOfType(COMPLETED_TASK_LIST_VIEW_TYPE);
    
            await this.app.workspace.getLeaf(false).setViewState({
              type: COMPLETED_TASK_LIST_VIEW_TYPE,
              active: true,
            });
        
            this.app.workspace.revealLeaf(
              this.app.workspace.getLeavesOfType(COMPLETED_TASK_LIST_VIEW_TYPE)[0]
            );
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SettingsTab(this.app, this));

        this.registerMarkdownCodeBlockProcessor(
            'taskr',
            this.renderTaskBlockInMarkdown,
        );

        this.registerEvent(this.app.vault.on('modify', async (file: TAbstractFile) => {
            if (file instanceof TFile && file.parent.name == this.settings.TasksDir) {
                const task: Task = await this.fileInterface.getTaskFromFile(file);
                allTasksCache.update(tasks => [...tasks.filter((t: Task) => t.id !== task.id), task]);
            }
        }));

        this.registerEvent(this.app.vault.on('delete', async (file: TAbstractFile) => {
            if (file instanceof TFile && file.path.contains(this.settings.TasksDir)) {
                const task: Task = await this.fileInterface.getTaskFromFile(file);
                allTasksCache.update(tasks => tasks.filter((t: Task) => t.id !== task.id));
            }
        }));
        
        this.registerEvent(this.app.vault.on('create', async (file: TAbstractFile) => {
            if (file instanceof TFile && file.parent.name == this.settings.TasksDir) {
                const task: Task = await this.fileInterface.getTaskFromFile(file);
                allTasksCache.update(tasks => [...tasks, task])
            }
        }));

        this.registerEvent(this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
            if (file instanceof TFile && file.parent.name == this.settings.TasksDir) {
                const tasks: Task[] = await this.fileInterface.getAllTasks();
                allTasksCache.set(tasks);
            }
        }));

        this.registerEvent(this.app.vault.on('modify', async (file: TAbstractFile) => {
            if (file instanceof TFile && file.parent.name == this.settings.ProjectsDir) {
                const project: Project = this.fileInterface.getProjectFromFile(file);
                allProjectsCache.update(projects => [...projects.filter((p: Project) => p.title !== project.title), project]);
            }
        }));

        this.registerEvent(this.app.vault.on('delete', async (file: TAbstractFile) => {
            if (file instanceof TFile && file.path.contains(this.settings.ProjectsDir)) {
                const project: Project = this.fileInterface.getProjectFromFile(file);
                allProjectsCache.update(projects => projects.filter((p: Project) => p.title !== project.title));
            }
        }));
        
        this.registerEvent(this.app.vault.on('create', async (file: TAbstractFile) => {
            if (file instanceof TFile && file.parent.name == this.settings.ProjectsDir) {
                const project: Project = this.fileInterface.getProjectFromFile(file);
                allProjectsCache.update(projects => [...projects, project])
            }
        }));

        this.registerEvent(this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
            if (file instanceof TFile && file.parent.name == this.settings.ProjectsDir) {
                const projects: Project[] = this.fileInterface.getAllProjects();
                allProjectsCache.set(projects);
            }
        }));

    }

    async onLayoutReady(): Promise<void> {
        await this.fileInterface.getAllTasks();
        await this.fileInterface.getAllProjects();
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(TASK_LIST_VIEW_TYPE);
        this.app.workspace.detachLeavesOfType(COMPLETED_TASK_LIST_VIEW_TYPE);
    }

    async loadSettings() {
        this.settings = settingsWithDefaults(await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    renderTaskBlockInMarkdown = (
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
      ): void => {
        const params: any = {};
        const lines = source.split('\n');
        const parseLine = (line: string) => {
            if (!line.includes(':')) return null;
            const field = line.split(':')[0].trim();
            const value = line.split(':')[1].trim();
            return [field, value];
        }

        lines.map((line: string) => {
            const parsed = parseLine(line);
            if (parsed) {
                params[parsed[0]] = parsed[1];
            }
        })

        new TaskList({
          target: el,
          props: {
            plugin: this,
            filterParams: params,
          },
        });
    };
}