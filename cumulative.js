var cumulative = d3.select("body")
                     .append('svg')
                     .attr('id', 'cumulative')
                     .attr("width", width + margin.left + margin.right)
                     .attr("height", height + margin.top + margin.bottom)
                     .append("g")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

time_vs_lines.then(modules => {
    let total_time = 0;
    let times = [];
    modules.forEach(m => {
        total_time += m.milliseconds/1000;
        times.push(total_time);
    });
    render_cumulative(times);
});

function render_cumulative(times) {
    console.log(times);
    // separate quantile from x so x-axis gets 0-1 tick marks
    let quantile = d3.scaleLinear()
                     .domain([0, times.length])
                     .range([0, 1]);

    let x = d3.scaleLinear()
              .range([width/24, width*23/24]);
    console.log(x.range());

    let y = d3.scaleLinear()
              .range([height, 0])
              .domain(d3.extent(times));
    console.log(y.domain());

    let xAxis = d3.axisBottom().scale(x);

    let yAxis = d3.axisLeft().scale(y);

    cumulative.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    cumulative.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    let dots = cumulative.selectAll("circle")
                      .data(times).enter()
                      .append("circle")
                      .attr("cx", (d, i) => x(quantile(i)))
                      .attr("cy", d => y(d))
                      .attr("r", 1);

}
