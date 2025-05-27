import { choropleth } from "./charts/choropleth.js";
import { stackedArea } from "./charts/stackedarea.js";
import { linechart } from "./charts/linechart.js";

/**
 * Setup the datasets with the right structure
 * and values for each chart in the beginning
 */
async function Datasets() {
    const main_total_causes = await d3.csv("./resources/data/OECD_Cause_of_Mortality.csv");
    const aus_main_causes = await d3.csv("./resources/data/OECD_AUS_Cause_of_Mortality.csv");
    const birthrates = await d3.csv("./resources/data/Australia-Birth-Rate-Live-Births-Per-1000-People-2025-05-16-23-14.csv");

    main_total_causes.forEach(d => {
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

    aus_main_causes.forEach(d => {
        d.name = d.country;
        delete d.country;
        d.value = +d.value;

        if (d.Cause === "Codes for special purposes: COVID-19") {
            d.Cause = "COVID-19";
        }

        d.tooltip = `
            <div id="tooltip-header">
                <span id="tooltip-header-name">${d.Cause}</span>
                <span id="tooltip-header-year">${d.year}</span>
            </div>
            <div id="tooltip-content">
                <span id="tooltip-content-value">${d.value}</span>
                <span id="tooltip-content-measure">${d.measure}</span>
            </div>
        `;
    });

    birthrates.forEach(d => {
        d.value = +d.births * 100; // convert to per 100,000 people
        delete d.births;
        d.tooltip = `
            <div id="tooltip-header">
                <span id="tooltip-header-name">Births</span>
                <span id="tooltip-header-year">${d.year}</span>
            </div>
            <div id="tooltip-content">
                <span id="tooltip-content-value" style="color: #66bb6a">${d.value}</span>
                <span id="tooltip-content-measure">births per 100,000 inhabitants</span>
            </div>
        `;
    })

    return {
        choropleth(year, gender) {
            return d3.group(main_total_causes, d => +d.year == +year && d.sex === gender).get(true);
        },
        stackedArea(gender) {
            return d3.group(aus_main_causes, d => d.sex === gender).get(true);
        },
        lineChart() {
            const mortality = d3.group(main_total_causes, d => +d.year >= 2015 && +d.year <= 2022 && d.sex === "Total" && d.name === "Australia").get(true)
            mortality.forEach(d => {
                d.tooltip = `
                    <div id="tooltip-header">
                        <span id="tooltip-header-name">Mortality</span>
                        <span id="tooltip-header-year">${d.year}</span>
                    </div>
                    <div id="tooltip-content">
                        <span id="tooltip-content-value">${d.value}</span>
                        <span id="tooltip-content-measure">${d.measure}</span>
                    </div>
                `;
            })
            return [
                { category: "Mortality", values: mortality.sort((a, b) => +a.year - +b.year) },
                { category: "Birth", values: d3.group(birthrates, d => +d.year >= 2015 && +d.year <= 2022).get(true) }
            ];
        }
    }
}

/**
 * Instantiate a choropleth map visualization for mortality data.
 * - Data (e.g., csv) has been cleaned beforehand to reduce file size
 * - Preprocessing on initial load for sharing
*/
function mortality_choropleth(dataset) {
    const selection = "#choropleth";
    const choropleth_chart = choropleth();
    const domainThresholds = [799, 1199, 1599, 1999, 2400];
    const colorThreshold = ["#fcae91", "#fb6a4a", "#ef3b2c", "#b1121b", "#67000d"];

    choropleth_chart
        .width(700)
        .height(500)
        .dataset(dataset)
        .colorConfig({
            no_data: "#808080",
            border: "#808080",
            highlightBorder: "#800000",
            domain: domainThresholds,
            range: colorThreshold,
            scale: d3.scaleThreshold().domain(domainThresholds).range(colorThreshold)
        })(selection);
    return {
        update(newDataset) {
            choropleth_chart.dataset(newDataset)(selection);
        }
    }
}

/**
 * Instantiate a stacked area line graph visualization for 
 * australian mortality rate and top 5 causes of death.
*/
function stackedArea_CausesOfDeath(dataset) {
    let cleanedData = [];
    const xDomain = Array.from(new Set(dataset.map(d => d.year))).sort((a, b) => a - b);
    xDomain.forEach((year) => {
        cleanedData.push(...(dataset.filter(d => d.year == year)).sort((a, b) => b.value - a.value).slice(0, 6));
    })

    const selection = "#stackedArea";
    const myChart = stackedArea();
    myChart
        .width(700)
        .height(350)
        .data(cleanedData)
        .categories(d3.union(cleanedData.map(d => d["Cause"])))
        .seriesIndex(d3.index(cleanedData, d => d.year, d => d["Cause"]))
        .xDomain(xDomain)(selection);

    return {
        update(newDataset) {
            let cleanedData = [];
            const xDomain = Array.from(new Set(newDataset.map(d => d.year))).sort((a, b) => a - b);
            xDomain.forEach((year) => {
                cleanedData.push(...(newDataset.filter(d => d.year == year)).sort((a, b) => b.value - a.value).slice(0, 6));
            })

            myChart
                .data(cleanedData)
                .categories(d3.union(cleanedData.map(d => d["Cause"])))
                .seriesIndex(d3.index(cleanedData, d => d.year, d => d["Cause"]))
                .xDomain(xDomain)
                (selection);
        }
    }
}

/**
 * Instantiate a line chart visualization for 
 * australian mortality against birth rate.
*/
function death_birth_line_chart(datasets) {
    const selection = "#linechart";
    const myChart = linechart();
    myChart
        .width(700)
        .height(350)
        .datasets(datasets)
        .categories(["Deaths", "Births"])
        (selection)

    return {
        update(newDataset) {
            myChart.datasets(newDataset)(selection);
        }
    }
}

/**
 * Global Instances
 */
const filterState = {
    year: 2015,
    gender: "Total",
};

let datasetAPI = null;
let myChoropleth = null;
let myStackedArea = null;
let myLinechart = null;
let myBubbleChart = null;


/**
 * Sets default filter and events 
 */
function setFilter() {
    const filter = document.getElementById("FilterForm");
    const genderRadios = filter.elements['gender'];
    const yearSlider = filter.elements['yearSlider'];
    const yearText = filter.elements['yearText'];


    function setDefault() {
        Array.from(genderRadios).forEach(radio => {
            if (radio.value === filterState.gender) {
                radio.checked = true;
            } else {
                radio.checked = false;
            }
        })
        yearSlider.value = filterState.year;
        yearText.value = filterState.year;
    }

    function setEvents() {
        filter.addEventListener("submit", (e) => e.preventDefault());

        // Gender Radio Buttons
        Array.from(genderRadios).forEach(radio => {
            radio.addEventListener("change", (e) => {
                const gender = e.target.value;
                filterState.gender = gender;

                // Update
                myChoropleth.update(datasetAPI.choropleth(filterState.year, filterState.gender));
                myStackedArea.update(datasetAPI.stackedArea(filterState.gender));
            });
        })

        // Year Slider Input
        yearSlider.addEventListener("input", (e) => {
            const year = +e.target.value;
            filterState.year = year;

            // Update
            myChoropleth.update(datasetAPI.choropleth(filterState.year, filterState.gender));

            // UI Update
            yearText.value = year;

        })

        // Year Text Input
        yearText.addEventListener("input", (e) => {
            const value = e.target.value;
            if (+value < +yearSlider.min || +value > +yearSlider.max) return;
            filterState.year = year;

            // Update
            myChoropleth.update(datasetAPI.choropleth(filterState.year, filter.gender));

            // UI Update
            yearSlider.value = value;
        })
    }

    setDefault();
    setEvents();
}

window.onload = async () => {
    datasetAPI = await Datasets();
    myChoropleth = mortality_choropleth(datasetAPI.choropleth(filterState.year, filterState.gender));
    myStackedArea = stackedArea_CausesOfDeath(datasetAPI.stackedArea(filterState.gender));
    myLinechart = death_birth_line_chart(datasetAPI.lineChart());

    setFilter();
}