// Setup svg using Bostock's margin convention

var margin = {top: 20, right: 160, bottom: 35, left: 30};

var width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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

console.log(dataset);

var csv = d3.csv('ghc-passes-grouped.csv',
             d => {
                d.milliseconds = +d.milliseconds;
                d.megabytes = +d.megabytes;
                return d;
            })
            .then( pivotAndStack )
            .then( render );

function pivotAndStack( csvData ) {
    let pivoted = new Map();
    let phases = new Set();

    for (const row of csvData) {
        if (row.module === 'Main') {
            let name = row.package + ':Main';
        } else {
            let name = row.module;
        }

        if (name in pivoted) {
            pivoted[name][row.phase] = row.milliseconds;
        } else {
            let insert = {};
            insert.name = name;
            insert[row.phase] = row.milliseconds;
            pivoted[name] = insert;
        }

        phases.add(row.phase);

    };

    let stack = d3.stack() .keys(phases.values());
    return stack(pivoted.values())
        .map( series => series.map( d => ({
            x: d.data.name,
            y0: d[0],
            y: d[1]
        })));
}

function render(_data) {

    // Set x, y and colors
    var x = d3.scaleBand()
            .domain(dataset[0].map(function(d) { return d.x; }))
            .padding(0.1)
            .rangeRound([10, width-10]);

    var y = d3.scaleLinear()
            .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
            .range([height, 0]);

    var colors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];


    // Define and draw axes
    var yAxis = d3.axisLeft()
                .scale(y)
                .ticks(5)
                .tickSize(-width, 0, 0)
                .tickFormat( function(d) { return d } );

    var xAxis = d3.axisBottom()
                .scale(x)
                .tickFormat(d3.timeFormat("%Y"));

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);


    // Create groups for each series, rects for each segment
    var groups = svg.selectAll("g.cost")
                    .data(dataset)
                    .enter().append("g")
                    .attr("class", "cost")
                    .style("fill", function(d, i) { return colors[i]; });

    var rect = groups.selectAll("rect")
                    .data(d => d)
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return x(d.x); })
                    .attr("y", function(d) { return y(d.y0 + d.y); })
                    .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
                    .attr("width", x.bandwidth() )
                    .on("mouseout", function() { tooltip.style("display", "none"); })
                    .on("mousemove", function(d) {
                        var xPosition = d3.mouse(this)[0] - 15;
                        var yPosition = d3.mouse(this)[1] - 25;
                        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                        tooltip.select("text").text(d.y);
                    });


    // Draw legend
    var legend = svg.selectAll(".legend")
                    .data(colors)
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return colors.slice().reverse()[i];});

    legend.append("text")
        .attr("x", width + 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
            switch (i) {
                case 0: return "Anjou pears";
                case 1: return "Naval oranges";
                case 2: return "McIntosh apples";
                case 3: return "Red Delicious apples";
            }
        });


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
