// TODO: Add density legend scale
// TODO: Title & Caption, etc options

function choropleth() {
    const projection = d3.geoMercator();
    const path = d3.geoPath()
    const color = d3.scaleQuantize().range(["#fcae91", "#fb6a4a", "#ef3b2c", "#b1121b", "#67000d"]);
    let svg = null;

    let width = 1000;
    let height = 1000;
    let padding = 10;

    /** 
     * @type {Array<{name: string, year: number, value: number, measure: string, tooltip: string}>}
     * @description An array of the specified object scheme
     */
    let dataset = [];

    /**
    * @type {Object}
    * @description A data holder for TopJSON or GeoJSON geographical data files. 
    */
    let geoJson = {};

    /**
    * Renders the choropleth chart inside the given selection.
    * This function will append an SVG element to the selected DOM element and draw the map based on data.
    * @description Use this function for enter, updates and exits.
    * @param {d3.Selection} selection - The D3 selection (e.g., a div or another DOM element) where the chart will be rendered.
    */
    async function chart(selection) {
        // console.log(dataset); DEBUG
        svg = d3.select(selection).select("svg");

        if (svg.empty()) {
            svg = d3.select(selection)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "white");
        }

        color.domain([d3.min(dataset, d => d.value), d3.max(dataset, d => d.value)])
        const bins = color.range().map(c => color.invertExtent(c));
        console.log(bins);
        geoJson = await d3.json("./resources/json/countries.json").then((json) => dataset_to_geoJson(dataset, json));
        projection
            .scale(1000)
            .fitExtent([[padding, padding], [width - padding, height - padding]], geoJson);
        path.projection(projection);

        console.log(geoJson.features)
        // create path
        svg.selectAll("path")
            .data(geoJson.features)
            .join(
                enter => enter
                    .append("path")
                    .attr("id", d => d.properties.name.trim().replace(/\s/g, ''))
                    .attr("d", path)
                    .call(setEvents)
                    .transition()
                    .duration(300)
                    .delay(50)
                    .call(setStyles),
                update => update
                    .attr("d", path)
                    .transition()
                    .duration(300)
                    .delay(50)
                    .call(setStyles),
                exit => exit.remove()
            )
    }

    /**
    * Sets event handlers for the selection
    * @param {d3.Selection} selection - A D3 selection of SVG elements.
    */
    function setEvents(selection) {
        selection
            .on("mouseover.tooltip", (event, data) => {
                if (data.properties.value === undefined) return;
                setToolTip_relative_client(data.properties.tooltip, event.clientX, event.clientY, 20);
            })
            .on("mouseover.highlight", (event, data) => {
                if (data.properties.value === undefined) return;
                d3.select(event.target)
                    .raise()
                    .style("stroke", "black")
                    .style("stroke-width", 2)
            })
            .on("mouseout.reset", (event, data) => {
                if (data.properties.value === undefined) return;
                d3.select("#tooltip").remove();
                resetPathOrder();
                d3.select(event.target)
                    .style("stroke", "white")
                    .style("stroke-width", 1)
            })
    }

    /**
    * Sets fill and stroke styles countries.
    * @param {d3.Selection} selection - A D3 selection of SVG elements.
    */
    function setStyles(selection) {
        selection
            .style("fill", (d) => {
                let value = d.properties.value;
                if (value) { return color(value); }
                return "#999";
            })
            .style("stroke", "white")
            .style("stroke-width", 1)
    }

    /**
     * Renders the tooltip relative to given position
     * @param {string} tooltip 
     * @param {number} left px - clientX
     * @param {number} top px - clientY
     * @param {number} offset px - relative to client
     */
    function setToolTip_relative_client(tooltip, left, top, offset) {
        d3.select("body")
            .append("div")
            .attr("id", "tooltip")
            .style("height", "max-content")
            .style("width", "max-content")
            .style("left", `${left + offset}px`)
            .style("top", `${top + offset}px`)
            .style("position", "absolute")
            .style("background", "white")
            .style("opacity", "0")
            .html(tooltip)
            .transition()
            .duration(100)
            .delay(50)
            .style("left", `${left + offset}px`)
            .style("top", `${top + offset}px`)
            .style("opacity", "1")

    }

    /**
     * Crucial function to make sure the update transition is smooth
     * @description Resets the order of path elements in the SVG DOM 
     */
    function resetPathOrder() {
        let count = 0;
        geoJson.features.forEach(data => {
            const name = data.properties.name.trim().replace(/\s/g, '');
            const elementToMove = svg.select(`#${name}`).node();
            if (elementToMove) {
                count++;
                svg.node().appendChild(elementToMove);
            } else {
                console.warn(`Element with ID "${name}" not found.`);
            }
        })
    }

    /**
     * Maps values associated to each country in geoJson
     * and returns the updated geoJson
     * @param {dataset} dataset 
     * @param {geoJson} geoJson 
     * @returns {object} geoJson
     */
    function dataset_to_geoJson(dataset, geoJson) {
        for (let d = 0; d < dataset.length; d++) {
            for (let j = 0; j < geoJson.features.length; j++) {
                if (geoJson.features[j].properties.name === dataset[d].name) {
                    geoJson.features[j].properties.value = dataset[d].value;
                    geoJson.features[j].properties.year = dataset[d].year;
                    geoJson.features[j].properties.measure = dataset[d].measure;
                    geoJson.features[j].properties.tooltip = dataset[d].tooltip;
                }
            }
        }
        return geoJson;
    }

    /**
    * Gets or sets the dataset of the chart.
    * @function
    * @param {dataset} [_] - The dataset to set. If omitted, the current dataset is returned.
    * @returns {dataset|function} Returns the current dataset if no arguments are passed.
    * Otherwise, returns the chart function for method chaining.
    */
    chart.dataset = function (_) {
        if (!arguments.length) return dataset;
        dataset = _;
        return chart;
    }

    /**
    * Gets or sets the width of the chart.
    * @function
    * @param {number} [value] - The width in pixels. If no value is provided, returns the current width.
    * @returns {number|function} Returns the current width if no arguments are passed.
    * Otherwise, returns the chart function for method chaining.
    */
    chart.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    }

    /**
     * Gets or sets the height of the chart
     * @function
     * @param {number} [value] - The height in pixels. If no value is provided, returns the current height.
     * @returns {number|function} Returns the current height if no arguments are passed.
     * Otherwise, returns the chart function for method chaining.
     */
    chart.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    }

    /**
     * Gets or sets the padding of the chart
     * @function
     * @param {number} [value] - The padding in pixels. If no value is provided, returns the current padding.
     * @returns {number|function} Returns the current padding if no arguments are passed.
     * Otherwise, returns the chart function for method chaining.
     */
    chart.padding = function (_) {
        if (!arguments.length) return padding;
        padding = _;
        return chart;
    }

    return chart;
}

function lineChart() {

}

export { choropleth, lineChart };