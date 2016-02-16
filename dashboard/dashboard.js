
function dashboard ( id, fData ) {

	function columnChart ( fD ) {
		var xScale, yScale, histogramSVG;

		var chartObject = {};
		var hGDim = { t: 60, r: 0, b: 30, l: 0 };
		hGDim.w = 1000 - hGDim.l - hGDim.r,
			hGDim.h = 400 - hGDim.t - hGDim.b;

		chartObject.initialize = function(){
			chartObject.addStatic();
			chartObject.update(fD);
		};

		// Updates the bars
		chartObject.update = function ( nD, color ) {
			// Update the domain of the y-axis map to reflect change in frequencies.
			chartObject.updateScales(nD)
			chartObject.updateGraph(nD, color);
		};

		chartObject.addStatic = function(){

			// Create SVG for histogram
			histogramSVG = d3.select(id).append("svg")
				.attr("width", hGDim.w + hGDim.l + hGDim.r)
				.attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
				.attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

			xScale = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
				.domain(fD.map(function ( d ) { return d.x; }));

			yScale = d3.scale.linear().range([hGDim.h, 0])
				.domain([0, d3.max(fD, function ( d ) { return d.y; })]);

			// Add x-axis to the histogram svg
			histogramSVG.append("g").attr("class", "x axis")
				.attr("transform", "translate(" + [0, hGDim.h] + ")")
				.call(d3.svg.axis().scale(xScale).orient("bottom"));
		};

		chartObject.updateScales =  function (newData){
			xScale.domain(newData.map(function ( d ) { return d.x; }));
			yScale.domain([0, d3.max(newData, function ( d ) { return parseInt(d.y); })]);
		};


		chartObject.updateGraph = function (nD, color){
			// Create bars for histogram to contain rectangles and freq labels
			var bars = histogramSVG.selectAll(".bar").data(nD);

			// -------------- UPDATE --------------------//
			// Transition the height and color of rectangles
			bars.select("rect").transition().duration(500)
				.attr("y", function ( d ) {return yScale(d.y); })
				.attr("height", function ( d ) { return hGDim.h - yScale(d.y); })
				.attr("fill", color);

			// Transition the frequency labels location and change value
			bars.select("text").transition().duration(500)
				.text(function ( d ) {		// only returns the number if it is more than zero
					if ( d.y > 0 ) {return d.y}
				})
				.attr("y", function ( d ) {return yScale(d.y) - 5; });

			// -------------- ENTER --------------------//
			var barsEnter = bars.enter()
				.append("g").attr("class", "bar");

			// Create the rectangles
			barsEnter.append("rect")
				.attr("x", function ( d ) { return xScale(d.x); })
				.attr("y", function ( d ) { return yScale(d.y); })
				.attr("width", xScale.rangeBand())
				.attr("height", function ( d ) { return hGDim.h - yScale(d.y); })
				.attr('fill', barColor)
				.on("mouseover", mouseover) // mouseover is defined below.
				.on("mouseout", mouseout); // mouseout is defined below.

			// Create the frequency labels above the rectangles
			barsEnter.append("text").text(function ( d ) {
				return (d.y)
			})
				.attr("x", function ( d ) { return xScale(d.x) + xScale.rangeBand() / 2; })
				.attr("y", function ( d ) { return yScale(d.y) - 5; })
				.attr("text-anchor", "middle");
		};

		function mouseover ( d ) {
			// Filter for selected year.
			var st = fData.filter(function ( s ) { return s.Year == d.x;})[0];
			var nD = ['White', 'Black', 'Hispanic', 'Other'].map(function ( d ) {
				return { type: d, freq: st[d] };
			});

			// Call update functions of pie-chart and legend.
			pieChart.update(nD);
			legend.update(nD);
		}
		function mouseout ( d ) {
			// Reset the pie-chart and legend.
			pieChart.update(totalFrequence);
			legend.update(totalFrequence);
		}

		return chartObject;
	}

	function pieChart ( pD ) {
		var chartObject = {};
		var pieSvg, arc, pie;
		var pieDim = { w: 250, h: 250 };
		pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;


		chartObject.initialize = function(){
			chartObject.addStatic();
			chartObject.update(pD);
		};

		chartObject.addStatic = function (){
			// Create function to draw the arcs of the pie slices
			arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);
			// Create a function to compute the pie slice angles
			pie = d3.layout.pie().sort(null).value(function ( d ) { return d.freq; });

			// Create SVG for pie chart.
			pieSvg = d3.select(id).append("svg")
				.attr("class", "pieChart")
				.attr("width", pieDim.w)
				.attr("height", pieDim.h).append("g")
				.attr("transform", "translate(" + pieDim.w / 2 + "," + pieDim.h / 2 + ")");
		};

		// Create function to update pie-chart. This will be used by histogram
		chartObject.update = function ( nD ) {
			var arcs = pieSvg.selectAll("path").data(pie(nD));

			// -------------- UPDATE --------------------//
			arcs.transition().duration(500)
				.attrTween("d", arcTween);

			// -------------- ENTER --------------------//
			// Draw entering arcs
			arcsEnter = arcs.enter();
			arcsEnter.append("path").attr("d", arc)
				.each(function ( d ) { this._current = d; })
				.style("fill", function ( d ) { return raceColor(d.data.type); })
				.on("mouseover", mouseover).on("mouseout", mouseout);
		};
		// Utility function to be called on mouseover a pie slice
		function mouseover ( d ) {
			// Call the update function of histogram with new data
			columnChart.update(fData.map(function ( v ) {
				return {x : v.Year, y: v[d.data.type]};
				//return [v.Year, v[d.data.type]];
			}), raceColor(d.data.type));
		}

		// Utility function to be called on mouseout a pie slice
		function mouseout ( d ) {
			// Call the update function of histogram with all data
			columnChart.update(fData.map(function ( v ) {
				return {x :v.Year, y: v.totalExecutions};
			}), barColor);
		}

		// Animating the pie-slice requiring a custom function which specifies
		// how the intermediate paths should be drawn.
		function arcTween ( a ) {
			var i = d3.interpolate(this._current, a);
			this._current = i(0);
			return function ( t ) { return arc(i(t)); };
		}

		return chartObject;
	}

	function legend ( lD ) {
		var legend = {};
		var legendTable;


		legend.initialize = function(){
			legend.addStatic();
			legend.update(lD);
			legend.addExtraRows();
		};

		legend.addStatic = function (){
			// Create table for legend
			legendTable = d3.select(id).append("table").attr('class', 'legend').append("tbody").classed("js-legend-table", true)
		};

		// Utility function to be used to update the legend.
		legend.update = function ( nD ) {

			// -------------- UPDATE --------------------//
			// Update the data attached to the row elements
			var tr = legendTable.selectAll("tr").data(nD);

			// Update the frequencies
			tr.select(".legendFreq").text(function ( d ) { return d.freq;});

			// Update the percentage column
			tr.select(".legendPerc").text(function ( d ) { return getPercentLegend(d, nD);});

			// Update the count for each year
			d3.select(".js-legend-table-sum").text(function ( d ) {
				return d3.sum(nD, function ( d ) {return d.freq});
			});

			// -------------- ENTER --------------------//
			// Create one row per segment
			var trEnter = tr.enter().append("tr");

			// Create the first column for each segment
			// Colored rectangles for each race
			trEnter.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
				.attr("width", '16').attr("height", '16')
				.attr("fill", function ( d ) { return raceColor(d.type); });

			// Create the second column for each segment
			// Name of the races
			trEnter.append("td").text(function ( d ) { return d.type;});

			// Create the third column for each segment
			// Total number for each race
			trEnter.append("td").attr("class", 'legendFreq')
				.text(function ( d ) { return d.freq;});

			// Create the fourth column for each segment
			// The total percentages for each race
			trEnter.append("td").attr("class", 'legendPerc')
				.text(function ( d ) { return getPercentLegend(d, lD);});


		};

		legend.addExtraRows = function(){
			// Create table footer for total count
			var tableFooter = d3.select(".js-legend-table").append("tr");

			// First column is empty
			tableFooter.append("td").text(function ( d ) { return "" });

			// Second column is "total"
			tableFooter.append("td").text(function ( d ) { return "Total: " });

			// Third column sum of all count
			tableFooter.append("td").attr("class", 'js-legend-table-sum').text(function ( d ) {
				return d3.sum(lD, function ( d ) {return d.freq})
			});

			// Fourth column is empty
			tableFooter.append("td").text(function ( d ) { return "" });
		};

		// Utility function to compute percentage
		function getPercentLegend ( d, aD ) {
			return d3.format("%")(d.freq / d3.sum(aD.map(function ( v ) { return v.freq; })));
		}

		return legend;
	}


	var barColor = "#8B0000";

	// Each race has a color to show on piechart, in legend and when hovering
	function raceColor ( c ) {
		return {
			White: "#D96459",
			Black: "#28ABE3",
			Hispanic: "#1FDA9A",
			Other: "#E8B71A"
		}[c];
	}

	// Add total executions for each year (object)
	fData.forEach(function ( d ) {
		d.totalExecutions = parseInt(d.White) + parseInt(d.Black) + parseInt(d.Hispanic) + parseInt(d.Other);
	});

	// Aggregate total frequency by segment for all year.
	var totalFrequence = ['White', 'Black', 'Hispanic', 'Other'].map(function ( d ) {
		return {
			type: d, freq: d3.sum(fData.map(function ( t ) {
				return t[d];
			}))
		};
	});


	// Map from incoming data to object containing x and y
	var segmentFrequence = fData.map(function ( d ) {return { x: d.Year, y: d.totalExecutions };});

	var columnChart = columnChart(segmentFrequence),		// Create the histogram
	    pieChart  = pieChart(totalFrequence);		// Create the pie-chart
		legend = legend(totalFrequence);		// Create the legend

		columnChart.initialize();
		pieChart.initialize();
		legend.initialize();

}

// Fetching the data from a json file, have to reverse the data
d3.json("executions_by_year.json", function ( data ) {
	dashboard("#dashboard", data.reverse());
});