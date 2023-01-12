<script lang="ts">
    import {
        startOfDay,
        isToday,
        isTomorrow,
        addDays,
        endOfWeek,
        eachDayOfInterval,
        format,
        startOfWeek,
        isWeekend,
        endOfMonth,
        addMonths,
    } from "date-fns";
    import { formatDateRelativeToNow } from "../date_utils";
    import { showDropdownMenu } from "../components/DropdownMenu";
    import CalendarPopup from "./CalendarPopup.svelte";
    import { Modal } from "obsidian";

    export let date: Date | undefined;
    export let setDate: (date: Date | undefined) => void;
    export let emoji: string;
    export let complete: boolean | undefined = false;
    export let size: "small" | "normal" | "large" = "small";

    let container: HTMLDivElement;
    let dateOptions = [
        { label: "Today", onClick: () => setDate(new Date()) },
        { label: "Tomorrow", onClick: () => setDate(addDays(new Date(), 1)) },
    ];

    eachDayOfInterval({
        start: addDays(new Date(), 2),
        end: addDays(new Date(), 6),
    }).map((date: Date) => {
        dateOptions.push({
            label: format(date, "EEEE"),
            onClick: () => setDate(date),
        });
    });

    if (!isWeekend(new Date())) {
        dateOptions.push({
            label: 'End of Week',
            onClick: () => setDate(endOfWeek(new Date(), {weekStartsOn: 6}))
        })
    }

    dateOptions.push({
        label: 'End of Weekend',
        onClick: () => setDate(endOfWeek(new Date(), {weekStartsOn: 1}))
    })

    if (!isWeekend(new Date())) {
        dateOptions.push({
            label: 'End of Next Week',
            onClick: () => setDate(addDays(startOfWeek(new Date(), {weekStartsOn: 1}), 11))
        })
    }

    dateOptions = dateOptions.concat([
        { label: "End of Month", onClick: () => setDate(endOfMonth(new Date())) },
        { label: "End of Next Month", onClick: () => setDate(endOfMonth(addMonths(new Date(), 1)))},
        {
            label: "Other date",
            onClick: () => {
                renderCalendar();
            },
        },
        { label: "Remove", onClick: () => setDate(undefined) },
    ]);

    const getColor = (dt: Date | undefined) => {
        if (!dt) return "grey";

        if (complete) return "rgb(60,250,60)";

        if (startOfDay(new Date()) > dt) return "rgb(250,45,45)";
        if (isToday(dt)) return "rgb(60,250,60)";
        if (isTomorrow(dt)) return "rgb(30,250,250)";

        return "rgb(230,230,230)";
    };

    const renderCalendar = () => {
        const modal = new Modal(app);
        modal.containerEl.style.padding = "0px";
        modal.containerEl.addClass("taskr-calendar-modal");
        modal.onOpen = () => {
            const { titleEl, contentEl } = modal;
            new CalendarPopup({
                target: contentEl,
                props: {
                    date: date,
                    setDate: (dt) => {
                        setDate(dt);
                        modal.close();
                    },
                },
            });
        };
        modal.onClose = (): void => {
            const { contentEl } = modal;
            contentEl.empty();
        };

        modal.open();
    };
</script>

<div
    class={`chip-container ${size}`}
    bind:this={container}
    on:click|stopPropagation={() => showDropdownMenu(dateOptions, container)}
>
    <div style="margin-right:8px; color:grey">
        {emoji}
    </div>
    <span style={`color:${getColor(date)}`}>
        {#if date}
            {formatDateRelativeToNow(date)}
        {:else}
            &nbsp;-&nbsp;
        {/if}
    </span>
</div>

<style>
    .chip-container {
        background-color: rgb(52, 52, 52);
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 10px;
        padding: 0px 5px;
        cursor: pointer;
        font-size: 14px;
    }
    .chip-container.small {
        font-size: 12px;
    }
    .chip-container.large {
        padding: 5px 10px;
        font-size: 14px;
    }

    :global(.taskr-calendar-modal .page-button) {
        padding: 0px !important;
    }

    :global(.taskr-calendar-modal .dropdown) {
        height: 1.5rem !important;
        padding: 0px !important;
    }

    :global(.taskr-calendar-modal .modal-close-button) {
        display: none !important;
    }

    :global(.taskr-calendar-modal .modal) {
        padding: 0px !important;
        width: auto !important;
    }

    :global(.taskr-calendar-modal) {
        --date-picker-background: #141414;
        --date-picker-foreground: white;
        --date-picker-highlight-border: rgba(1, 1, 1, 0);
        --date-picker-highlight-shadow: cyan;
        --date-picker-selected-color: white;
        --date-picker-selected-background: cyan;
    }
</style>
