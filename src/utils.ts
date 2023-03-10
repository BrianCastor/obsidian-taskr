import type { Task } from "./task";

export const sortTasksByDate = (tasks: Task[], reverse = false) => {
    const ts: Task[] = tasks.sort((a: Task, b: Task) => {
        const a_m: any = a.completed_date || a.scheduled_date || a.due_date;
        const b_m: any = b.completed_date || b.scheduled_date || b.due_date;
        if (a_m === b_m) return 0;
        if (a_m === undefined) return 1;
        if (b_m === undefined) return -1;
        return (a_m || new Date()).getTime() - (b_m || new Date).getTime();
    });

    if (reverse) ts.reverse();

    return ts;
}

export const allEfforts = (): any => {
    return [
        { icon: "10m", value: 10, label: "Up to 10 mins", autoSuggestTerm: 'trivial' },
        { icon: "30m", value: 30, label: "Up to 30 mins", autoSuggestTerm: 'easy' },
        { icon: "1h", value: 60, label: "Up to 1 hour", autoSuggestTerm: 'medium' },
        { icon: "2h", value: 120, label: "Up to 2 hours", autoSuggestTerm: 'hard' },
        { icon: "4h", value: 240, label: "Up to 4 hours", autoSuggestTerm: 'vhard' },
        { icon: "?", value: undefined, label: "Remove", autoSuggestTerm: undefined }
    ]
}