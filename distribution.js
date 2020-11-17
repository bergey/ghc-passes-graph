var distribution = d3.select("body")
                     .append('svg')
                     .attr('id', 'distribution')
                     .attr("width", width + margin.left + margin.right)
                     .attr("height", height + margin.top + margin.bottom)
                     .append("g")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

time_vs_lines.then(render_distribution);

function render_distribution(modules) {
    // separate quantile from x so x-axis gets 0-1 tick marks
    let quantile = d3.scaleLinear()
                     .domain([0, modules.length])
                     .range([0, 1]);

    let x = d3.scaleLinear()
              .range([width/12, width*11/12]);

    let y = d3.scaleLinear()
              .range([height, 0])
    /* .domain([modules[0].ms_per_line, modules[modules.length - 1].ms_per_line]); */
              .domain([0, 50])

    let xAxis = d3.axisBottom().scale(x);

    let yAxis = d3.axisLeft().scale(y);

    distribution.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    distribution.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    let dots = distribution.selectAll("circle")
                      .data(modules).enter()
                      .append("circle")
                      .attr("cx", (d, i) => x(quantile(i)))
                      .attr("cy", d => y(d.ms_per_line))
                      .attr("r", 1)
                      .attr("fill-opacity", 0.5);

}
