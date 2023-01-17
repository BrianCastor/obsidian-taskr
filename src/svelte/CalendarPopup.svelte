<script lang="ts">
    import {DatePicker} from 'date-picker-svelte';
    import { addDays } from 'date-fns';

    export let date: Date | undefined;
    export let setDate: (date: Date | undefined) => void;

</script>

<DatePicker
    bind:value={date}
    on:select={() => {
        setDate(date);
    }}
    min={addDays(new Date(), -30)}
    max={addDays(new Date(), 365)}
    locale={{
        weekStartsOn: 0
    }}
/>