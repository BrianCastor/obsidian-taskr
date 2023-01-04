<script lang="ts">
    import type { Project } from "../project";
    import { allProjectsCache } from "../cache";
    import { showDropdownMenu, type DropdownMenuOption } from "../components/DropdownMenu";

    export let project: string | undefined;
    export let setProject: (project: string | undefined) => void;
    export let size: "small" | "large" = "small"
    export let hideText: boolean | undefined = false;

    let container: HTMLDivElement;
    let options : DropdownMenuOption[] = $allProjectsCache.map((opt: Project) => {
        return {
            label: opt.title,
            onClick: () => setProject(opt.title)
        }
    })

    let selectedOption: DropdownMenuOption | undefined = undefined;

    $ : {
        selectedOption = project ? options.find((opt: any) => opt.label === project) : undefined;
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
    on:click|stopPropagation={() => showDropdownMenu(options, container)}
>
    <div>
        {#if selectedOption}
            {#if hideText && selectedOption.label && selectedOption.label.length > 0}
                {selectedOption.label.match(/[\p{Emoji}\u200d]+/gu) ?? selectedOption.label[0]}
            {:else}
                {selectedOption.label}
            {/if}
        {:else}
            <em>Project</em>
        {/if}
    </div>
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
