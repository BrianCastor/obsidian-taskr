import { parse, startOfDay } from "date-fns";
import format from "date-fns/format";
import { parseYaml } from "obsidian";

//const backlinks_re = /\[\[.*?\]\]/g;

export class Task {
    id: string;
    title: string;
    due_date?: Date | undefined;
    scheduled_date?: Date | undefined;
    completed_date?: Date | undefined;
    created_date?: Date | undefined;
    complete: boolean;
    project?: string | undefined;
    effort?: number | undefined;
    contentLength?: number | undefined;
    //backlinks: string[];

    constructor(
        id: string | undefined,
        title: string,
        due_date?: Date,
        complete = false,
        project?: string,
        scheduled_date?: Date,
        completed_date?: Date,
        created_date?: Date,
        effort?: number,
        contentLength?: number
        //backlinks: string[] = []
    ) {
        this.title = title;
        this.due_date = due_date;
        this.complete = complete;
        this.project = project;
        this.scheduled_date = scheduled_date;
        this.completed_date = completed_date;
        this.created_date = created_date;
        this.effort = effort;
        this.contentLength = contentLength
        //this.backlinks = backlinks;

        if (id) {
            this.id = id;
        }
        else {
            this.id = this.createId();
        }
    }

    isOverdue() {
        if (this.complete) {
            return false;
        }
        if (!this.scheduled_date) {
            return false;
        }
        return startOfDay(new Date()) > this.scheduled_date;
    }

    filename() {
        return `task-${this.id}`;
    }

    filepath() {
        return `tasks/${this.id}.md`;
    }

    static fromFileContent(fileContent: string) {
        const FRONTMATTER_REGEX = /^\n*---[^\n]*\n+(?<fm>.+?)\n+---.*/s;
        const result = fileContent.match(FRONTMATTER_REGEX);
        const yamlString = result?.groups?.fm || '';
        const params = parseYaml(yamlString);

        const restOfFile = fileContent.split('---')[2].trim();

        const title: string = restOfFile.split('\n').find((row: string) => row.trim() !== '', 'Untitled Task') || 'Untitled Task';

        const existingContentLength = fileContent.slice(fileContent.split('---', 3).join('---').length + 3).trim().length

        //const backlinksLine = restOfFile.split('\n').find((row: string) => row.trim().startsWith('::links')) || '';
        //const backlinks = [...backlinksLine.matchAll(backlinks_re)].map((val) => val[0])


        return new Task(
            params.id,
            title,
            params.due_date && parse(params.due_date, 'yyyy-MM-dd', new Date()),
            params.complete ? true : false,
            params.project,
            params.scheduled_date && parse(params.scheduled_date, 'yyyy-MM-dd', new Date()),
            params.completed_date && parse(params.completed_date, 'yyyy-MM-dd', new Date()),
            params.created_date && parse(params.created_date, 'yyyy-MM-dd', new Date()),
            params.effort,
            existingContentLength
            //backlinks
        );
    }

    toFileContent() {
        const frontMatter = [];
        if (this.due_date) {
            frontMatter.push(`due_date: '${format(this.due_date, 'yyyy-MM-dd')}'`);
        }
        if (this.scheduled_date) {
            frontMatter.push(`scheduled_date: '${format(this.scheduled_date, 'yyyy-MM-dd')}'`);
        }
        if (this.completed_date) {
            frontMatter.push(`completed_date: '${format(this.completed_date, 'yyyy-MM-dd')}'`);
        }
        if (this.created_date) {
            frontMatter.push(`created_date: '${format(this.created_date, 'yyyy-MM-dd')}'`);
        }
        frontMatter.push(`id: '${this.id}'`)
        frontMatter.push(`complete: ${this.complete.toString()}`)
        if (this.effort) {
            frontMatter.push(`effort: ${this.effort}`)
        }
        if (this.project) {
            frontMatter.push(`project: ${this.project}`)
        }

        const contents = [];
        if (frontMatter.length > 0) {
            contents.push('---');
            contents.push(...frontMatter);
            contents.push('---');
            contents.push('');
        }
        contents.push(this.title);
        //if (this.backlinks.length > 0) {
        //    contents.push(`::links ${this.backlinks.join(' ')}`)
        //}
        contents.push("```taskr");
        contents.push(`id: ${this.id}`)
        contents.push('```')
        contents.push('---')

        return contents.join('\n');
    }

    createId() {
        let result = 'task-';
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 4; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
} 