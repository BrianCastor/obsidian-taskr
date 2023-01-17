<script lang="ts">
    import {
        eachDayOfInterval,
        format,
        parse,
        startOfDay,
        startOfToday,
        subDays,
    } from "date-fns";
    import { allTasksCache } from "../cache";
    import type { Task } from "src/task";
    import type TaskrPlugin from "main";
    import ApexChart from "./ApexChart.svelte";
    import ButtonGroup from "./ButtonGroup.svelte";

    export let plugin: TaskrPlugin;

    let datasets: any[] = [];
    let datePreset: string = "W";

    const presetToDaysAgo: Record<string, number | undefined> = {
        W: 7,
        M: 31,
        "6M": 182,
        Y: 365,
        All: undefined,
    };

    const FONT_COLOR = "rgba(140,150,150,.5)";

    let options: any = {
        chart: {
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
        series: datasets,
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
            max: startOfToday().getTime(),
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
            curve: "straight",
        },
        tooltip: {
            theme: "dark",
        },
        fill: {
            type: ["gradient", "solid"],
            gradient: {
                shade: 'dark',
                opacityFrom: 0.8,
                opacityTo: 0.1,
                stops: [0, 100],
                type: 'vertical',
            },
        },
        colors: ["#00E396", "#CC5500"],
    };

    $: {
        if (datePreset) {
            const daysAgo = presetToDaysAgo[datePreset];
            options.xaxis.min = daysAgo
                ? subDays(startOfToday(), daysAgo).getTime()
                : null;
        }
    }

    allTasksCache.subscribe((ts: Task[]) => {
        const tasks: Task[] = ts.filter((task: Task) => {
            return task.complete;
        });

        if (tasks.length === 0) {
            datasets = [];
            return;
        }

        const goalStartDate = parse(
            plugin.settings.TaskCompletionStartDate,
            "yyyy-MM-dd",
            new Date()
        );

        const temp = Math.min(
            ...ts.map((t: Task) => {
                return t.completed_date?.getTime() || new Date().getTime();
            }),
            goalStartDate.getTime()
        );
        const startDate = startOfDay(new Date(temp));

        const groupedByDate = tasks.reduce(function (
            rv: Record<string, number>,
            task
        ) {
            const dt_string = format(task.completed_date ?? 0, "yyyy-MM-dd");
            rv[dt_string] = (rv[dt_string] ?? 0) + (task.effort ?? 0) / 60;
            return rv;
        },
        {});

        let runningTotal = 0;
        const seriesTemp = eachDayOfInterval({
            start: startDate,
            end: new Date(),
        }).map((date: Date) => {
            const dtStr = format(date, "yyyy-MM-dd");
            if (groupedByDate[dtStr]) {
                runningTotal += groupedByDate[dtStr];
            }
            return {
                x: dtStr,
                y: runningTotal,
            };
        });

        let runningTotal2 = 0;
        const series2Temp = eachDayOfInterval({
            start: goalStartDate,
            end: new Date(),
        }).map((date: Date) => {
            runningTotal2 += plugin.settings.DailyBandwidth;
            return {
                x: format(date, "yyyy-MM-dd"),
                y: runningTotal2 - plugin.settings.DailyBandwidth,
            };
        });

        datasets = [
            {
                data: seriesTemp,
                name: "Completed",
                type: "area",
            },
            {
                data: series2Temp,
                name: "Goal",
                type: "line",
            },
        ];
    });
</script>

<ButtonGroup
    options={Object.keys(presetToDaysAgo)}
    value={datePreset}
    onChange={(value) => (datePreset = value)}
/>
<ApexChart {datasets} chartOptions={options} />

<style>
</style>
