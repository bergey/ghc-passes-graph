// Setup svg using Bostock's margin convention

var margin = {top: 20, right: 160, bottom: 250, left: 80};

var width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var svg = d3.select("body")
            .append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/* Data in strings like it would be if imported from a csv */

var data = [
    { year: "2006", redDelicious: "10", mcintosh: "15", oranges: "9", pears: "6" },
    { year: "2007", redDelicious: "12", mcintosh: "18", oranges: "9", pears: "4" },
    { year: "2008", redDelicious: "05", mcintosh: "20", oranges: "8", pears: "2" },
    { year: "2009", redDelicious: "01", mcintosh: "15", oranges: "5", pears: "4" },
    { year: "2010", redDelicious: "02", mcintosh: "10", oranges: "4", pears: "2" },
    { year: "2011", redDelicious: "03", mcintosh: "12", oranges: "6", pears: "3" },
    { year: "2012", redDelicious: "04", mcintosh: "15", oranges: "8", pears: "1" },
    { year: "2013", redDelicious: "06", mcintosh: "11", oranges: "9", pears: "4" },
    { year: "2014", redDelicious: "10", mcintosh: "13", oranges: "9", pears: "5" },
    { year: "2015", redDelicious: "16", mcintosh: "19", oranges: "6", pears: "9" },
    { year: "2016", redDelicious: "19", mcintosh: "17", oranges: "5", pears: "7" },
];

var parse = d3.timeParse("%Y");


// Transpose the data into layers
let stack = d3.stack()
                .keys(["redDelicious", "mcintosh", "oranges", "pears"]);
let dataset = stack(data)
    .map(series =>
        series.map( d => ({
            x: d.data.year,
            y0: d[0],
            y: d[1]
    })));

var csv = d3.csv('ghc-passes-short.csv',
             d => {
                d.milliseconds = +d.milliseconds;
                d.megabytes = +d.megabytes;
                return d;
            })
            .then( pivotAndStack )
            .then( render );

function pivotAndStack( csvData ) {
    let pivoted = new Map();
    let phases = [ "Parser", "Desugar", "Simplifier", "CoreTidy", "CorePrep", "CodeGen", "Simplify" ];

    for (const row of csvData) {
        let name;
        if (row.module === 'Main') {
            name = row.package + ':Main';
        } else {
            name = row.module;
        }

        if (pivoted.has(name)) {
            let module = pivoted.get(name);
            module[row.phase] = row.milliseconds;
        } else {
            let module = {};
            module.name = name;
            for (const p of phases) { module[p] = 0; }
            module[row.phase] = row.milliseconds;
            pivoted.set(name, module);
        }

    };

    // console.log(pivoted);

    let slowest = Array.from(pivoted.values())
                       .map( d => {
                           d.total = 0;
                           for (const p of phases) { d.total += d[p]; }
                           return d;
                       })
                       .sort( (a, b) => b.total - a.total ) // descending
                       .slice(0, 500);

    let stack = d3.stack() .keys(phases);
    let dataset = stack(slowest)
        .map( series => series.map( d => ({
            x: d.data.name,
            y0: d[0],
            y: d[1],
            data: d.data
        })));
    console.log(dataset);
    return [phases, dataset];
}

function render([phases, dataset]) {

    // Set x, y and colors
    var x = d3.scaleBand()
            .domain(dataset[0].map(function(d) { return d.x; }))
            .padding(0.1)
            .rangeRound([10, width-10]);

    var y = d3.scaleLinear()
            .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
            .range([height, 0]);

    let colors = d3.scaleOrdinal()
                   .domain(phases)
                   .range(d3.schemeAccent);

    // Define and draw axes
    var yAxis = d3.axisLeft()
                .scale(y)
                .ticks(5)
                .tickSize(-width, 0, 0)
                .tickFormat( function(d) { return d } );

    var xAxis = d3.axisBottom()
                .scale(x);

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis)
       .selectAll("text")
       .attr("y", 0)
       .attr("x", 9)
       .attr("dy", ".35em")
       .attr("transform", "rotate(90)")
       .style("text-anchor", "start");


    // Create groups for each series, rects for each segment
    var groups = svg.selectAll("g.cost")
                    .data(dataset)
                    .enter().append("g")
                    .attr("class", "cost")
                    .style("fill", function(d, i) { return colors(i); });

    var rect = groups.selectAll("rect")
                    .data(d => d)
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return x(d.x); })
                    .attr("y", function(d) { return y(d.y0 + d.y); })
                     .attr("height", function(d) {
                         let h = y(d.y0) - y(d.y0 + d.y)
                         if (isNaN(h)) { console.log(d); }
                         return h; })
                    .attr("width", x.bandwidth() )
                    .on("mouseout", function() { tooltip.style("display", "none"); })
                    .on("mousein", function() { tooltip.style("display", "block"); })
                    .on("mousemove", function(d) {
                        var xPosition = d3.mouse(this)[0] - 15;
                        var yPosition = d3.mouse(this)[1] - 25;
                        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                        tooltip.select("text").text(d.y);
                    });


    // Draw legend
    var legend = svg.selectAll(".legend")
                    .data(colors.range())
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return colors(i);});

    legend.append("text")
        .attr("x", width + 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text((d, i) => phases[i] );


    // Prep the tooltip bits, initial display is hidden
    var tooltip = svg.append("g")
                    .attr("class", "tooltip")
                    .style("display", "none");

    tooltip.append("rect")
        .attr("width", 30)
        .attr("height", 20)
        .attr("fill", "white")
        .style("opacity", 0.5);

    tooltip.append("text")
        .attr("x", 15)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
}
