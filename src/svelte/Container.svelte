<script lang="ts">
    export let addBottomPadding = false;

</script>


<div class={`c ${addBottomPadding && 'padded'}`}>
    <div style="max-width:725px; margin:auto; flex-grow:1">
        <slot></slot>
    </div>
</div>

<style>
    .c {
        display:flex;
        justify-content:center;
    }

    .c,.padded {
        padding-bottom: 65px;
    }
</style>