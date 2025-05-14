// TODO: Add tickbox male, female, total
// TODO: Add slider
// TODO: Parse datasets to json file


import { choropleth } from "./charts/choropleth.js";
import { stackedArea } from "./charts/linechart.js";

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
    const main_dataset = await d3.csv("./resources/data/OECD_Cause_of_Mortality.csv");
    main_dataset.forEach(d => {
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

    const rawData = {
        y2015: d3.group(main_dataset, d => d.year == 2015 && d.sex === "Total").get(true),
        y2016: d3.group(main_dataset, d => d.year == 2016 && d.sex === "Total").get(true),
        y2017: d3.group(main_dataset, d => d.year == 2017 && d.sex === "Total").get(true),
        y2018: d3.group(main_dataset, d => d.year == 2018 && d.sex === "Total").get(true),
        y2019: d3.group(main_dataset, d => d.year == 2019 && d.sex === "Total").get(true),
        y2020: d3.group(main_dataset, d => d.year == 2020 && d.sex === "Total").get(true),
        y2021: d3.group(main_dataset, d => d.year == 2021 && d.sex === "Total").get(true),
        y2022: d3.group(main_dataset, d => d.year == 2022 && d.sex === "Total").get(true),
        y2015_m: d3.group(main_dataset, d => d.year == 2015 && d.sex === "Male").get(true),
        y2016_m: d3.group(main_dataset, d => d.year == 2016 && d.sex === "Male").get(true),
        y2017_m: d3.group(main_dataset, d => d.year == 2017 && d.sex === "Male").get(true),
        y2018_m: d3.group(main_dataset, d => d.year == 2018 && d.sex === "Male").get(true),
        y2019_m: d3.group(main_dataset, d => d.year == 2019 && d.sex === "Male").get(true),
        y2020_m: d3.group(main_dataset, d => d.year == 2020 && d.sex === "Male").get(true),
        y2021_m: d3.group(main_dataset, d => d.year == 2021 && d.sex === "Male").get(true),
        y2022_m: d3.group(main_dataset, d => d.year == 2022 && d.sex === "Male").get(true),
        y2015_f: d3.group(main_dataset, d => d.year == 2015 && d.sex === "Female").get(true),
        y2016_f: d3.group(main_dataset, d => d.year == 2016 && d.sex === "Female").get(true),
        y2017_f: d3.group(main_dataset, d => d.year == 2017 && d.sex === "Female").get(true),
        y2018_f: d3.group(main_dataset, d => d.year == 2018 && d.sex === "Female").get(true),
        y2019_f: d3.group(main_dataset, d => d.year == 2019 && d.sex === "Female").get(true),
        y2020_f: d3.group(main_dataset, d => d.year == 2020 && d.sex === "Female").get(true),
        y2021_f: d3.group(main_dataset, d => d.year == 2021 && d.sex === "Female").get(true),
        y2022_f: d3.group(main_dataset, d => d.year == 2022 && d.sex === "Female").get(true),
    }

    const choropleth_chart = choropleth();
    const selection = document.getElementById("choropleth");

    // Setup custom settings
    const domainThresholds = [799, 1199, 1599, 1999, 2400];
    const colorThreashold = ["#fcae91", "#fb6a4a", "#ef3b2c", "#b1121b", "#67000d"];

    choropleth_chart
        .width(800)
        .height(500)
        .dataset(rawData.y2017)
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
        choropleth_chart.dataset(rawData.y2015)
        choropleth_chart(selection);
    })
}

/**
 * Instantiate a stacked area line graph visualization for 
 * australian mortality rate and top 5 causes of death.
 * @description Mortality per 100,000 inhabitants - Stacked Area Chart
*/
async function stackedArea_CausesOfDeath() {
    const raw = await d3.csv("./resources/data/OECD_AUS_Cause_of_Mortality.csv");
    let data = [];
    const xDomain = Array.from(new Set(raw.map(d => d.Year))).sort((a, b) => a - b);
    xDomain.forEach((year) => {
        data.push(...(raw.filter(d => d.Year == year)).sort((a, b) => b.value - a.value).slice(0, 6));
        // data.slice(0, 6).forEach((d, i) => {
        //     console.log(`${d.Year} - ${i + 1} ${d["Cause"]}`)
        // }) // DEBUG
    })


    const categories = d3.union(data.map(d => d["Cause Code"]));
    const index = d3.index(data, d => d.Year, d => d["Cause Code"]);

    const myChart = stackedArea()
    myChart
        .width(1000)
        .height(500)
        .data(data)
        .categories(categories)
        .seriesIndex(index)
        .xDomain(xDomain);
    myChart("#stackedArea");
}

function initCharts() {
    mortality_choropleth();
    stackedArea_CausesOfDeath();
    /**
     * Instantiate a line graph visualization for death and birth rate
     * @description rate per 100,000 inhabitants in Australia
     * between mortality and birth
     */

    /**
     * Instantiate a bubble chart visualization to visualize all causes of mortality
     * @description number of deaths per 100,000 for each cause of mortality
     * each year
     */
}

let draggable = false;

function handleEnterDraggable(event) {
    const element = event.target;
    draggable = true;
    element.classList.add("grab");
    element.classList.remove("grabbing");
    console.log("enter")
}

function handleLeaveDraggable(event) {
    const element = event.target;
    draggable = false;
    element.classList.remove("grab");
    element.classList.remove("grabbing");
    console.log("leave")
}

function handleDownDraggable(event) {
    if (!draggable) return;
    const element = event.target;
    element.classList.add("grabbing");
    element.classList.remove("grab");
    console.log("down")
}

function handleUpDraggable(event) {
    if (!draggable) return;
    const element = event.target;
    element.classList.add("grab");
    element.classList.remove("grabbing");
    console.log("up")
}

window.onload = async () => {
    initCharts();
}