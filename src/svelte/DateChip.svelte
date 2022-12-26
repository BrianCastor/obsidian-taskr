<script lang="ts">
    import {
        startOfDay,
        isToday,
        isTomorrow,
        addDays,
        parse,
        format
    } from "date-fns";
    import { formatDateRelativeToNow } from "../date_utils";
    import {showDropdownMenu} from "../components/DropdownMenu";

    export let date: Date | undefined;
    export let setDate: (date: Date | undefined) => void;
    export let emoji: string;
    export let complete: boolean | undefined = false;
    export let size: ("small" | "normal" | "large") = "small"

    let container: HTMLDivElement;
    let datePickerInputEl: HTMLInputElement;
    let open: boolean = false;
    let dateOptions = [
        { label: "Today", onClick: () => (setDate(new Date()))},
        { label: "Tomorrow", onClick: () => (setDate(addDays(new Date(), 1))) },
        { label: "+2 Days", onClick: () => (setDate(addDays(new Date(), 2)))},
        { label: "+3 Days", onClick: () => (setDate(addDays(new Date(), 2))) },
        { label: "+1 week", onClick: () => (setDate(addDays(new Date(), 7))) },
        { label: "+1 month", onClick: () => (setDate(addDays(new Date(), 30))) },
        { label: "Other date", onClick: () => (datePickerInputEl.showPicker())},
        { label: "Remove", onClick: () => (setDate(undefined))}
    ];

    const getColor = (dt: Date | undefined) => {
        if (!dt) return "grey";

        if (complete) return "rgb(60,250,60)";

        if (startOfDay(new Date()) > dt) return "rgb(250,45,45)";
        if (isToday(dt)) return "rgb(60,250,60)";
        if (isTomorrow(dt)) return "rgb(30,250,250)";
        
        return "rgb(230,230,230)";
    };

</script>

<div
    class={`chip-container ${size}`}
    bind:this={container}
    on:click={() => showDropdownMenu(dateOptions, container)}
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
    <input 
        type="date"
        bind:this={datePickerInputEl}
        style="visibility: hidden;min-width: 0;max-width: 0;padding: 0;border: 0;"
        on:change={(e) => {
            let tempDateStr = e.currentTarget?.value;
            let dt = tempDateStr ? parse(tempDateStr, 'yyyy-MM-dd', new Date()) : undefined
            setDate(dt);
            open = false
        }}
        min={format(new Date(), 'yyyy-MM-dd')}
    />
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
        font-size:14px;
    }
    .chip-container.small {
        font-size:12px;
    }
    .chip-container.large {
        padding:5px 10px;
        font-size:14px;
    }


</style>
