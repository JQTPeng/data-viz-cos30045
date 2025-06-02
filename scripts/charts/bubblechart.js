import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function bubblechart() {
  let width = 900;
  let height = 600;
  let dataset = [];
  let year = null;
  let measure = "per 100,000 inhabitants";
  let sex = "Total";
  let svg = null;

  function truncateText(text, maxLength = 25) {
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  }

  function chart(selection) {
    // Setup containers
    svg = d3.select(selection).select("svg");
    if (svg.empty()) {
      svg = d3.select(selection)
        .append("svg")
        .attr("class", "chart-canvas")
        .attr("width", width)
        .attr("height", height);
    }

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

    if (zoomGroup.select("#background").empty()) {
      zoomGroup.append("rect")
        .attr("id", "background")
        .attr("width", "100vh") // TODO: change when bounded panning
        .attr("height", "100vh")
        .attr("fill", "white")
    }

    let bubbleGroup = zoomGroup.select("#bubbleArea");
    if (bubbleGroup.empty()) {
      bubbleGroup = zoomGroup
        .append("g")
        .attr("id", "bubbleArea");
    }

    if (!dataset || dataset.length === 0) {
      bubbleGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("No data available");
      return;
    }

    /**
     * Data Processing
     * Aggregate and sum values by Cause
     */
    const causeMap = new Map();
    dataset.forEach(d => {
      const cause = d.Cause || "Unknown";
      const val = +d.value || 0;
      causeMap.set(cause, (causeMap.get(cause) || 0) + val);
    });

    const Data = Array.from(causeMap, ([Cause, value]) => ({ Cause, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(Data, d => d.value)])
      .range([8, 40]);

    const colorRange = ["#003f5c", "#374c80", "#7a5195", "#bc5090", "#ef5675", "#ff764a", "#ffa600"];
    const colorScale = d3.scaleOrdinal().range(colorRange);

    Data.forEach(d => {
      d.r = radiusScale(d.value) * 1.75;
    });

    const simulation = d3.forceSimulation(Data)
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2.2).strength(0.5))
      .force("collide", d3.forceCollide(d => d.r + 4))
      .stop();

    for (let i = 0; i < 300; ++i) simulation.tick();

    /**
     * Bubbles Setup
     * Circles and Text
     */
    const tooltip = d3.select(selection)
      .append("div")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    bubbleGroup.selectAll("circle")
      .data(Data)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", (d, i) => colorScale(i))
      .attr("opacity", 0.75)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.Cause}</strong><br/>${d.value.toFixed(1)}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        d3.select(event.currentTarget).attr("stroke", "#000").attr("stroke-width", 2);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
        d3.select(event.currentTarget).attr("stroke", null);
      });

    bubbleGroup.selectAll("text.label")
      .data(Data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "black")
      .style("font-size", d => Math.max(7, d.r / 3) + "px")
      .text(d => truncateText(d.Cause));

    /**
     * Legend Setup
     * Circle Scale
     */
    const defs = svg.append("defs");
    defs.append("filter")
      .attr("id", "drop-shadow")
      .append("feDropShadow")
      .attr("dx", 1)
      .attr("dy", 2)
      .attr("stdDeviation", 2)
      .attr("flood-color", "black")
      .attr("flood-opacity", 0.4);

    const sizeLegend = [20, 50, 200];
    let totalWidth = 20; // initial padding
    sizeLegend.forEach(d => {
      totalWidth += radiusScale(d) * 2 + 15; // circle width + spacing
    });
    const boxHeight = 100;

    const legendGroup = svg.append("g")
      .attr("id", "legendGroup")
      .attr("transform", `translate(${10}, ${height - boxHeight - 5})`); // bottom right

    legendGroup.append("rect")
      .attr("width", totalWidth)
      .attr("height", boxHeight)
      .attr("fill", "white")
      .attr("filter", "url(#drop-shadow)");

    legendGroup.append("text") // Title
      .attr("x", 10)
      .attr("y", 15)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "gray")
      .text("Deaths per 100k");

    const itemsGroup = legendGroup.append("g") // Inner group for items
      .attr("transform", `translate(10, 57)`); // adjust Y position

    let xOffset = 6;
    sizeLegend.forEach(d => {
      const r = radiusScale(d);

      const itemGroup = itemsGroup.append("g")
        .attr("transform", `translate(${xOffset + r}, 0)`); // center circle

      itemGroup.append("circle") // Circle scale
        .attr("r", r * 1.75)
        .attr("cy", 0)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#444");

      itemGroup.append("text") // Circle Label
        .attr("text-anchor", "middle")
        .attr("y", "0.35em")
        .style("font-size", r < 10 ? "9px" : "10px")
        .style("fill", "#000")
        .style("pointer-events", "none")  // ensures text is not clickable
        .text(d.toLocaleString());

      xOffset += r * 2 + 12;
    });

    svg.call(zoom);
  }

  chart.width = function (value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function (value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.dataset = function (value) {
    if (!arguments.length) return dataset;
    dataset = value;
    return chart;
  };

  chart.year = function (value) {
    if (!arguments.length) return year;
    year = value;
    return chart;
  };

  chart.measure = function (value) {
    if (!arguments.length) return measure;
    measure = value;
    return chart;
  };

  chart.sex = function (value) {
    if (!arguments.length) return sex;
    sex = value;
    return chart;
  };

  return chart;
}
