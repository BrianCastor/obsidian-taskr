import type TaskrPlugin from './main'
import { TFile, type App, stringifyYaml } from 'obsidian'
import { Project } from './project'
import { Task } from './task'
import { format, parse } from 'date-fns'
import { Habit } from './habit'
import { rrulestr } from 'rrule'

export class FileInterface {
	plugin: TaskrPlugin
	app: App

	constructor(plugin: TaskrPlugin, app: App) {
		this.plugin = plugin
		this.app = app
	}

	getAllTaskFiles = (): TFile[] => {
		const tasksDir = this.plugin.settings.TasksDir
		const taskFiles = this.plugin.app.vault
			.getMarkdownFiles()
			.filter((f: TFile) => f.parent?.name === tasksDir)

		return taskFiles
	}

	getTaskFromFile = async (f: TFile): Promise<Task> => {
		const fileMetadata = this.app.metadataCache.getFileCache(f)

		const frontmatter = fileMetadata?.frontmatter

		if (!frontmatter) {
			//@ts-expect-error
			return undefined
		}

		let project
		const projectLink = fileMetadata.frontmatterLinks?.find(
			(link) => link.key === 'project'
		)?.link

		if (projectLink) {
			const projectFile = this.getProjectFileById(projectLink)
			project = projectFile && (await this.getProjectFromFile(projectFile))
		}

		return new Task({
			id: frontmatter.id,
			title: frontmatter.title,
			due_date: frontmatter.due_date && parse(frontmatter.due_date, 'yyyy-MM-dd', new Date()),
			complete: frontmatter.complete ? true : false,
			project: project,
			scheduled_date:
				frontmatter.scheduled_date &&
				parse(frontmatter.scheduled_date, 'yyyy-MM-dd', new Date()),
			completed_date:
				frontmatter.completed_date &&
				parse(frontmatter.completed_date, 'yyyy-MM-dd', new Date()),
			created_date:
				frontmatter.created_date &&
				parse(frontmatter.created_date, 'yyyy-MM-dd', new Date()),
			effort: frontmatter.effort,
			contentLength: (fileMetadata.sections?.length ?? 0) - 2 // Subtract the YAML and code sections we inject
		})
	}

	getAllTasks = async (): Promise<Task[]> => {
		const taskFiles: TFile[] = this.getAllTaskFiles()

		const tasks: Task[] = []
		for await (const tf of taskFiles) {
			const task = await this.getTaskFromFile(tf)
			tasks.push(task)
		}
		return tasks
	}

	createUpdateTask = async (task: Task): Promise<void> => {
		const tasksDir = this.plugin.settings.TasksDir
		const fileName = `${tasksDir}/${task.id}.md`

		if (!(await this.app.vault.adapter.exists(tasksDir))) {
			await this.app.vault.createFolder(tasksDir)
		}

		let projectLinkText
		if (task.project) {
			const projectFile = this.getProjectFileById(task.project.id)
			projectLinkText = this.app.metadataCache.fileToLinktext(projectFile, 'projects', true)
			projectLinkText = `[[${projectLinkText}]]`
		}

		const taskYaml = {
			title: task.title,
			complete: task.complete,
			id: task.id,
			due_date: task.due_date && format(task.due_date, 'yyyy-MM-dd'),
			scheduled_date: task.scheduled_date && format(task.scheduled_date, 'yyyy-MM-dd'),
			completed_date: task.completed_date && format(task.completed_date, 'yyyy-MM-dd'),
			created_date: task.created_date && format(task.created_date, 'yyyy-MM-dd'),
			effort: task.effort,
			project: projectLinkText
		}

		const existingFile = await this.app.vault.getAbstractFileByPath(fileName)

		if (existingFile && existingFile instanceof TFile) {
			this.app.fileManager.processFrontMatter(existingFile, (frontmatter) => {
				frontmatter = Object.assign(frontmatter, taskYaml)
			})
		} else {
			task.created_date = new Date()
			const yamlString = stringifyYaml(taskYaml)
			const taskWidgetString = '```taskr\nid: ' + task.id + '\n```'
			const content = `---\n${yamlString}---\n${taskWidgetString}\n\n`
			await this.app.vault.create(fileName, content)
		}
	}

	getTaskFileById = (id: string): TFile => {
		const allTaskFiles = this.getAllTaskFiles()
		const matches = allTaskFiles.filter((t: TFile) => t.basename === id)
		return matches[0]
	}

	deleteTask = async (task: Task): Promise<void> => {
		const fullPath = `${this.plugin.settings.TasksDir}/${task.id}.md`
		const tf = this.plugin.app.vault.getAbstractFileByPath(fullPath)
		if (tf) {
			this.plugin.app.vault.delete(tf)
		}
	}

	getProjectFromFile = async (file: TFile): Promise<Project> => {
		const fileMetadata = this.app.metadataCache.getFileCache(file)

		const frontmatter = fileMetadata?.frontmatter

		if (!frontmatter) {
			//@ts-expect-error
			return undefined
		}

		return new Project({
			id: frontmatter.id,
			title: frontmatter.title,
			created_date:
				frontmatter.created_date &&
				parse(frontmatter.created_date, 'yyyy-MM-dd', new Date()),
			category: frontmatter.category,
			icon: frontmatter.icon
		})
	}

	getAllProjectFiles = (): TFile[] => {
		const projectFiles = this.plugin.app.vault
			.getMarkdownFiles()
			.filter((f: TFile) => f.parent?.name === this.plugin.settings.ProjectsDir)

		return projectFiles
	}

	getProjectFileById = (id: string): TFile => {
		const allHabitFiles = this.getAllProjectFiles()
		const matches = allHabitFiles.filter((t: TFile) => t.basename === id)
		return matches[0]
	}

	getAllProjects = async (): Promise<Project[]> => {
		const projectFiles: TFile[] = this.getAllProjectFiles()

		const projects: Project[] = []
		for (const tf of projectFiles) {
			const project = await this.getProjectFromFile(tf)
			projects.push(project)
		}
		return projects
	}

	createUpdateProject = async (project: Project) => {
		const projectsDir = this.plugin.settings.ProjectsDir
		const fileName = `${projectsDir}/${project.id}.md`

		if (!(await this.app.vault.adapter.exists(projectsDir))) {
			await this.app.vault.createFolder(projectsDir)
		}

		const projectYaml = {
			title: project.title,
			id: project.id,
			icon: project.icon,
			category: project.category,
			created_date: project.created_date && format(project.created_date, 'yyyy-MM-dd')
		}

		const existingFile = await this.app.vault.getAbstractFileByPath(fileName)

		if (existingFile && existingFile instanceof TFile) {
			this.app.fileManager.processFrontMatter(existingFile, (frontmatter) => {
				frontmatter = Object.assign(frontmatter, projectYaml)
			})
		} else {
			const yamlString = stringifyYaml(projectYaml)
			const content = `---\n${yamlString}---\n\n`
			await this.app.vault.create(fileName, content)
		}
	}

	getTaskIdsLinkingToFile = (path: string) => {
		//TODO - may be able to optimize this better
		const linkers = this.app.metadataCache.resolvedLinks
		const linkedPaths = new Set()
		Object.keys(linkers).map((linker: string) => {
			Object.keys(linkers[linker]).map((f: string) => {
				if (f === path) {
					linkedPaths.add(linker)
				}
			})
		})

		//@ts-ignore
		const taskIds: string[] = [...linkedPaths]
			.map((filePath: string) => {
				return this.app.vault.getAbstractFileByPath(filePath)
			})
			.filter((file: TFile) => {
				return file.parent?.name === this.plugin.settings.TasksDir
			})
			.map((file: TFile) => file.basename)

		return taskIds
	}

	getHabitFromFile = async (file: TFile): Promise<Habit> => {
		const fileMetadata = this.app.metadataCache.getFileCache(file)

		const frontmatter = fileMetadata?.frontmatter

		if (!frontmatter) {
			//@ts-expect-error
			return undefined
		}

		let project
		const projectLink = fileMetadata.frontmatterLinks?.find(
			(link) => link.key === 'project'
		)?.link

		if (projectLink) {
			const projectFile = this.getProjectFileById(projectLink)
			project = projectFile && (await this.getProjectFromFile(projectFile))
		}

		return new Habit({
			id: frontmatter.id,
			title: frontmatter.title,
			recurrence: rrulestr(frontmatter.recurrence),
			quantity: frontmatter.quantity,
			effort: frontmatter.effort,
			created_date:
				frontmatter.created_date &&
				parse(frontmatter.created_date, 'yyyy-MM-dd', new Date()),
			project: project,
			completion_dates: (frontmatter.completion_dates ?? '')
				.split(',')
				.filter((val: string) => val !== '')
				.map((dt: string) => parse(dt, 'yyyy-MM-dd', new Date())),
			icon: frontmatter.icon
		})
	}

	getAllHabitFiles = (): TFile[] => {
		return this.plugin.app.vault
			.getMarkdownFiles()
			.filter((f: TFile) => f.parent?.name === this.plugin.settings.HabitsDir)
	}

	getHabitFileById = (id: string): TFile => {
		const allHabitFiles = this.getAllHabitFiles()
		const matches = allHabitFiles.filter((t: TFile) => t.basename === id)
		return matches[0]
	}

	getAllHabits = async (): Promise<Habit[]> => {
		const habitFiles: TFile[] = this.getAllHabitFiles()

		const habits: Habit[] = []
		for (const tf of habitFiles) {
			const habit = await this.getHabitFromFile(tf)
			habits.push(habit)
		}
		return habits
	}

	createUpdateHabit = async (habit: Habit) => {
		const habitsDir = this.plugin.settings.HabitsDir
		const fileName = `${habitsDir}/${habit.id}.md`

		if (!(await this.app.vault.adapter.exists(habitsDir))) {
			await this.app.vault.createFolder(habitsDir)
		}

		let projectLinkText
		if (habit.project) {
			const projectFile = this.getProjectFileById(habit.project.id)
			projectLinkText = this.app.metadataCache.fileToLinktext(projectFile, 'projects', true)
			projectLinkText = `[[${projectLinkText}]]`
		}

		const habitYaml = {
			title: habit.title,
			id: habit.id,
			created_date: habit.created_date && format(habit.created_date, 'yyyy-MM-dd'),
			recurrence: habit.recurrence.toString(),
			quantity: habit.quantity,
			effort: habit.effort,
			project: projectLinkText,
			completion_dates: habit.completion_dates
				.map((dt) => format(dt, 'yyyy-MM-dd'))
				.join(','),
			icon: habit.icon
		}

		const existingFile = await this.app.vault.getAbstractFileByPath(fileName)

		if (existingFile && existingFile instanceof TFile) {
			this.app.fileManager.processFrontMatter(existingFile, (frontmatter) => {
				frontmatter = Object.assign(frontmatter, habitYaml)
			})
		} else {
			const yamlString = stringifyYaml(habitYaml)
			const content = `---\n${yamlString}---\n\n`
			await this.app.vault.create(fileName, content)
		}
	}
}
