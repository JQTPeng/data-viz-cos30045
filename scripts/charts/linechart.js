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
    const xScale = d3.scalePoint();
    const yScale = d3.scaleLinear();

    let title = "My Stacked Area Chart";
    let width = 1000;
    let height = 500;
    let padding = 50;

    // Data
    let data = [];
    let categories = [];
    let seriesIndex = [];

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

        const series = d3.stack()
            .keys(categories)
            .value(([, group], key) => {
                const item = group.get(key);
                return item ? item.value : 0;
            })
            (seriesIndex)

        xScale
            .domain(xDomain)
            .range([padding, width - padding * 3]); // leave space for legend

        yScale
            .domain([0, d3.max(series.flat(2))])
            .range([height - padding, padding * 1.8])

        color
            .domain(categories)
            .range(d3.schemePaired); // https://d3js.org/d3-scale-chromatic/categorical

        svg.selectAll("mylayers")
            .data(series)
            .join("path")
            .style("fill", (d, i) => color(d.key))
            .style("fill-opacity", 0.6)
            .attr("d", d3.area()
                .x((d, i) => xScale(d.data[0]))
                .y0((d) => yScale(d[0]))
                .y1((d) => yScale(d[1]))
            );

        svg.call(drawAxis);
    }

    function drawAxis(selection) {
        yAxis
            .ticks(5)
            .tickSize(-(width - padding * 4))

        // axis
        selection.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - padding})`)
            .call(xAxis);

        selection.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${padding},0)`)
            .call(yAxis)
            .filter(d => {
                d === yScale.domain()[1]
                console.log(yScale.domain()[1])
            })
            .select("line")
            .style("stroke", "none");;

        selection.selectAll(".tick text")
            .style("fill", "grey")
            .style("font-size", "12px");

        selection.selectAll(".tick line")
            .style("stroke", "grey")
            .style("stroke-width", 0.7)
            .style("stroke-linecap", "round")
            .style("stroke-dasharray", "3,3");

        selection.select(".y-axis").select(".domain").remove();
    }

    function drawLegend(selection) {

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

    chart.padding = function (_) {
        if (!arguments.length) return padding;
        padding = _;
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
