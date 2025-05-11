// TODO: Add density legend scale
// TODO: Title & Caption, etc options

export function choropleth() {
    const projection = d3.geoMercator();
    const path = d3.geoPath()
    const color = d3.scaleQuantize().range(['#f1eef6', '#d7b5d8', '#df65b0', '#dd1c77', '#980043']);
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
    * Sets event handlers for the selection
    * @param {d3.Selection} selection - A D3 selection of SVG elements.
    */
    function setEvents(selection) {
        selection
            .on("mouseover.tooltip", (event, data) => {
                if (data.properties.value === undefined) return;

                const xClient = event.clientX + 20;
                const yClient = event.clientY + 20;
                const properties = data.properties;

                // console.log(properties);

                d3.select("body")
                    .append("div")
                    .attr("id", "tooltip")
                    .style("width", "max-content")
                    .style("height", "max-content")
                    .html(properties.tooltip)
                    .transition()
                    .duration(100)
                    .delay(100)
                    .style("left", xClient + "px")
                    .style("top", yClient + "px")
                    .style("position", "absolute")
                    .style("background", "white")
                    .style("border-radius", "10px")
                    .style("border", "1px solid grey")
                    .style("padding", "10px")
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
     * Crucial function to make sure the update transition is smooth
     * @description Resets the order made from calling raise() in Event mouseover.highlight.
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