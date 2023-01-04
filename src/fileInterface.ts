import type TaskrPlugin from "main";
import { TFile, type App } from "obsidian";
import { Project } from "./project";
import { Task } from "./task";

export class FileInterface {
    plugin: TaskrPlugin;
    app: App;

    constructor(plugin: TaskrPlugin, app: App) {
        this.plugin = plugin;
        this.app = app;
    }

    getAllTaskFiles = (): TFile[] => {
        const tasksDir = this.plugin.settings.TasksDir;
        const taskFiles = this.plugin.app.vault.getMarkdownFiles()
            .filter((f: TFile) => f.parent.name === tasksDir);

        return taskFiles;
    }

    getTaskFromFile = async (f: TFile): Promise<Task> => {
        const fileContent = await this.plugin.app.vault.cachedRead(f);
        return Task.fromFileContent(fileContent);
    }

    getAllTasks = async (): Promise<Task[]> => {
        const taskFiles: TFile[] = this.getAllTaskFiles();
        
        const tasks: Task[] = [];
        for await (const tf of taskFiles) {
            const task = await this.getTaskFromFile(tf);
            tasks.push(task);
        }
        return tasks;
    }

    createUpdateTask = async (task: Task): Promise<void> => {
        const tasksDir = this.plugin.settings.TasksDir;
        const fileName = `${tasksDir}/${task.id}.md`;

        if (!(await this.app.vault.adapter.exists(tasksDir))) {
            await this.app.vault.createFolder(tasksDir);
        }

        const existingFile = await this.app.vault.getAbstractFileByPath(fileName);

        if (existingFile && existingFile instanceof TFile) {
            //Replace pretty much only the frontmatter
            let existingContent = await this.app.vault.read(existingFile)
            const content = task.toFileContent();
            existingContent = existingContent.slice(existingContent.split('---', 3).join('---').length + 3, ); //TODO - this not very resilient
            existingContent = content + existingContent
            await this.app.vault.modify(existingFile, existingContent);
        }
        else {
            task.created_date = new Date();
            const content = task.toFileContent();
            await this.app.vault.create(fileName, content);
        }
    };

    getTaskById = async (id: string): Promise<Task>  => {
        const allTasks = await this.getAllTasks();
        const matches = allTasks.filter((t: Task) => t.id === id);
        return matches[0];
    }

    getTaskFileById = (id: string): TFile  => {
        const allTaskFiles = this.getAllTaskFiles();
        const matches = allTaskFiles.filter((t: TFile) => t.basename === id);
        return matches[0];
    }

    deleteTask = async (task: Task): Promise<void> => {
        const fullPath = `${this.plugin.settings.TasksDir}/${task.id}.md`;
        const tf = this.plugin.app.vault.getAbstractFileByPath(fullPath);
        if (tf) {
            this.plugin.app.vault.delete(tf);
        }
    }


    getProjectFromFile = (file: TFile) => {
        return new Project(file.basename);
    }

    getAllProjectFiles = () : TFile[] => {
        const projectFiles = this.plugin.app.vault.getMarkdownFiles()
            .filter((f: TFile) => f.parent.name === this.plugin.settings.ProjectsDir);

        return projectFiles;
    }

    getAllProjects = () : Project[] => {
        const projectFiles: TFile[] = this.getAllProjectFiles();
        
        const projects: Project[] = [];
        for (const tf of projectFiles) {
            const project = this.getProjectFromFile(tf);
            projects.push(project);
        }
        return projects;
    }
}