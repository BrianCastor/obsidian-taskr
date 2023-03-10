import { MarkdownView, Plugin, TAbstractFile, TFile, WorkspaceLeaf, type MarkdownPostProcessorContext } from 'obsidian';
import { allProjectsCache, allTasksCache } from './cache';
import { TaskListView, TASK_LIST_TYPES } from './components/taskListView';
import { TaskModal } from './components/taskModal';
import { FileInterface } from './fileInterface';
import type { Project } from './project';
import { SettingsTab, settingsWithDefaults, type ISettings } from './settings';
import TasksToday from './svelte_pages/TasksToday.svelte';
import SingleTask from './svelte_pages/SingleTask.svelte';
import CompletedTasks from './svelte_pages/CompletedTasks.svelte';
import type { Task } from './task';
import TasksReferencingThisPage from './svelte_pages/TasksReferencingThisPage.svelte';

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

        const typesToLabels = {
            [TASK_LIST_TYPES.today]: {
                icon: `calendar-check-2`,
                label: 'Today (TASKR)'
            },
            [TASK_LIST_TYPES.completed]: {
                icon: 'medal',
                label: 'Completed (TASKR)'
            },
            [TASK_LIST_TYPES.thisWeek]: {
                icon: 'calendar-clock',
                label: 'This Week (TASKR)'
            },
            [TASK_LIST_TYPES.incomplete]: {
                icon: 'list',
                label: 'Upcoming (TASKR)'
            },
        }

        Object.values(TASK_LIST_TYPES).map((type: TASK_LIST_TYPES) => {

            this.registerView(
                type,
                (leaf) => new TaskListView(leaf, this, type)
            );

            this.addRibbonIcon(typesToLabels[type].icon, typesToLabels[type].label, () => {
                let existingLeaf: WorkspaceLeaf | undefined = undefined;

                const lv = app.workspace.getActiveViewOfType(TaskListView)
                if (lv) existingLeaf = lv?.leaf

                if (!existingLeaf) {
                    const lv = app.workspace.getActiveViewOfType(MarkdownView)
                    if (lv) existingLeaf = lv?.leaf
                }

                if (existingLeaf === undefined) {
                    existingLeaf = app.workspace.getLeaf(false);
                }
                existingLeaf.setViewState({
                    type: type,
                    active: true,
                });
                app.workspace.revealLeaf(existingLeaf)
            });

        })

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
            //TODO - rename all project assignments on Tasks to new project name
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
        this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.today);
        this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.completed);
        this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.thisWeek);
        this.app.workspace.detachLeavesOfType(TASK_LIST_TYPES.incomplete);
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

        if (params.id) {
            new SingleTask({
                target: el,
                props: {
                    taskId: params.id,
                    plugin: this
                }
            })
        }
        else if (params.today) {
            new TasksToday({
                target: el,
                props: {
                    plugin: this
                }
            })
        }
        else if (params.completed) {
            new CompletedTasks({
                target: el,
                props: {
                    plugin: this
                }
            })
        }
        else if (params.this) {
            new TasksReferencingThisPage({
                target: el,
                props: {
                    plugin: this,
                    filePath: ctx.sourcePath,
                }
            })
        }

    };
}