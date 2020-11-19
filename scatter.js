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

let time_vs_lines = d3.csv('time-vs-lines.csv',
             d => {
                d.milliseconds = +d.milliseconds;
                d.lines = +d.code_lines;
                d.ms_per_line = d.milliseconds / d.lines;
                return d;
    })
    .then(modules => modules.sort((a, b) => d3.ascending(a.ms_per_line, b.ms_per_line)));

time_vs_lines.then( render_scatter );

function render_scatter(modules) {
    let x = d3.scaleLinear()
    /* .domain([0, d3.max(modules, d => d.lines)]) */
    .domain([0, 1000])
              .range([0, width]);
    console.log(x.domain());

    let y = d3.scaleLinear()
    /* .domain([0, d3.max(modules, d => d.milliseconds)]) */
              .domain([0, 40]) // TODO zoom instead of hard-coded domain
              .range([height, 0]);

    let xAxis = d3.axisBottom()
                  .scale(x);

    let yAxis = d3.axisLeft()
                  .scale(y);

    let yg = scatter.append("g")
    .attr("class", "y axis");
    yg.call(yAxis);
    yg.append('text')
      .text('Compile Time [s]')
      .attr('font-size', 14)
      .attr("transform",'rotate(-90)')
      .attr('x', height / -2)
      .attr('fill', 'black')
      .attr('y', -50);


    let xg = scatter.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")");

    xg.call(xAxis);
    xg.append('text')
      .text('Lines of Code')
      .attr('font-size', 14)
      .attr('x', width / 2)
      .attr('fill', 'black')
      .attr('y', margin.bottom/2);

    let dots = scatter.append('g').attr('class', 'data').selectAll("circle")
                  .data(modules).enter()
                  .append("circle")
                  .attr("cx", d => x(d.lines))
                  .attr("cy", d => y(d.ms_per_line))
                  .attr("r", 2)
                  .attr("fill-opacity", 0.2);

    scatter.append('text').text('Compile Time vs Code Size')
           .attr('font-size', 24).attr('fill', 'black')
           .attr('x', 0.75*width).attr('y', y(35));
    }
