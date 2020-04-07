/*
Import Data
*/
let strategy = 'tencent';
let benchmark = 'waison';

d3.csv('hk_stocks.csv')
  .then(function(data) {
  	render(data);
	})
  .catch(function(error){
     alert('error');
  })


function render(data) {

let namedvar = data[0];

const width = 750;
const margin = {top: 50, right: 50, bottom: 50, left:50};
const priceChartHeight = 400;
const tradeChartHeight = 250;

var svg = d3.select('body')
	.append('svg')
	.attr('viewBox', `0 0 750 600`);

var priceChart = svg.append('g')
	.attr('id', 'priceChart')
	.attr('transform', `translate(${margin.left},0)`)
	.attr('width', width)
	.attr('height', priceChartHeight)
	.attr('fill', 'steelblue');

var tradeChart = svg.append('g')
	.attr('id', 'tradeChart')
	.attr('transform', `translate(${margin.left},${priceChartHeight+20})`)
	.attr('width', width)
	.attr('height', tradeChartHeight);


//Scales and Axes

let tradeData = data.filter(d => {
	return d.asset != "";
});

let tradeDomain = [-d3.max(tradeData, row => Math.abs(row.trade_value)), d3.max(tradeData, row => Math.abs(row.trade_value))];

let yTrade = d3.scaleLinear()
	.range([tradeChartHeight/2, 0])
	.domain(tradeDomain);

let tradeYAxis = tradeChart.append("g")
	.call(d3.axisLeft(yTrade))
	.call(g => g.select(".domain").remove());

let priceDomain = [d3.min(data, d => Math.min(d[strategy], d[benchmark])), d3.max(data, d => Math.max(d[strategy], d[benchmark]))];

let yPrice = d3.scaleLinear()
	.range([priceChartHeight,0])
	.domain(priceDomain);
   
let priceYAxis = priceChart.append("g")
	.call(d3.axisLeft(yPrice)
		.tickFormat(d3.format(".0%")))
	.call(g => g.select(".domain").remove());

let dateDomain = d3.extent(data, d => new Date(d.Date));

let x = d3.scaleTime()
	.range([20,`${width-margin.left-20}`])
	.domain(dateDomain)
	.nice();

let xAxis = tradeChart.append("g")
	.call(d3.axisTop(x)
		.tickFormat(d3.utcFormat("%b %Y")));

let tooltip = d3.select('#tradeChart').append('g')
	.attr("id", "tooltip")
	.attr('visibility', 'hidden');

tooltip.append('rect')
	.attr('id', 'bg')
	.attr('width', 150)
	.attr('height', 55)
	.attr('fill', 'black');

let tooltipText = tooltip.append('text')
	.attr('fill', 'white')
	.attr('font-size', 'smaller')
	.attr('x', 5)
	.attr('y', 15);

tooltipText.append('tspan')
	.attr('id', 'line1')
	.attr('x', 10);

tooltipText.append('tspan')
	.attr('id', 'line2')
	.attr('dy', 15)
	.attr('x', 10);

tooltipText.append('tspan')
	.attr('id', 'line3')
	.attr('dy', 15)
	.attr('x', 10);

 
d3.select('#tradeChart').selectAll('.bar').data(tradeData)
	.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', d => x(new Date(d.Date)))
		.attr('y', d => yTrade(Math.max(0, d.trade_value)))
		.attr('width', 7)
		.attr('height', d => Math.abs(yTrade(d.trade_value)- yTrade(0)))
		.attr('fill', 'black')
		.attr('stroke', 'black')
		.on('mouseover', d => {
						d3.select(d3.event.target)
							.attr("opacity", 0.6);
						d3.select('#tooltip')
							.attr('visibility', 'visible')
							.select('#line1')
								.text(`${d.quantity > 0 ? 'Bought': 'Sold'} ${Math.abs(d.quantity)} ${d.asset}`);
						
						
						d3.select('#tooltip')
							.select('#line2')
								.text(`On ${d.Date} for ${d[d.asset]}`);
						d3.select('#tooltip')
							.select('#line3')
								.text(`Total Cost: \$${d.trade_value}`)
						d3.select('#tooltip')
							.attr('transform', `translate(${x(new Date(d.Date)) -60}, -60)`);
		})
		.on('mousemove', d => {
			tooltip
				.attr('visibility', 'visible');
		})
		.on('mouseleave', d => {
						d3.select(d3.event.target)
							.attr('opacity', 1);
						d3.select('#tooltip')
							.attr('visibility', 'hidden');
		});



}
