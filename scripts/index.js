// TODO: Add tickbox male, female, total
// TODO: Add slider
// TODO: Parse datasets to json file


import { choropleth } from "./charts/choropleth.js";
import { stackedArea } from "./charts/linechart.js";

const datasets = {
    total_mortality: [],
    aus_causes_mortality: [],
    aus_birthrate: [],
}

async function setDatasets() {
    try {
        datasets.total_mortality = await d3.csv("./resources/data/OECD_Cause_of_Mortality.csv");
        datasets.aus_causes_mortality = await d3.csv("./resources/data/OECD_AUS_Cause_of_Mortality.csv");
        datasets.aus_birthrate = await d3.csv("./resources/data/Australia-Birth-Rate-Live-Births-Per-1000-People-2025-05-16-23-14.csv");
    } catch (error) {
        console.error("Failed to set datasets: " + error);
    }
}

/**
 * Instantiate a choropleth map visualization for mortality data.
 * - Data (e.g., csv) has been cleaned beforehand to reduce file size
 * - Preprocessing on initial load for sharing
 * @description Mortality per 100,000 inhabitants - World Choropleth
*/
async function mortality_choropleth() {
    /**
     * CSV processing for simple data structure is more
     * efficient than json in terms of load time and size
     */
    const raw = structuredClone(datasets.total_mortality);
    raw.forEach(d => {
        d.name = d.country;
        delete d.country;
        d.value = +d.value;
        d.tooltip = `
            <div id="tooltip-header">
                <span id="tooltip-header-name">${d.name}</span>
                <span id="tooltip-header-year">${d.year}</span>
            </div>
            <div id="tooltip-content">
                <span id="tooltip-content-value">${d.value}</span>
                <span id="tooltip-content-measure">${d.measure}</span>
            </div>
        `;
    });

    const dataset = {
        y2015: d3.group(raw, d => d.year == 2015 && d.sex === "Total").get(true),
        y2016: d3.group(raw, d => d.year == 2016 && d.sex === "Total").get(true),
        y2017: d3.group(raw, d => d.year == 2017 && d.sex === "Total").get(true),
        y2018: d3.group(raw, d => d.year == 2018 && d.sex === "Total").get(true),
        y2019: d3.group(raw, d => d.year == 2019 && d.sex === "Total").get(true),
        y2020: d3.group(raw, d => d.year == 2020 && d.sex === "Total").get(true),
        y2021: d3.group(raw, d => d.year == 2021 && d.sex === "Total").get(true),
        y2022: d3.group(raw, d => d.year == 2022 && d.sex === "Total").get(true),
        y2015_m: d3.group(raw, d => d.year == 2015 && d.sex === "Male").get(true),
        y2016_m: d3.group(raw, d => d.year == 2016 && d.sex === "Male").get(true),
        y2017_m: d3.group(raw, d => d.year == 2017 && d.sex === "Male").get(true),
        y2018_m: d3.group(raw, d => d.year == 2018 && d.sex === "Male").get(true),
        y2019_m: d3.group(raw, d => d.year == 2019 && d.sex === "Male").get(true),
        y2020_m: d3.group(raw, d => d.year == 2020 && d.sex === "Male").get(true),
        y2021_m: d3.group(raw, d => d.year == 2021 && d.sex === "Male").get(true),
        y2022_m: d3.group(raw, d => d.year == 2022 && d.sex === "Male").get(true),
        y2015_f: d3.group(raw, d => d.year == 2015 && d.sex === "Female").get(true),
        y2016_f: d3.group(raw, d => d.year == 2016 && d.sex === "Female").get(true),
        y2017_f: d3.group(raw, d => d.year == 2017 && d.sex === "Female").get(true),
        y2018_f: d3.group(raw, d => d.year == 2018 && d.sex === "Female").get(true),
        y2019_f: d3.group(raw, d => d.year == 2019 && d.sex === "Female").get(true),
        y2020_f: d3.group(raw, d => d.year == 2020 && d.sex === "Female").get(true),
        y2021_f: d3.group(raw, d => d.year == 2021 && d.sex === "Female").get(true),
        y2022_f: d3.group(raw, d => d.year == 2022 && d.sex === "Female").get(true),
    }

    const choropleth_chart = choropleth();
    const selection = document.getElementById("choropleth");

    // Setup custom settings
    const domainThresholds = [799, 1199, 1599, 1999, 2400];
    const colorThreashold = ["#fcae91", "#fb6a4a", "#ef3b2c", "#b1121b", "#67000d"];

    choropleth_chart
        .width(700)
        .height(400)
        .dataset(dataset.y2017)
        .colorConfig({
            no_data: "#808080",
            border: "#808080",
            highlightBorder: "#800000",
            domain: domainThresholds,
            range: colorThreashold,
            scale: d3.scaleThreshold().domain(domainThresholds).range(colorThreashold)
        })

    choropleth_chart(selection);

    d3.select("#btnChange").on("click", () => {
        choropleth_chart.dataset(dataset.y2015)
        choropleth_chart(selection);
    })
}

/**
 * Instantiate a stacked area line graph visualization for 
 * australian mortality rate and top 5 causes of death.
 * @description Mortality per 100,000 inhabitants - Stacked Area Chart
*/
async function stackedArea_CausesOfDeath() {
    const raw = datasets.aus_causes_mortality;
    let dataset = [];
    const xDomain = Array.from(new Set(raw.map(d => d.Year))).sort((a, b) => a - b);
    xDomain.forEach((year) => {
        dataset.push(...(raw.filter(d => d.Year == year)).sort((a, b) => b.value - a.value).slice(0, 6));
    })

    const categories = d3.union(dataset.map(d => d["Cause Code"]));
    const index = d3.index(dataset, d => d.Year, d => d["Cause Code"]);
    const myChart = stackedArea()
    myChart
        .width(700)
        .height(400)
        .data(dataset)
        .categories(categories)
        .seriesIndex(index)
        .xDomain(xDomain);
    myChart("#stackedArea");
}

window.onload = async () => {
    await setDatasets();
    mortality_choropleth();
    stackedArea_CausesOfDeath();
}