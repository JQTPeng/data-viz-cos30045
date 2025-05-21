const mockdata = [
    { date: new Date("2015-01-01"), fruit: "apples", value: 3840 },
    { date: new Date("2015-01-01"), fruit: "bananas", value: 1920 },
    { date: new Date("2015-01-01"), fruit: "cherries", value: 960 },
    { date: new Date("2015-01-01"), fruit: "durians", value: 400 },
    { date: new Date("2015-02-01"), fruit: "apples", value: 1600 },
    { date: new Date("2015-02-01"), fruit: "bananas", value: 1440 },
    { date: new Date("2015-02-01"), fruit: "cherries", value: 960 },
    { date: new Date("2015-02-01"), fruit: "durians", value: 400 },
    { date: new Date("2015-03-01"), fruit: "apples", value: 640 },
    { date: new Date("2015-03-01"), fruit: "bananas", value: 960 },
    { date: new Date("2015-03-01"), fruit: "cherries", value: 640 },
    { date: new Date("2015-03-01"), fruit: "durians", value: 400 },
    { date: new Date("2015-04-01"), fruit: "apples", value: 320 },
    { date: new Date("2015-04-01"), fruit: "bananas", value: 480 },
    { date: new Date("2015-04-01"), fruit: "cherries", value: 640 },
    { date: new Date("2015-04-01"), fruit: "durians", value: 400 }
];

function stackedArea() {
    const color = d3.scaleOrdinal();
    const colorRange = ["#003f5c", "#374c80", "#7a5195", "#bc5090", "#ef5675", "#ff764a", "#ffa600"];
    const xScale = d3.scalePoint();
    const yScale = d3.scaleLinear();

    let width = 1000;
    let height = 500;
    let margin = { top: 50, left: 50, bottom: 50, right: 150 }

    // Data
    let data = [];
    let categories = [];
    let seriesIndex = [];
    let series = [];

    // Axis
    let xDomain = [];
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);

    function chart(selection) {
        // Setup SVG
        let svg = d3.select(selection).select("svg");

        if (svg.empty()) {
            svg = d3.select(selection)
                .append("svg")
                .attr("class", "chart-canvas")
                .attr("width", width)
                .attr("height", height);
        }

        // Use mockdata if validation failed
        if (!validate()) {
            console.warn("stackedArea() - Using mock data");
            data = mockdata;
            categories = d3.union(data.map(d => d.fruit));
            seriesIndex = d3.index(data, d => d.date, d => d.fruit)
            xDomain = Array.from(new Set(data.map(d => d.date))).sort((a, b) => a - b);
            xAxis.tickFormat(d3.timeFormat("%Y-%m-%d"));
        }

        // Setup
        series = d3.stack()
            .keys(categories)
            .value(([, group], key) => {
                const item = group.get(key);
                return item ? item.value : 0;
            })
            (seriesIndex)

        xScale
            .domain(xDomain)
            .range([margin.left, width - margin.right]); // leave space for legend

        yScale
            .domain([0, d3.max(series.flat(2)) * 1.2])
            .range([height - margin.bottom, margin.top])

        color
            .domain(categories)
            .range(colorRange);

        svg.call(drawContent);
        svg.call(drawAxis);

        let legend = d3.select("#legend-group");
        if (legend.empty()) {
            legend = svg.append("g").attr("id", "legend-group")
        }

        const legend_margin = { top: 200, left: 20 }; // TODO: make this customizable
        const legend_rect_size = 15; // TODO: make this customizable

        legend
            .selectAll("rect")
            .data(colorRange)
            .join("rect")
            .attr("x", width - margin.right + legend_margin.left)
            .attr("y", (d, i) => margin.top + legend_margin.top - i * 20)
            .attr("width", legend_rect_size)
            .attr("height", legend_rect_size)
            .style("fill", d => d)
            .style("fill-opacity", 0.8)
            .attr("stroke", d => d);

        legend
            .selectAll("text")
            .data(categories)
            .join("text")
            .attr("x", width - margin.right + legend_margin.left * 2)
            .attr("y", (d, i) => margin.top + legend_margin.top - i * 20 + 12)
            .text(d => d)
            .style("font-size", "0.8em")
            .style("font-weight", "600")
            .style("fill", "grey")
    }

    function drawContent(selection) {
        /**
         * Draw the areas 
         */
        const area = d3.area()
            .x((d, i) => xScale(d.data[0]))
            .y0((d) => yScale(d[0]))
            .y1((d) => yScale(d[1]))

        const areaFromBottom = d3.area() // animation purpose
            .x((d, i) => xScale(d.data[0]))
            .y0((d) => yScale(0))
            .y1((d) => yScale(0))

        selection.selectAll(".mylayers")
            .data(series)
            .join(
                enter => enter
                    .append("path")
                    .attr("class", "mylayers")
                    .attr("d", areaFromBottom)
                    .style("fill", (d, i) => color(d.key))
                    .style("fill-opacity", 0.8)
                    .transition()
                    .duration(1000)
                    .delay(300)
                    .attr("d", area),
                update => update
                    .attr("d", areaFromBottom)
                    .transition()
                    .duration(1000)
                    .delay(300)
                    .attr("d", area),
                exit => exit.remove()
            )

        /**
         * Draw the lines that will provide a
         * seperation for each area
         */
        const line = d3.line()
            .x((d) => xScale(d.data[0]))
            .y((d) => d[1] == 0 ? 0 : yScale(d[1]));

        const lineFromBottom = d3.line() // animation purpose
            .x((d) => xScale(d.data[0]))
            .y((d) => yScale(0));

        selection.selectAll(".top-line")
            .data(series)
            .join("path")
            .attr("class", "top-line")
            .attr("fill", "none")
            .attr("stroke", (d, i) => color(d.key))
            .attr("stroke-width", 1)
            .attr("d", lineFromBottom)
            .transition()
            .duration(1000)
            .delay(300)
            .attr("d", line);

        /**
         * Add hover points
         */
        let hoverGroup = selection.select(".hover-group");
        if (hoverGroup.empty()) {
            hoverGroup = selection.append("g").attr("class", "hover-group");
        }

        let highlightCircle = selection.select(".hover-highlight");
        if (highlightCircle.empty()) {
            highlightCircle = selection.append("circle")
                .attr("class", "hover-highlight")
                .attr("fill", "white")
                .attr("r", 3)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .style("display", "none");
        }

        hoverGroup
            .selectAll(".hoverPoint")
            .data(series.flatMap(s => s
                .filter(d => d[0] !== d[1]) // only keep valid values
                .map(d => ({ ...d, key: s.key }))))
            .join("circle")
            .attr("class", "hoverPoint")
            .attr("cx", (d, i) => xScale(d.data[0]))
            .attr("cy", (d) => yScale(0))
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .delay(300)
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 11)

        hoverGroup.selectAll(".hoverPoint")
            .on("mouseover.tooltip", (event, series) => {
                const dataMap = series.data[1];
                const original = dataMap.get(series.key);
                setToolTip_relative_client(original.tooltip, event.pageX, event.pageY, 20);
                highlightCircle
                    .attr("cx", xScale(series.data[0]))
                    .attr("cy", yScale(series[1]))
                    .style("display", "block");
            })
            .on("mouseout.reset", (event, data) => {
                d3.select("#tooltip").remove();
                d3.select(".hover-highlight")
                    .style("display", "none");
            })

        /**
         * Draw legends
         */
    }

    function drawAxis(selection) {
        if (!d3.select(".x-axis").empty()) return;

        yAxis.ticks(10)

        // axis
        selection.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
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

        selection.select(".y-axis")
            .selectAll(".tick text")

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

    function validate() {
        // TODO: Validate variable structure and properties
        if (data.length == 0 || xDomain.length == 0 || categories.length == 0 || seriesIndex.length == 0) {
            console.warn(`
                validate() - Existence:
                data -> ${data.length == 0 ? "EMPTY" : "SET"}
                xDomain -> ${xDomain.length == 0 ? "EMPTY" : "SET"}
                categories -> ${categories.length == 0 ? "EMPTY" : "SET"}
                seriesIndex -> ${seriesIndex.length == 0 ? "EMPTY" : "SET"}
            `.trim())
            return false;
        }
        return true;
    }

    chart.formatDate = function (date) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
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

    chart.data = function (_) {
        if (!arguments.length) return data;
        data = _;
        return chart;
    }

    chart.categories = function (_) {
        if (!arguments.length) return categories;
        categories = _;
        return chart;
    }

    chart.seriesIndex = function (_) {
        if (!arguments.length) return seriesIndex;
        seriesIndex = _;
        return chart;
    }

    chart.xDomain = function (_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return chart;
    }

    chart.xAxis = function (_) {
        if (!arguments.length) return xAxis;
        xAxis = _;
        return chart;
    }

    chart.yAxis = function (_) {
        if (!arguments.length) return yAxis;
        yAxis = _;
        return chart;
    }

    return chart;
}

export { stackedArea };
