// Setup svg using Bostock's margin convention

var margin = {top: 20, right: 160, bottom: 80, left: 250};

var width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var scatter = d3.select("body")
            .append('svg')
            .attr("id", "scatter")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv('time-vs-lines.csv',
             d => {
                d.milliseconds = +d.milliseconds;
                d.lines = +d.code_lines;
                return d;
            })
            .then( render_scatter );

function render_scatter(modules) {
    let x = d3.scaleLinear()
    /* .domain([0, d3.max(modules, d => d.lines)]) */
    .domain([0, 1000])
              .range([0, width]);
    console.log(x.domain());

    let y = d3.scaleLinear()
    /* .domain([0, d3.max(modules, d => d.milliseconds)]) */
    .domain([0, 10000]) // TODO zoom instead of hard-coded domain
              .range([height, 0]);

    let xAxis = d3.axisBottom()
                  .scale(x);

    let yAxis = d3.axisLeft()
                  .scale(y);

    scatter.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    scatter.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    let dots = scatter.selectAll("circle")
                  .data(modules).enter()
                  .append("circle")
                  .attr("cx", d => x(d.lines))
                  .attr("cy", d => y(d.milliseconds))
                  .attr("r", 3)
                  .attr("fill-opacity", 0.2);
    }
