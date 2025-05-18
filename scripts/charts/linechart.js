export function linechart() {
    let width = 800;
    let height = 700;
    let padding = {

    }
    let margin = {

    }
    function chart(selection) {
        let svg = d3.select(selection).select("svg");
        if (svg.empty()) {
            svg = d3.select(selection)
                .append("svg") 
                .attr("class", "chart-canvas")
                .attr("width", width)
                .attr("height", height)
        }
    }
}