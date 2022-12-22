<script lang="ts">
    import { Menu, MenuItem } from "obsidian-svelte";
    import { allEfforts } from "../utils";

    export let effort: number | undefined;
    export let setEffort: (effort: number | undefined) => void;
    export let size: "small" | "large" = "small"

    let container: HTMLDivElement;
    let open: boolean = false;
    let options = allEfforts();

    let selectedOption: any = undefined;

    $ : {
        selectedOption = effort ? options.find((opt: any) => opt.value === effort) : undefined;
    } 

    const getColor = (eff: any) => {
        if (eff === 10) return "rgb(60,250,60)";
        if (eff === 30) return "rgb(30,235,250)";
        if (eff === 60) return "rgb(255, 255, 20)";
        if (eff === 120) return "rgb(255,87,51)";
        if (eff === 240) return "rgb(255,20,255)";

        return "grey";
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
    style={`color:${getColor(effort)}`}
    bind:this={container}
    on:click={() => openMenu()}
>
    <div style="font-weight:bold;">
        {#if selectedOption}
            {selectedOption.icon}
        {:else}
            <em>LOE</em>
        {/if}
    </div>
    <Menu anchorEl={container} {open} onClose={() => closeMenu()}>
        {#each options as opt (opt.label)}
            <MenuItem
                label={opt.label}
                on:click={() => {
                    setEffort(opt.value);
                    closeMenu();
                }}
            />
        {/each}
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
        font-size:13px;
    }
    .chip-container.large {
        padding:5px 10px;
        font-size: 14px;
    }

</style>
