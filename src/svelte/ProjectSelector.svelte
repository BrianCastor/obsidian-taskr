<script lang="ts">
    import { Menu, MenuItem } from "obsidian-svelte";
    import { allProjects } from "../utils";

    export let project: string | undefined;
    export let setProject: (project: string | undefined) => void;
    export let size: "small" | "large" = "small"

    let container: HTMLDivElement;
    let open: boolean = false;
    let options = allProjects()

    let selectedOption: Record<string, string> | undefined = undefined;

    $ : {
        selectedOption = project ? options.find((opt: any) => opt.label === project) : undefined;
    } 

    function openMenu() {
        open = true;
    }
    function closeMenu() {
        open = false;
    }

    function getColor(proj: string | undefined) {
        if (!proj) return 'grey';

        return 'white';
    }
</script>

<div
    class={`chip-container ${size}`}
    style={`color:${getColor(project)}`}
    bind:this={container}
    on:click={() => openMenu()}
>
    <div>
        {#if selectedOption}
            {selectedOption.label}
        {:else}
            <em>Project</em>
        {/if}
    </div>
    <Menu anchorEl={container} {open} onClose={() => closeMenu()}>
        {#each options as opt (opt.label)}
            <MenuItem
                label={opt.label}
                on:click={() => {
                    setProject(opt.label);
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
