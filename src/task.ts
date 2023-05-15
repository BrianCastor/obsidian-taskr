import { parse, startOfDay } from 'date-fns'
import format from 'date-fns/format'
import { parse as parseYaml } from 'yaml'

//const backlinks_re = /\[\[.*?\]\]/g;

export interface ITask {
	id?: string | undefined
	title: string
	due_date?: Date | undefined
	scheduled_date?: Date | undefined
	completed_date?: Date | undefined
	created_date?: Date | undefined
	complete: boolean
	project?: string | undefined
	effort?: number | undefined
	contentLength?: number | undefined
}

export class Task implements ITask {
	id?: string
	title: string
	due_date?: Date | undefined
	scheduled_date?: Date | undefined
	completed_date?: Date | undefined
	created_date?: Date | undefined
	complete: boolean
	project?: string | undefined
	effort?: number | undefined
	contentLength?: number | undefined

	constructor(data: ITask) {
		this.title = data.title
		this.due_date = data.due_date
		this.complete = data.complete
		this.project = data.project
		this.scheduled_date = data.scheduled_date
		this.completed_date = data.completed_date
		this.created_date = data.created_date
		this.effort = data.effort
		this.contentLength = data.contentLength
		//this.backlinks = backlinks;

		if (data.id) {
			this.id = data.id
		} else {
			this.id = this.createId()
		}
	}

	isOverdue() {
		if (this.complete) {
			return false
		}
		if (!this.scheduled_date) {
			return false
		}
		return startOfDay(new Date()) > this.scheduled_date
	}

	filename() {
		return `task-${this.id}`
	}

	filepath() {
		return `tasks/${this.id}.md`
	}

	static fromFileContent(fileContent: string) {
		const FRONTMATTER_REGEX = /^\n*---[^\n]*\n+(?<fm>.+?)\n+---.*/s
		const result = fileContent.match(FRONTMATTER_REGEX)
		const yamlString = result?.groups?.fm || ''
		const params = parseYaml(yamlString)

		const restOfFile = fileContent.split('---')[2].trim()

		const title: string =
			restOfFile.split('\n').find((row: string) => row.trim() !== '', 'Untitled Task') ||
			'Untitled Task'

		const existingContentLength = fileContent
			.slice(fileContent.split('---', 3).join('---').length + 3)
			.trim().length

		//const backlinksLine = restOfFile.split('\n').find((row: string) => row.trim().startsWith('::links')) || '';
		//const backlinks = [...backlinksLine.matchAll(backlinks_re)].map((val) => val[0])

		return new Task({
			id: params.id,
			title: title,
			due_date: params.due_date && parse(params.due_date, 'yyyy-MM-dd', new Date()),
			complete: params.complete ? true : false,
			project: params.project,
			scheduled_date:
				params.scheduled_date && parse(params.scheduled_date, 'yyyy-MM-dd', new Date()),
			completed_date:
				params.completed_date && parse(params.completed_date, 'yyyy-MM-dd', new Date()),
			created_date:
				params.created_date && parse(params.created_date, 'yyyy-MM-dd', new Date()),
			effort: params.effort,
			contentLength: existingContentLength
			//backlinks
		})
	}

	toFileContent() {
		const frontMatter = []
		if (this.due_date) {
			frontMatter.push(`due_date: '${format(this.due_date, 'yyyy-MM-dd')}'`)
		}
		if (this.scheduled_date) {
			frontMatter.push(`scheduled_date: '${format(this.scheduled_date, 'yyyy-MM-dd')}'`)
		}
		if (this.completed_date) {
			frontMatter.push(`completed_date: '${format(this.completed_date, 'yyyy-MM-dd')}'`)
		}
		if (this.created_date) {
			frontMatter.push(`created_date: '${format(this.created_date, 'yyyy-MM-dd')}'`)
		}
		frontMatter.push(`id: '${this.id}'`)
		frontMatter.push(`complete: ${this.complete.toString()}`)
		if (this.effort) {
			frontMatter.push(`effort: ${this.effort}`)
		}
		if (this.project) {
			frontMatter.push(`project: ${this.project}`)
		}

		const contents = []
		if (frontMatter.length > 0) {
			contents.push('---')
			contents.push(...frontMatter)
			contents.push('---')
			contents.push('')
		}
		contents.push(this.title)
		//if (this.backlinks.length > 0) {
		//    contents.push(`::links ${this.backlinks.join(' ')}`)
		//}
		contents.push('```taskr')
		contents.push(`id: ${this.id}`)
		contents.push('```')
		contents.push('---')

		return contents.join('\n')
	}

	createId() {
		let result = 'task-'
		const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for (let i = 0; i < 4; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}
}
