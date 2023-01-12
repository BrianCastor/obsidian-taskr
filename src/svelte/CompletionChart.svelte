<script lang="ts">
    import {
        eachDayOfInterval,
        format,
        startOfDay,
        startOfToday,
    } from "date-fns";
    import { allTasksCache } from "../cache";
    import type { Task } from "src/task";
    import { onMount, onDestroy } from "svelte";
    import ApexCharts from "apexcharts";
    import type TaskrPlugin from "main";

    export let plugin: TaskrPlugin;

    let chartElem: HTMLElement;
    let chart: any;

    let series: any = [];
    let series2: any = [];

    const FONT_COLOR = "rgba(140,150,150,.5)";

    let options: any = {
        chart: {
            type: "area",
            height: 220,
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: true,
            labels: {
                colors: FONT_COLOR,
            },
        },
        series: [],
        yaxis: {
            title: { text: "Hours", style: { color: FONT_COLOR } },
            opposite: true,
            labels: {
                formatter: function (value: number) {
                    return value.toLocaleString("us-EN", {
                        maximumFractionDigits: 1,
                    });
                },
                style: {
                    colors: FONT_COLOR,
                },
            },
        },
        xaxis: {
            type: "datetime",
            max: new Date().getTime(),
            labels: {
                style: {
                    colors: FONT_COLOR,
                },
            },
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: true,
                color: "rgba(150,150,150,.4)",
            },
        },
        grid: {
            show: true,
            borderColor: "rgba(150,150,150,.2)",
        },
        stroke: {
            curve: "stepline",
        },
        tooltip: {
            theme: 'dark'
        },

        colors: ["#CC5500", "#00E396"],
    };

    allTasksCache.subscribe((ts: Task[]) => {
        const temp = Math.min(
            ...ts.map((t: Task) => {
                return Math.min(
                    (t.created_date || new Date()).getTime(),
                    (t.completed_date || new Date()).getTime()
                );
            })
        );
        const startDate = startOfDay(new Date(temp));

        const tasks: Task[] = ts.filter((task: Task) => {
            return task.complete;
        });

        if (tasks.length === 0) {
            series = [];
            series2 = [];
            return;
        }

        const groupedByDate = tasks.reduce(function (
            rv: Record<string, number>,
            task
        ) {
            const dt_string = format(task.completed_date ?? 0, "yyyy-MM-dd");
            rv[dt_string] = rv[dt_string]
                ? (rv[dt_string] += task.effort ?? 0) / 60
                : (task.effort ?? 0) / 60;
            return rv;
        },
        {});

        const todayStr = format(startOfToday(), "yyyy-MM-dd");
        if (!Object.keys(groupedByDate).includes(todayStr)) {
            groupedByDate[todayStr] = 0;
        }

        const firstDayStr = format(startDate, "yyyy-MM-dd");
        if (!Object.keys(groupedByDate).includes(firstDayStr)) {
            groupedByDate[firstDayStr] = 0;
        }

        const labels = Object.keys(groupedByDate).sort();

        let runningTotal = 0;
        const seriesTemp = labels.map((label: string) => {
            runningTotal += groupedByDate[label];
            return {
                x: label,
                y: runningTotal,
            };
        });
        series = seriesTemp;

        let runningTotal2 = 0;
        const series2Temp = eachDayOfInterval({
            start: startDate,
            end: new Date(),
        }).map((date: Date) => {
            runningTotal2 += plugin.settings.DailyBandwidth;
            return {
                x: format(date, "yyyy-MM-dd"),
                y: runningTotal2,
            };
        });

        series2 = series2Temp;
    });

    $: {
        if (chart && series) {
            chart.updateSeries([
                {
                    data: series2,
                    name: "Goal",
                },
                {
                    data: series,
                    name: "Completed",
                },
            ]);
        }
    }

    onMount(() => {
        chart = new ApexCharts(chartElem, options);
        chart.render();
    });

    onDestroy(() => {
        chart.destroy();
    });
</script>

<div bind:this={chartElem} />

<style>
</style>
