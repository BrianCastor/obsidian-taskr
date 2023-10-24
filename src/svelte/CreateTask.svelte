<script lang="ts">
	import { parse as NLPParse } from 'chrono-node'
	import { Task } from '../task'
	import DateChip from './DateChip.svelte'
	import LoeChip from './LOE_Chip.svelte'
	import ProjectSelector from './ProjectSelector.svelte'
	import { allEfforts, getEffort } from '../utils'
	import { onDestroy, onMount } from 'svelte'
	import { FileSuggest } from '../components/fileSuggest'
	import type { App, TFile } from 'obsidian'
	import type TaskrPlugin from '../main'
	import { allTasksCache } from '../cache'
	import { ENGLISH_STOPWORDS } from '../stopwords'
	import { addDays, differenceInDays } from 'date-fns'

	export let close: () => void
	export let store: (task: Task) => void
	export let app: App
	export let plugin: TaskrPlugin
	export let modalEl: any

	//TODO - this all could use a refactor

	let inputHTML = ''
	let title: string = ''
	let due: Date | undefined
	let scheduled: Date | undefined
	let effort: number | undefined
	let project: string | undefined
	let completed_date: Date | undefined

	let inputEl: HTMLElement
	let suggest: FileSuggest | undefined
	let marked: string = ''

	let suggestedTasks: Task[] = []
	let showSuggestedTasks: boolean = true

	const mentions_re = /\B@\w*/g
	const hashtags_re = /\B#\w*/g
	const backlinks_re = /\[\[.*?\]\]/g

	const save = () => {
		const newTask = new Task({
			title: title,
			due_date: due,
			complete: !!completed_date,
			completed_date: completed_date,
			project: project,
			scheduled_date: scheduled,
			effort: effort
		})
		store(newTask)
		close()
	}

	const getCursorPosition = (): number | undefined => {
		const selection = document.getSelection()
		if (!selection) {
			return undefined
		}
		//@ts-ignore
		return selection.baseOffset
	}

	$: {
		// Unescape the div content
		const doc = new DOMParser().parseFromString(inputHTML, 'text/html')
		let textContent = doc.documentElement.textContent ?? ''

		//Remove extra spaces
		let text = textContent.replace(/\s+/g, ' ')

		//Get dates
		const parsedDates: any = NLPParse(text)
		parsedDates.forEach((pd: any) => {
			const parsedDate = pd.start.date()
			const duePossibilities = [
				`Due ${pd.text}`,
				`due ${pd.text}`,
				`by ${pd.text}`,
				`By ${pd.text}`
			]
			const completedPossibilities = [
				`Completed ${pd.text}`,
				`completed ${pd.text}`,
				`Finished ${pd.text}`,
				`finished ${pd.text}`,
				`Completed on ${pd.text}`,
				`completed on ${pd.text}`,
				`Finished on ${pd.text}`,
				`finished on ${pd.text}`
			]
			const scheduledPossibilities = [`on ${pd.text}`, `On ${pd.text}`, pd.text]
			const foundDue = duePossibilities.find((poss: string) => text.includes(poss))
			const foundCompleted = completedPossibilities.find((poss: string) =>
				text.includes(poss)
			)
			const foundScheduled = scheduledPossibilities.find((poss: string) =>
				text.includes(poss)
			)
			if (foundDue) {
				due = parsedDate
				text = text.replace(foundDue, '')
			} else if (foundCompleted) {
				completed_date = parsedDate
				text = text.replace(foundCompleted, '')
			} else if (foundScheduled) {
				scheduled = parsedDate
				text = text.replace(foundScheduled, '')
			} else {
				scheduled = pd.text
				text = text.replace(foundScheduled, pd.text)
			}
			let repl = foundDue || foundScheduled || pd.text
			textContent = textContent.replace(repl, `<mark class="blue">${repl}</mark>`)
		})

		//Get Effort
		text.split(' ').map((term: string) => {
			const matchingEffort = allEfforts.find(
				(t: any) => t.autoSuggestTerm?.toLowerCase() === term.toLowerCase().trim()
			)
			if (matchingEffort) {
				effort = matchingEffort.value
				text = text.replace(term, '')
				textContent = textContent.replace(term, `<mark class="green">${term}</mark>`)
			}
		})

		//Try to pick up attributes from old tasks
		const tokenize = (str: string) => {
			return (str ?? '')
				.toLowerCase()
				.split(' ')
				.map((term) => term.trim())
				.filter((term) => !!term)
		}

		// Not my best work from an optimization perspective...
		let taskMatch: Task | undefined = undefined
		const compareTerms1 = tokenize(text)
		if (compareTerms1.length >= 2) {
			$allTasksCache.every((t: Task) => {
				if (!t.effort && !t.project) {
					return true
				}
				const compareTerms2 = tokenize(t.title)
				const matchTerms: string[] = []
				compareTerms1.forEach((term) => {
					if (compareTerms2.includes(term)) matchTerms.push(term)
					if (
						matchTerms.length >= 2 &&
						!matchTerms.every((term) => ENGLISH_STOPWORDS.includes(term))
					) {
						taskMatch = t
					}
				})
				if (taskMatch) {
					return false
				}
				return true
			})
		}

		suggestedTasks = Object.values(
			$allTasksCache
				.filter((t: Task) => {
					if (text) {
						const compareTerms1 = tokenize(text)
						const compareTerms2 = tokenize(t.title)
						if (
							compareTerms1.every((term) =>
								compareTerms2.some((term2) => term2.includes(term))
							)
						) {
							return true
						} else {
							return false
						}
					}
					return true
				})
				.reduce((accum: Record<string, { task: Task; count: number }>, val: Task) => {
					const cleanTitle = val.title.toLowerCase().trim()
					if (cleanTitle in accum) {
						accum[cleanTitle].count += 1
					} else {
						accum[cleanTitle] = { task: val, count: 1 }
					}
					return accum
				}, {})
		)
			.sort((a, b) => b.count - a.count)
			.map((val) => val.task)
			.slice(0, 25)

		if (taskMatch) {
			if (!effort) {
				//@ts-ignore
				effort = taskMatch.effort
			}
			if (!project) {
				//@ts-ignore
				project = taskMatch.project
			}
		}

		const mentions = [...(doc.documentElement.textContent ?? '').matchAll(mentions_re)]
		const hashtags = [...(doc.documentElement.textContent ?? '').matchAll(hashtags_re)]
		const currentMention = getCurrentToken(mentions)
		const currentHashtag = getCurrentToken(hashtags)

		if (currentMention) {
			suggest?.suggestBasedOnText(currentMention[0].replace('@', ''), 'people')
		} else if (currentHashtag) {
			suggest?.suggestBasedOnText(currentHashtag[0].replace('#', ''), 'projects')
		} else {
			suggest?.close()
		}

		textContent = textContent.replace(
			mentions_re,
			(x: string) => `<mark class="purple">${x}</mark>`
		)
		textContent = textContent.replace(
			hashtags_re,
			(x: string) => `<mark class="white">${x}</mark>`
		)
		textContent = textContent.replace(
			backlinks_re,
			(x: string) => `<mark class="darkblue">${x}</mark>`
		)

		text = text.replace(mentions_re, '')
		text = text.replace(hashtags_re, '')
		title = text.trim()

		marked = textContent
	}

	function onSetDueDate(dt: Date | undefined) {
		due = dt
		inputEl.focus()
	}

	function onSetScheduledDate(dt: Date | undefined) {
		scheduled = dt
		inputEl.focus()
	}

	function onSetEffort(eff: number | undefined) {
		effort = eff
		inputEl.focus()
	}

	function onSetProject(pj: string | undefined) {
		project = pj
		inputEl.focus()
	}
	function onSetCompletedDate(dt: Date | undefined) {
		completed_date = dt
		inputEl.focus()
	}

	function handleKeyPress(e: any) {
		if (e.key === 'Enter' && !suggest?.open()) {
			save()
		}
	}

	const getCurrentToken = (tokens: RegExpMatchArray[]): RegExpMatchArray | undefined => {
		const cursorIndex = getCursorPosition()
		if (cursorIndex === undefined) return undefined
		return tokens.find((val) => {
			if (val.index === undefined) return false
			return cursorIndex > val.index && cursorIndex <= val.index + val[0].length
		})
	}

	const replaceToken = (token: RegExpMatchArray, text: string, replacement: string): string => {
		if (token.index === undefined) return text
		text =
			text.substring(0, token.index) +
			replacement +
			text.substring(token.index + token[0].length)
		return text
	}

	function onSuggestSelect(tfile: TFile) {
		const backLink = `[[${tfile.basename}]]&nbsp;`

		const cursorIndex = getCursorPosition()
		if (!cursorIndex) return

		const doc = new DOMParser().parseFromString(inputHTML, 'text/html')
		let textContent = doc.documentElement.textContent ?? ''

		const mentions = [...textContent.matchAll(mentions_re)]
		const hashtags = [...textContent.matchAll(hashtags_re)]

		const currentMention = getCurrentToken(mentions)
		if (currentMention) {
			textContent = replaceToken(currentMention, textContent, backLink)
		}

		const currentHashtag = getCurrentToken(hashtags)
		if (currentHashtag) {
			textContent = replaceToken(currentHashtag, textContent, '')
			onSetProject(tfile.basename)
		}

		inputHTML = textContent

		inputEl.focus()

		//TODO - make less hacky
		setTimeout(() => {
			if (
				typeof window.getSelection != 'undefined' &&
				typeof document.createRange != 'undefined'
			) {
				var range = document.createRange()
				range.selectNodeContents(inputEl)
				range.collapse(false)
				var sel = window.getSelection()
				sel?.removeAllRanges()
				sel?.addRange(range)
			}
		}, 50)
	}

	const copyTask = (t: Task) => {
		showSuggestedTasks = false
		title = t.title
		inputHTML = t.title
		effort = t.effort
		project = t.project
		if (t.created_date && t.scheduled_date) {
			scheduled = addDays(Date.now(), differenceInDays(t.scheduled_date, t.created_date))
		}
		inputEl.focus()
	}

	onMount(() => {
		suggest = new FileSuggest(app, app.scope, plugin, inputEl, onSuggestSelect)
		modalEl.addEventListener('click', () => suggest?.close())
		inputEl.focus()
	})

	onDestroy(() => {
		suggest?.close()
	})
</script>

<div style="width:100%; position: relative">
	<div
		contenteditable="true"
		bind:innerHTML={inputHTML}
		class="task-input"
		bind:this={inputEl}
		on:keypress={handleKeyPress}
	/>
	<div class="highlight-overlay" contenteditable bind:innerHTML={marked} />
</div>
<div
	style="width:100%;margin-top:5px;display:flex;justify-content:space-between; margin-bottom:4px"
>
	<div style="display:flex; alignItems:center; margin-top:5px;flex-wrap:wrap;row-gap:10px;">
		<DateChip date={scheduled} setDate={onSetScheduledDate} emoji={'ON'} size="normal" />
		<DateChip date={due} setDate={onSetDueDate} emoji={'DUE'} size="normal" />
		<LoeChip {effort} setEffort={onSetEffort} size="small" />
		<ProjectSelector {project} setProject={onSetProject} size="small" />
		{#if completed_date}
			<DateChip
				date={completed_date}
				setDate={onSetCompletedDate}
				emoji={'✅'}
				size="normal"
			/>
		{/if}
	</div>
</div>
<div style="width:100%; position: relative;padding:5px">
	<div
		style="color:lightgrey;font-size:12px;font-weight:bold;cursor:pointer;margin-bottom:4px"
		on:click={() => (showSuggestedTasks = !showSuggestedTasks)}
	>
		Suggested Tasks {showSuggestedTasks ? '▼' : '►'}
	</div>
	{#if showSuggestedTasks}
		<div
			style="height:160px; overflow-y: scroll; display: flex; flex-direction: column-reverse; border: 1px solid rgb(50,50,50); border-radius: 4px;"
		>
			{#each suggestedTasks as task (task.id)}
				<div class="copy-task" on:click={() => copyTask(task)}>
					<div>{task.title}</div>
					<div style={`color:${getEffort(task.effort)?.color ?? 'grey'}`}>
						{getEffort(task.effort)?.icon}
					</div>
				</div>
			{/each}
			{#if suggestedTasks.length === 0}
				<div
					style="text-align:center; height: 100%; display: flex; justify-content: center; align-items: center"
				>
					<span style="font-style:italic; color: grey; font-size:12px"
						>No matching tasks found.</span
					>
				</div>
			{/if}
		</div>
	{/if}
</div>

<div style="width:100%;margin-top:3px">
	<button class="button" on:click={save} style="width:100%;height:30px">Save</button>
</div>

<style>
	.copy-task {
		font-size: 12px;
		display: flex;
		justify-content: space-between;
		cursor: pointer;
		padding: 12px;
		border-top: 1px solid rgb(30, 30, 30);
	}
	.task-input {
		width: 100%;
		border: 1px solid rgb(54, 54, 54);
		background-color: rgba(1, 1, 1, 0.2);
		border-radius: 4px;
		padding: 8px;
		z-index: 1 !important;
		position: relative;
	}

	.highlight-overlay {
		color: rgba(0, 0, 0, 0);
		background-color: black;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 8px;
		z-index: 0 !important;
		border: 1px solid rgba(0, 0, 0, 0);
		border-radius: 4px;
	}

	:global(.highlight-overlay .blue) {
		background-color: rgba(108, 240, 255, 0.4) !important;
	}

	:global(.highlight-overlay .green) {
		background-color: rgba(255, 199, 115, 0.5) !important;
	}

	:global(.highlight-overlay .purple) {
		background-color: rgba(215, 141, 255, 0.5) !important;
	}

	:global(.highlight-overlay .white) {
		background-color: rgba(255, 255, 255, 0.5) !important;
	}

	:global(.highlight-overlay .darkblue) {
		background-color: rgba(113, 127, 255, 0.5) !important;
	}
</style>
