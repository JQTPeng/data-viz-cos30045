const raw1 = [
    { year: 2018, value: 10, category: "A" },
    { year: 2019, value: 15, category: "A" },
    { year: 2020, value: 12, category: "A" },
    { year: 2021, value: 25, category: "A" },
    { year: 2022, value: 22, category: "A" },
    { year: 2023, value: 30, category: "A" },
]

const raw2 = [
    { year: 2023, value: 5, category: "B" },
    { year: 2022, value: 8, category: "B" },
    { year: 2021, value: 7, category: "B" },
    { year: 2020, value: 18, category: "B" },
    { year: 2019, value: 15, category: "B" },
    { year: 2018, value: 20, category: "B" }
]

const mock_dataset = {
    first: raw1,
    second: raw2
}

function linechart() {
    /**
     * Orientation Variables
     */
    let margin = { top: 50, left: 50, bottom: 50, right: 150 }
    let width = 800;
    let height = 700;

    /**
     * d3 Variables
     */
    let xScale = d3.scalePoint();
    let yScale = d3.scaleLinear();
    let colorScale = d3.scaleOrdinal();

    /**
    * Array of dataset groups, each associated with a category.
    * Each group contains a category label and an array of data objects.
    *
    * @typedef {Object} DataPoint
    * @property {number} value - The numeric value associated with this data point.
    * @property {Date|string|number} [date] - Optional timestamp or key, depending on your data structure.
    * // Add other fields as needed from your raw1/raw2 structure.
    *
    * @typedef {Object} DatasetGroup
    * @property {string} category - Identifier for the dataset group (e.g., "A", "B").
    * @property {DataPoint[]} values - Array of data objects for this group.
    *
    * @type {DatasetGroup[]}
    */
    let datasets = [
        { category: "A", values: raw1 },
        { category: "B", values: raw2 }
    ];

    /**
     * Render Chart
     * ------------
     * @description Render chart on the selected HTML wrapper; 
     * Main function to call for creating and update charts.
     * @param {d3.selection} selection 
     */
    function chart(selection) {
        console.log(datasets[0].values);
        let svg = d3.select(selection).select("svg");
        if (svg.empty()) {
            svg = d3.select(selection)
                .append("svg")
                .attr("class", "chart-canvas")
                .attr("width", width)
                .attr("height", height)
        }

        svg.call(renderMockChart);
    }

    function renderMockChart(selection) {
        const allValues = datasets.flatMap(group => group.values.map(d => d.value));
        const allYears = datasets.flatMap(group => group.values.map(d => d.year)); // TODO: Assumption that xDomain is years 
        let xDomain = allYears.sort((a, b) => a - b);
        let yDomain = [0, d3.max(allValues) * 1.2];

        let colorDomain = ["A", "B"];
        let colorRange = ["#d66a6a", "#66bb6a"];

        colorScale
            .domain(colorDomain)
            .range(colorRange);
        xScale
            .domain(xDomain)
            .range([margin.left, width - margin.right])
        yScale
            .domain(yDomain) // 1.2 to give some top padding on the yScale
            .range([height - margin.bottom, margin.top])

        /**
         * Draw Line
         */

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))

        selection.selectAll(".lines")
            .data(datasets)
            .join("path")
            .attr("class", "lines")
            .attr("d", d => line(d.values))
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.category))
            .attr("stroke-width", 2);

        /**
         * Draw Axis
         */
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale).ticks(10);

        selection.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(xAxis);

        selection.select(".x-axis")
            .selectAll(".tick text")
            .attr("y", 15);

        selection.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis)
            .filter(d => d === yScale.domain()[1])
            .select("line")
            .style("stroke", "none");

        selection.selectAll(".tick text")
            .style("fill", "grey")
            .style("font-size", "12px");

        selection.selectAll(".tick line")
            .style("stroke", "grey")
            .style("stroke-width", 0.7)
            .style("stroke-linecap", "round")
            .style("stroke-dasharray", "3,3");

        selection
            .selectAll(".domain")
            .attr("stroke", "grey")
            .style("stroke-width", 0.7)

        /**
         * Draw circle points
         */
        let circle_points = selection.select(".line-points");
        if (circle_points.empty()) {
            circle_points = selection.append("g")
                .attr("class", "line-points");
        }

        selection.selectAll(".line-point")
            .data(datasets.flatMap(d => d.values.map(v => ({ ...v, category: d.category }))))
            .join("circle")
            .attr("class", "line-point")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.value))
            .attr("r", 4)
            .attr("fill", d => colorScale(d.category))
            .on("mouseover.tooltip", (event, data) => {
                data.name = "Mortality";
                setToolTip_relative_client(data.tooltip, event.pageX, event.pageY, 20);
                d3.select(event.target)
                    .attr("r", 5);
            })
            .on("mouseout.reset", (event, data) => {
                d3.select("#tooltip").remove();
                d3.select(event.target)
                    .attr("r", 4);
            })

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

    chart.xScale = function (_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return chart;
    }

    chart.yScale = function (_) {
        if (!arguments.length) return yScale;
        yScale = _;
        return chart;
    }

    chart.colorScale = function (_) {
        if (!arguments.length) return colorDomain;
        colorDomain = _;
        return chart;
    }

    chart.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    }

    chart.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    }

    chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    }

    chart.datasets = function (_) {
        if (!arguments.length) return datasets;
        datasets = _;
        return chart;
    }

    return chart;
}

export { linechart };