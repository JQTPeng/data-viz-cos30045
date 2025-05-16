// TODO: Mock data
// TODO: colorConfig requires domain. Requires initial data
// TODO: dataset property name validation (e.g., "Value" vs "value")
// TODO: change size of elements (e.g., text) based on svg size set

let draggable = false;

/**
 * Choropleth Chart
 * -------------------------
 * @property width, height, padding, dataset, colorConfig
 * @limitations
 * - Fixed to classed legend (or binned legend)
 * - Legend scale is not dynamically sized
 * @feature
 * - Method chaining to customize properties
 * - Can include custom tooltip HTML component
 * - Can iclude custom color configuration
 * - Pass new data to choropleth(data) for easy updates
 * @returns chart
 */
function choropleth() {
    const projection = d3.geoMercator();
    const path = d3.geoPath()
    let svg = null;
    let width = 500;
    let height = 500;
    let padding = 20;
    let projectionScale = 100;

    /**
     * @type {Object}
     * @description A data holder for TopJSON or GeoJSON geographical data files. 
    */
    let geoJson = {};

    /**
     * @type {Function} d3 scale function
     * @description to share between functions
     */
    let colorScale = null;

    /**
     * @type {{highlight: string, domain: number[], range: Array, scale: Function}}
     * @description for custom configuration, otherwise use default
     */
    let colorConfig = {
        no_data: "#999",
        border: "white",
        highlightBorder: "black",
        domain: [],
        range: ["#deebf7", "#9ecae1", "#6baed6", "#3182bd", "#08519c"],
        scale: d3.scaleThreshold()
    };

    /** e
     * @type {Array<{name: string, year: number, value: number, measure: string, tooltip: string}>}
     * @description An array of the specified object scheme
     */
    let dataset = [];

    /**
    * Render chart on HTML selection
    * ------------------------------
    * @description This function will append an 
    * SVG element to the selected DOM element 
    * and draw the map based on data.
    * Use this function for enter, updates and exits.
    * @param {HTMLElement} selection - The D3 selection/HTML (e.g., a div or another DOM element) where the chart will be rendered.
    */
    async function chart(selection) {
        svg = d3.select(selection).select("svg");
        if (svg.empty()) {
            svg = d3.select(selection).append("svg").attr("width", width).attr("height", height);
        }

        geoJson = await d3.json("./resources/json/countries.json").then((json) => dataset_to_geoJson(dataset, json));
        projection.scale(projectionScale).translate([width / 2, height / 1.5]);
        path.projection(projection);
        colorScale = colorConfig.scale.domain(colorConfig.domain).range(colorConfig.range);

        /**
         * setup base layer/group that will be used 
         * to zoom and draw the map. Legend scales and other 
         * components are drawn on the layer before unless decided
         */

        let zoomGroup = svg.select("#zoomGroup");
        if (zoomGroup.empty()) {
            zoomGroup = svg.append("g")
                .attr("id", "zoomGroup")
                .classed("grab", false)
                .classed("grabbing", false);
        }

        /**
         * setup zoom settings and 
         * cursor interactions for user feedback
         */
        const zoom = d3.zoom()
            .scaleExtent([1, 5]) // TODO: need to limit the unbounded panning
            .on("end", () => {
                zoomGroup
                    .classed("grab", true)
                    .classed("grabbing", false)
            })
            .on("zoom", (event) => {
                zoomGroup.attr("transform", event.transform);
            });

        zoomGroup
            .on("mousedown", () => {
                if (!draggable) return;
                console.log('down')
                zoomGroup
                    .classed("grab", false)
                    .classed("grabbing", true)
            })
            .on("mouseenter", () => {
                draggable = true;
                zoomGroup
                    .classed("grab", true)
                    .classed("grabbing", false)
            })
            .on("mouseleave", () => {
                draggable = false;
                zoomGroup
                    .classed("grab", false)
                    .classed("grabbing", false)
            })


        /**
         * Render the country paths
         * and setup the behaviour for enter, 
         * update and exit
         */
        if (zoomGroup.select("#background").empty()) {
            zoomGroup.append("rect")
                .attr("id", "background")
                .attr("width", "100vh") // TODO: change when bounded panning
                .attr("height", "100vh")
                .attr("fill", "white")
        }

        let mapGroup = zoomGroup.select("#map");
        if (mapGroup.empty()) {
            mapGroup = zoomGroup
                .append("g")
                .attr("id", "map");
        }

        mapGroup
            .selectAll("path")
            .data(geoJson.features)
            .join(
                enter => enter
                    .append("path")
                    .attr("id", d => d.properties.name.trim().replace(/\s/g, ''))
                    .attr("d", path)
                    .call(setStyles)
                    .call(setCountryEvents)
                    .style("opacity", "0")
                    .transition()
                    .duration(1000)
                    .delay(50)
                    .style("opacity", "1"),
                update => update
                    .attr("d", path)
                    .call(setCountryEvents)
                    .transition()
                    .duration(300)
                    .call(setStyles),
                exit => exit.remove()
            );

        svg.call(zoom);
        setLegendScale(); // NOT UPDATED FOR COLOR (e.g., colorConfig change)
    }

    /**
    * Sets event handlers for the selection
    * -------------------------------------
    * @param {d3.Selection} selection - A D3 selection of SVG elements.
    */
    function setCountryEvents(selection) {
        selection
            .on("mouseover.tooltip", (event, data) => {
                if (data.properties.value === undefined) return;
                setToolTip_relative_client(data.properties.tooltip, event.clientX, event.clientY, 20);
            })
            .on("mouseover.highlight", (event, data) => {
                if (data.properties.value === undefined) return;
                d3.select(event.target)
                    .raise()
                    .transition()
                    .duration(50)
                    .delay(20)
                    .style("stroke", colorConfig.highlightBorder)
                    .style("stroke-width", 1.5);
            })
            .on("mouseout.reset", (event, data) => {
                if (data.properties.value === undefined) return;
                d3.select("#tooltip").remove();
                resetPathOrder(); // TODO: called once before every update
                d3.select(event.target)
                    .transition()
                    .duration(50)
                    .delay(20)
                    .style("stroke", colorConfig.border)
                    .style("stroke-width", 0.5)
            })
    }

    /**
    * Sets fill and stroke styles countries.
    * --------------------------------------
    * @param {d3.Selection} selection - A D3 selection of SVG elements.
    */
    function setStyles(selection) {
        selection
            .style("fill", (d) => {
                let value = d.properties.value;
                if (value) { return colorScale(value); }
                return colorConfig.no_data;
            })
            .style("stroke", colorConfig.border)
            .style("stroke-width", 0.5)
    }

    /**
     * Renders the tooltip relative to given position
     * ----------------------------------------------
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
     * Render the legend scale
     */
    function setLegendScale() {
        let defs = svg.select("#myDefs");
        if (defs.empty()) { // render once
            defs = svg.append("defs")
                .attr("id", "myDefs");

            defs.append("filter")
                .attr("id", "drop-shadow")
                .append("feDropShadow")
                .attr("dx", 0.8)            // shadow x offset
                .attr("dy", 2)              // shadow y offset
                .attr("stdDeviation", 2)    // blur radius
                .attr("flood-color", "black")
                .attr("flood-opacity", 0.5);
        }

        /**
         * Render the legend scale container, colors and texts
         * NOTE: Fixed to Classed Legend (or Binned Legend)
         */
        const threshold_height = 25;
        const threshold_width = 20;
        const colorRange = [...colorConfig.range];
        const colorTexts = [...colorConfig.domain];
        
        let start = 0; // setup the threshold texts
        for (let i = 0; i < colorTexts.length; i++) {
            let end = colorTexts[i];
            colorTexts[i] = `${start} - ${end}`;
            start = end + 1;
        }
        
        colorRange.unshift(colorConfig.no_data);
        colorTexts.unshift("No data");
        const legend_padding_top = 20;
        const legend_height = colorRange.length * threshold_height + padding * 2 + legend_padding_top;
        const legend_width = threshold_width + 150; // hardcoded

        /**
         * Render legend group
         * -------------------
         * <g id="legendGroup">
         *      <rect/>
         *      <g id="thresholdColors"></g>
         *      <g id="thresholdTexts"></g>
         * </g>
         */
        let legend_group = svg.select("#legendGroup");
        if (legend_group.empty()) { // render once
            legend_group = svg
                .append("g")
                .attr("id", "legendGroup");

            legend_group // container box
                .append("rect")
                .attr("x", padding)
                .attr("y", height - legend_height - padding)
                .attr("height", legend_height)
                .attr("width", legend_width)
                .attr("fill", "white")
                .attr("filter", "url(#drop-shadow)");

            const legend_unit = legend_group // unit measure
                .append("g")
                .attr("id", "legend_units")
                .append("text")
                .attr("x", padding * 2)
                .attr("y", height - threshold_height * colorRange.length - padding * 2 - legend_padding_top + 5)
                .style("font-size", "0.8em")
                .style("font-weight", "bold")
                .style("fill", "grey")
                .text("cases / 10");

            legend_unit
                .append("tspan")
                .attr("dy", -7)
                .style("font-size", "0.6em")
                .style("fill", "grey")
                .text("5");

            legend_unit
                .append("tspan")
                .attr("dy", "7")
                .style("font-size", "1em")
                .style("fill", "grey")
                .text(" inhabitants")

            legend_group // colors
                .append("g")
                .attr("id", "thresholdColors")

            legend_group // threshold texts
                .append("g")
                .attr("id", "thresholdTexts")
        }

        let legend_colors = legend_group.select("#thresholdColors");
        let legend_texts = legend_group.select("#thresholdTexts");

        legend_colors // thresholds colors
            .selectAll("rect")
            .data(colorRange)
            .join("rect")
            .attr("width", threshold_width)
            .attr("height", threshold_height)
            .attr("fill", (d) => d)
            .attr("x", (d, i) => padding * 2)
            .attr("y", (d, i) => height - padding * 2 - (colorRange.length - i) * threshold_height + 2);

        legend_texts // thresholds texts
            .selectAll("text")
            .data(colorTexts)
            .join("text")
            .attr("x", (d, i) => padding * 3 + 5) // add n to adjust position slightly to right
            .attr("y", (d, i) => height - padding * 2 - (colorTexts.length - i) * threshold_height + 20) // hardcoded
            .style("font-size", "0.8em")
            .style("font-weight", "600")
            .style("fill", "grey")
            .text(d => d);

        console.log("legend");
    }

    /**
     * Crucial function to make sure the update transition is smooth
     * -------------------------------------------------------------
     * @description Resets the order of path elements in the parent node
     */
    function resetPathOrder() {
        let count = 0;
        geoJson.features.forEach(data => {
            const name = data.properties.name.trim().replace(/\s/g, '');
            const elementToMove = svg.select(`#${name}`).node();
            if (elementToMove) {
                count++;
                svg.select("#map").node().appendChild(elementToMove);
            } else {
                console.warn(`Element with ID "${name}" not found.`);
            }
        })
    }

    /**
     * Mapping function to geoJson
     * ---------------------------
     * @description Maps values associated to each country in geoJson
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
     * Gets or sets colorConfig 
     * -----------------------------------
     * @description WARNING: Must include all properties when setting. Gets or sets custom coloring scale. 
     * @param {colorConfig} [value] The config to set. If omitted, use default scaling.
     * @returns {colorConfig|function} Returns current colorConfig if no arguments are passed.
     * Otherwise, returns the chart function for method chaining
     */
    chart.colorConfig = function (_) {
        if (!arguments.length) return colorConfig;
        colorConfig = _;
        return chart;
    }

    /**
    * Gets or sets the dataset of the chart.
    * -----------------------------------
    * @function
    * @param {dataset} [value] - The dataset to set. If omitted, the current dataset is returned.
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
    * -----------------------------------
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
     * -----------------------------------
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
     * -----------------------------------
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

export { choropleth };