// Setup selection dropdowns and button

const columns = ["Tencent", "Waison", "CKLife", "Cowell", "portfolio_value"]

var strategyOptions = ''
for(let i=0; i<columns.length; i++){
	var strategyOptions = strategyOptions.concat(`<option value="${i}">${columns[i]}</option>`);
 }

const strat = `<strong>Strategy: </strong><select id="strategySelect">${strategyOptions}</select>`;
const bench = `<strong>Benchmark: </strong><select id="benchmarkSelect">${strategyOptions}</select>`;
const update = `<button onclick="updateData()">Update</button>`;

var choices = `${strat} ${bench} ${update}`;

document.getElementById("choices").innerHTML = choices;
document.getElementById("strategySelect").selectedIndex = "0";
document.getElementById("benchmarkSelect").selectedIndex = "4";


// Set the dimensions of the canvas / graph
var margin = {top: 20, right: 20, bottom: 50, left: 50};
var width = 800 - margin.left - margin.right;
var priceChartHeight = 400 - margin.top;
var tradeChartHeight = 300 - margin.bottom;

// Add SVG and Charts
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", priceChartHeight + margin.top + tradeChartHeight + margin.bottom);

var priceChart = svg.append("g")
	.attr("id", "priceChart")
    .attr("transform",
    `translate(${margin.left} , ${margin.top})`);

var tradeChart = svg.append("g")
		.attr("id", "tradeChart")
		.attr("transform",
        `translate( ${margin.left} , ${margin.top + priceChartHeight + 15})`);
        

// Parse the date / time
var parseDate = d3.timeParse("%Y-%m-%d");

// Set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([priceChartHeight, 0]);
var yTrade = d3.scaleLinear().range([tradeChartHeight/2, 0]);

// Define the axes
var xAxis = d3.axisBottom().scale(x);

var yAxis = d3.axisLeft().scale(y).tickFormat(d3.format(".0%"));

var tradeYAxis = d3.axisLeft().scale(yTrade).tickFormat(y =>`\$${y/1000}K`);

// Gridlines
function make_y_gridlines(yvar) {		
    return d3.axisLeft(yvar)
        .ticks(5)
}

// Trade Tooltip

var tradeTooltip = tradeChart.append('g')
	.attr("id", "tradeTooltip")
	.attr('visibility', 'hidden');

tradeTooltip.append('rect')
		.attr('width', 150)
		.attr('height', 55)
		.attr("fill", "black");

var tradeTooltipText = tradeTooltip.append("text")
	.attr("fill", "white")
	.attr("font-size", "smaller")
	.attr('x', 5)
	.attr('y', 15);

tradeTooltipText.append('tspan')
	.attr("id", "line1")
	.attr('x', 10);

tradeTooltipText.append('tspan')
	.attr('id', 'line2')
	.attr('dy', 15)
	.attr('x', 10);

tradeTooltipText.append('tspan')
	.attr('id', 'line3')
	.attr('dy', 15)
	.attr('x', 10);
    
// Get the data
d3.csv("hk_stocks.csv").then(function(data) {
    var strategy  = "Tencent";
    var benchmark = "portfolio_value";

    const strategyStart = +data[0][strategy];
    const benchmarkStart = +data[0][benchmark];
    
    data.forEach(function(d) {
        d.date = new Date(d.Date);
        d.strategy = +d[strategy]/strategyStart;
        d.benchmark = +d[benchmark]/benchmarkStart;
    });

    // Trade Data
    var tradeData = data.filter(d => {
        return d.asset != "";
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([d3.min(data, d => Math.min(d.strategy, d.benchmark)), 
                d3.max(data, d => Math.max(d.strategy, d.benchmark))]);
    yTrade.domain(tradeDomain = [-d3.max(tradeData, row => Math.abs(row.trade_value)),
                d3.max(tradeData, row => Math.abs(row.trade_value))]);

    priceChart.datum(data);

    // Area below strategy line and above bottom of graph
    priceChart.append("clipPath")
        .attr("id", "clipabove")
      .append("path")
      .attr("id", "clipabovepath")
        .attr("d", d3.area()
            .x(d => x(d.date))
            .y0(0)
            .y1(d => y(d.strategy)));

    // Area above strategy line and below top of graph
    priceChart.append("clipPath")
        .attr("id", "clipbelow")
      .append("path")
      .attr("id", "clipbelowpath")
        .attr("d", d3.area()
            .x(d => x(d.date))
            .y0(priceChartHeight)
            .y1(d => y(d.strategy)));
    
    // Area above benchmark and below clipabove
    priceChart.append("path")
        .attr("id", "areaabove")
        .attr("clip-path", "url(#clipabove)")
			.attr("d", d3.area()
            .x(d => x(d.date))
            .y0(priceChartHeight)
            .y1(d => y(d.benchmark)));

    // Area below benchmark and above clipabove
    priceChart.append("path")
        .attr("id", "areabelow")    
        .attr("clip-path", "url(#clipbelow)")
            .attr("d", d3.area()
            .x(d => x(d.date))
            .y0(0)
            .y1(d => y(d.benchmark)));

    // Add the strategyLine path.
    priceChart.append("path")
        .attr("id", "strategyLine")
        .style("stroke", "black")
        .style("stroke-width", "1.8")
        .attr("d", d3.line()	
                .x(d => x(d.date))
                .y(d => y(d.strategy)));

    svg.selectAll('text').data(data)
      .enter().append('text')
      .text(d => `BM: ${d.benchmark * 100}`)
      .attr('class', 'hide benchmark')
      .attr('y', d => {
        return y(d.benchmark);
      })
      .attr('x', d => {
        return x(d.date);
      })
      .on('mouseover', function(d){
        d3.event.target.classList.add('show');
      })
      .on('mouseout', function(){
        d3.event.target.classList.remove('show');;
      });

// Add the benchmarkLine path.
    priceChart.append("path")
        .attr("id", "benchmarkLine")
        .style("stroke", "gray")
        .style("stroke-width", "1.5")
        .attr("d", d3.line()
                .x(d => x(d.date))
                .y(d => y(d.benchmark)));

    // Add the X Axis
    priceChart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + priceChartHeight + ")")
        .call(xAxis);

    // Add Price Y Axis
    priceChart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add Trade Y axis
    tradeChart.append("g")
        .attr("class", "y axis")
        .call(tradeYAxis);

    tradeChart.append("g")
    .attr("class", "grid")
        .call(make_y_gridlines(yTrade)
          .tickSize(-width)
          .tickFormat(""));


    // Trade Bars
    tradeChart.selectAll('.bar').data(tradeData)
	.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', d => x(new Date(d.Date)))
		.attr('y', d => yTrade(Math.max(0, d.trade_value)))
		.attr('width', 5)
		.attr('height', d => Math.abs(yTrade(d.trade_value)- yTrade(0)))
		.attr('fill', 'black')
		.attr('stroke', 'black')
		.on('mouseover', d => {
						d3.select(d3.event.target)
							.attr("opacity", 0.6);
						tradeTooltip
							.attr('visibility', 'visible')
							.select('#line1')
								.text(`${d.quantity > 0 ? 'Bought': 'Sold'} ${Math.abs(d.quantity)} ${d.asset}`);
						
						
						tradeTooltip
							.select('#line2')
								.text(`On ${d.Date} for ${d[d.asset]}`);
						tradeTooltip
							.select('#line3')
								.text(`Total Cost: \$${d.trade_value}`)
						tradeTooltip
							.attr('transform', `translate(${x(new Date(d.Date)) -60}, -60)`);
		})
		.on('mousemove', d => {
			tradeTooltip
				.attr('visibility', 'visible');
		})
		.on('mouseleave', d => {
						d3.select(d3.event.target)
							.attr('opacity', 1);
						tradeTooltip
							.attr('visibility', 'hidden');
		});

});

// Update strategy and benchmark data
function updateData() {

var strategyIndex = document.getElementById("strategySelect").selectedIndex;
var strategy = strategySelect.options[strategyIndex].text;

var benchmarkIndex = document.getElementById("benchmarkSelect").selectedIndex;
var benchmark = benchmarkSelect.options[benchmarkIndex].text;
    
    // Update Data
    d3.csv("hk_stocks.csv").then(function(data) {
        var strategyStart = +data[0][strategy];
	    var benchmarkStart = +data[0][benchmark];
           
        data.forEach(function(d) {
	    	d.date = new Date(d.Date);
            d.strategy = +d[strategy]/strategyStart;
            d.benchmark = +d[benchmark]/benchmarkStart;
	    });

    	// Scale the range of the data again 
    	x.domain(d3.extent(data, d => (d.date)));
	    y.domain([d3.min(data, d => Math.min(d.strategy, d.benchmark)), 
                                d3.max(data, d => Math.max(d.strategy, d.benchmark))]);

    
    priceChart.datum(data);
    // Select price Chart
    var pct = d3.select("#priceChart");

    // Hacky way around the fact that I can't for the love of god find way to transition clippath
    d3.select("#clipabove").remove();
    d3.select("#clipbelow").remove();

    // Change area below strategy line and above bottom of graph
    priceChart.append("clipPath")
        .attr("id", "clipabove")
      .append("path")
      .attr("id", "clipabovepath")

        .attr("d", d3.area()
            .x(d => x(d.date))
            .y0(0)
            .y1(d => y(d.strategy)));

    // Change area above strategy line and below top of graph
    priceChart.append("clipPath")
        .attr("id", "clipbelow")
      .append("path")
      .attr("id", "clipbelowpath")

        .attr("d", d3.area()
            .x(d => x(d.date))
            .y0(priceChartHeight)
            .y1(d => y(d.strategy)));

    
    // Change area above benchmark and below clipabove
    pct.select("#areaabove")
        // .duration(100)
        .attr("clip-path", "url(#clipabove)")
		.attr("d", d3.area()
            .x(d => x(d.date))
            .y0(priceChartHeight)
            .y1(d => y(d.benchmark)));

    // Change area below benchmark and above clipbelow
    pct.select("#areabelow")
        // .duration(100)
        .attr("clip-path", "url(#clipbelow)")
        .attr("d", d3.area()
            .x(d => x(d.date))
            .y0(0)
            .y1(d => y(d.benchmark)));


        // Update Strategy Line
        pct.select("#strategyLine")
            // .duration(100)
            .attr("d", d3.line()	
                .x(d => x(d.date))
                .y(d => y(d.strategy)));

        // Update Benchmark Line
        pct.select("#benchmarkLine")
            // .duration(100)
            .attr("d", d3.line()	
                .x(d => x(d.date))
                .y(d => y(d.benchmark)));

        pct.selectAll('text').data(data).x(d => x(d.date)).y(d => y(d.strategy)).enter().append('text').text(d => `Strategy: ${d.strategy}`); 
        // change the x axis
        pct.select(".x.axis") 
            // .duration(100)
            .call(xAxis);
        // change the y axis
        pct.select(".y.axis") 
            // .duration(100)
            .call(yAxis);

    });
}


