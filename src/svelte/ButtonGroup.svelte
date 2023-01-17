<script lang="ts">
    export let options: string[];
    export let value: string;
    export let onChange: (value: string) => void;
</script>

<div style="width:100%; display:flex; justify-content:center">
    <div class="taskr-button-group">
        {#each options as opt, index}
            <div
                class={`buttonGroupButton ${opt === value ? "active" : ''}`}
                on:click={() => onChange(opt)}
            >
                {opt}
            </div>
            {#if index !== options.length - 1}
                {#if options[index] === value || options[index + 1] === value}
                    <div style="color:grey; visibility:hidden">|</div>
                {:else}
                    <div style="color:grey">|</div>
                {/if}
            {/if}
        {/each}
    </div>
</div>

<style>
    .taskr-button-group {
        display:flex;
        justify-content:center;
        align-items: center;
        color:white;
        border-radius:3px;     
        font-size:12px;   
        background-color: rgb(19, 23, 23) !important;
    }

    .buttonGroupButton {
        width:50px;
        text-transform: uppercase;
        cursor:pointer;
        text-align: center;
        padding-top:3px;
        padding-bottom:3px;
    }

    .buttonGroupButton.active {
        border-radius:3px;
        background-color:rgb(99, 99, 99) !important;
    }
</style>
