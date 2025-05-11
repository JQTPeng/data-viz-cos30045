// TODO: Add tickbox male, female, total
// TODO: Add slider


import { choropleth } from "./charts/worldmap.js";

async function initCharts() {
    /**
     * Instantiate a choropleth map visualization for mortality data.
     * @description Mortality per 100,000 inhabitants - World Choropleth
    */
    const main_dataset = await d3.csv("./resources/data/OECD_Cause_of_Mortality.csv");
    main_dataset.forEach(d => {
        d.name = d.country;
        delete d.country;
        d.value = +d.value;
        d.tooltip = `
            <p><strong>${d.name}</strong> ${d.year}</p>
            <p>${d.value} ${d.measure}</p>
        `;
    });

    const mortality_datasets = {
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
    choropleth_chart.dataset(mortality_datasets.y2015);
    choropleth_chart(selection);

    d3.select("#btnChange").on("click", () => {
        choropleth_chart.dataset(mortality_datasets.y2017);
        choropleth_chart(selection);
    })

    /**
     * Instantiate a line graph visualization for death and birth rate
     * @description rate per 100,000 inhabitants in Australia
     * between mortality and birth
     */


    /**
     * Instantiate a stream line graph visualization for death and birth rate
     * @description number of deaths measured for total deaths and top 
     * causes of mortality each year
     */

    /**
     * Instantiate a bubble chart visualization to visualize all causes of mortality
     * @description number of deaths per 100,000 for each cause of mortality
     * each year
     */
}

window.onload = async () => {
    initCharts();
}