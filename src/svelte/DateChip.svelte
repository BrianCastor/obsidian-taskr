<script lang="ts">
    import {
        startOfDay,
        isToday,
        isTomorrow,
        addDays,
        parse,
        format
    } from "date-fns";
    import { Menu, MenuItem } from "obsidian-svelte";
    import { formatDateRelativeToNow } from "../date_utils";

    export let date: Date | undefined;
    export let setDate: (date: Date | undefined) => void;
    export let emoji: string;
    export let complete: boolean | undefined = false;
    export let size: ("small" | "normal" | "large") = "small"

    let container: HTMLDivElement;
    let datePickerInputEl: HTMLInputElement;
    let open: boolean = false;
    let dateOptions = [
        { label: "Today", value: () => new Date() },
        { label: "Tomorrow", value: () => addDays(new Date(), 1) },
        { label: "+2 Days", value: () => addDays(new Date(), 2) },
        { label: "+3 Days", value: () => addDays(new Date(), 2) },
        { label: "+1 week", value: () => addDays(new Date(), 7) },
        /*{ label: "End of Week", value: () => addDays(new Date(), 2) },
        { label: "End of Weekend", value: () => addDays(new Date(), 2) },
        { label: "End of Next Week", value: () => addDays(new Date(), 2) },*/
        { label: "+1 month", value: () => addDays(new Date(), 30) },
       //{ label: "Remove", value: () => undefined}
    ];

    const getColor = (dt: Date | undefined) => {
        if (!dt) return "grey";

        if (complete) return "rgb(60,250,60)";

        if (startOfDay(new Date()) > dt) return "rgb(250,45,45)";
        if (isToday(dt)) return "rgb(60,250,60)";
        if (isTomorrow(dt)) return "rgb(30,250,250)";
        
        return "rgb(230,230,230)";
    };

    function openMenu() {
        open = true;
    }
    function closeMenu() {
        open = false;
    }
</script>

<div
    class={`chip-container ${size}`}
    style={`color:${getColor(date)}`}
    bind:this={container}
    on:click={() => openMenu()}
>
    <div style="margin-right:8px">
        {emoji}
    </div>
    <span>
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
            closeMenu();
        }}
        min={format(new Date(), 'yyyy-MM-dd')}
    />
    <Menu anchorEl={container} {open} onClose={() => closeMenu()}>
        {#each dateOptions as opt (opt.label)}
            <MenuItem
                label={opt.label}
                on:click={() => {
                    setDate(opt.value());
                    closeMenu();
                }}
            />
        {/each}
        <MenuItem
            label="Other Date"
            on:click={() => {
                datePickerInputEl.showPicker()
            }}
        />
        <MenuItem   
            label="Remove"
            on:click={() => {
                setDate(undefined)
                closeMenu()
            }}
        />
    </Menu>
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
