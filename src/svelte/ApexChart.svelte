<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import ApexCharts from "apexcharts";

    export let datasets: any[] = [];
    export let chartOptions: any = {};

    let chartElem: HTMLElement;
    let chart: any;
    let rendered = false;

    $ : {
        if (datasets && chartOptions && rendered) {
            chart?.updateOptions(chartOptions)
            chart?.updateSeries(datasets);
        }
    }

    onMount( async () => {
        chart = new ApexCharts(chartElem, chartOptions);
        await chart.render()
        setTimeout(() => rendered = true, 15)    //Hack to fix rendering issue
    });

    onDestroy(() => {
        chart.destroy();
    });
</script>

<div bind:this={chartElem} />

<style>
</style>
