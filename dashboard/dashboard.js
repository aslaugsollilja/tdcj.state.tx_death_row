function dashboard(id, fData){
	var barColor = "#8B0000";

	//each race has a color to show on piechart, in legend and when hovering
	function raceColor(c){ return {White:"#D96459", Black:"#28ABE3", Hispanic:"#1FDA9A", Other: "#E8B71A"}[c]; }

	//compute total executions for each year
	fData.forEach(function(d){
		d.totalExecutions = parseInt(d.White) + parseInt(d.Black) + parseInt(d.Hispanic) + parseInt(d.Other);
	});

	//function that handles the histogram
	function histoGram(fD){

		var hG = {};
		var hGDim = {t: 60, r: 0, b: 30, l: 0};
		hGDim.w = 1000 - hGDim.l - hGDim.r, 
		hGDim.h = 400 - hGDim.t - hGDim.b;

		//create SVG for histogram
		var histogramSVG = d3.select(id).append("svg")
			.attr("width", hGDim.w + hGDim.l + hGDim.r)
			.attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
			.attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

		// create function for x-axis mapping.
		var xScale = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
				.domain(fD.map(function(d) { return d[0]; }));

		// Add x-axis to the histogram svg.
		histogramSVG.append("g").attr("class", "x axis")
			.attr("transform", "translate("+ [0,hGDim.h] + ")")
			.call(d3.svg.axis().scale(xScale).orient("bottom"));

		// Create function for y-axis map.
		var yScale = d3.scale.linear().range([hGDim.h, 0])
				.domain([0, d3.max(fD, function(d) { return d[1]; })]);

		// Create bars for histogram to contain rectangles and freq labels.
		var bars = histogramSVG.selectAll(".bar").data(fD).enter()
				.append("g").attr("class", "bar");

		//create the rectangles.
		bars.append("rect")
			.attr("x", function(d) { return xScale(d[0]); })
			.attr("y", function(d) { return yScale(d[1]); })
			.attr("width", xScale.rangeBand())
			.attr("height", function(d) { return hGDim.h - yScale(d[1]); })
			.attr('fill',barColor)
			.on("mouseover", mouseover) // mouseover is defined below.
			.on("mouseout", mouseout); // mouseout is defined below.

		//Create the frequency labels above the rectangles.
		bars.append("text").text(function(d){ 
			return (d[1])
		})
			.attr("x", function(d){ return xScale(d[0])+xScale.rangeBand()/2; })
			.attr("y", function(d){ return yScale(d[1])-5; })
			.attr("text-anchor", "middle");

		function mouseover(d){		// utility function to be called on mouseover.
			// filter for selected year.
			var st = fData.filter(function(s){ return s.Year == d[0];})[0];
			var nD = ['White','Black','Hispanic','Other'].map(function(d){ 
				return {type:d, freq: st[d]}; 
			});

			// call update functions of pie-chart and legend.
			createPieChart.update(nD);
			createLegend.update(nD);
		}
		
		function mouseout(d){	// utility function to be called on mouseout.
			// reset the pie-chart and legend.
			createPieChart.update(totalFrequence);
			createLegend.update(totalFrequence);
		}

		// create function to update the bars. This will be used by pie-chart.
		hG.update = function(nD, color){
			// update the domain of the y-axis map to reflect change in frequencies.
			yScale.domain([0, d3.max(nD, function(d) { 
				return parseInt(d[1]); })]);
			
			// Attach the new data to the bars.
			var bars = histogramSVG.selectAll(".bar").data(nD);
			
			// transition the height and color of rectangles.
			bars.select("rect").transition().duration(500)
				.attr("y", function(d) {return yScale(d[1]); })
				.attr("height", function(d) { return hGDim.h - yScale(d[1]); })
				.attr("fill", color);

			// transition the frequency labels location and change value.
			bars.select("text").transition().duration(500)
				.text(function(d){		//only returns the number if it is more than zero
					if(d[1] > 0){return d[1]}
				})
				.attr("y", function(d) {return yScale(d[1])-5; });
		}
		return hG;
	}

	//function to handle the piechart
	function pieChart(pD){
		var createPieChart = {};
		var pieDim = {w:250, h: 250};
		pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;
				
		//create svg for pie chart.
		var piesvg = d3.select(id).append("svg")
			.attr("width", pieDim.w)
			.attr("height", pieDim.h).append("g")
			.attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");
		
		// create function to draw the arcs of the pie slices.
		var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

		// create a function to compute the pie slice angles.
		var pie = d3.layout.pie().sort(null).value(function(d) { return d.freq; });

		// Draw the pie slices.
		piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
			.each(function(d) { this._current = d; })
			.style("fill", function(d) { return raceColor(d.data.type); })
			.on("mouseover",mouseover).on("mouseout",mouseout);

		// create function to update pie-chart. This will be used by histogram.
		createPieChart.update = function(nD){
			piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
				.attrTween("d", arcTween);
		}
		// Utility function to be called on mouseover a pie slice.
		function mouseover(d){
			// call the update function of histogram with new data.
			createHistoGram.update(fData.map(function(v){ 
				return [v.Year,v[d.data.type]];}),raceColor(d.data.type));
		}
		//Utility function to be called on mouseout a pie slice.
		function mouseout(d){
			// call the update function of histogram with all data.
			createHistoGram.update(fData.map(function(v){
				return [v.Year,v.totalExecutions];}), barColor);
		}
		// Animating the pie-slice requiring a custom function which specifies
		// how the intermediate paths should be drawn.
		function arcTween(a) {
			var i = d3.interpolate(this._current, a);
			this._current = i(0);
			return function(t) { return arc(i(t)); };
		}
		return createPieChart;
	}

	// function to handle legend.
	function legend(lD){
		var createLegend = {};

		// create table for legend.
		var legend = d3.select(id).append("table").attr('class','legend');

		// create one row per segment.
		var tr = legend.append("tbody").classed("js-legend-table", true).selectAll("tr").data(lD).enter().append("tr");
			
		// create the first column for each segment.
		tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
			.attr("width", '16').attr("height", '16')
			.attr("fill",function(d){ return raceColor(d.type); });
			
		// create the second column for each segment.
		tr.append("td").text(function(d){ return d.type;});

		// create the third column for each segment.
		tr.append("td").attr("class",'legendFreq')
			.text(function(d){ return d.freq;});

		// create the fourth column for each segment.
		tr.append("td").attr("class",'legendPerc')
			.text(function(d){ return getPercentLegend(d,lD);});

		//create table footer for total count and total percentage
		var tableFooter = d3.select(".js-legend-table").append("tr");
		//first column, this will change to something nicer
		tableFooter.append("td").text(function(d){ return "" });
		//second column this is the header for total
		tableFooter.append("td").text(function(d){ return "Total: " });
		//third column sum of all count
		tableFooter.append("td").attr("class", 'js-legend-table-sum').text(function(d){ 
			return d3.sum(lD, function(d){return d.freq}) 
		});
		//fourth column sum og whole percent, this should always be 100%
		tableFooter.append("td").text(function(d){ 
			return  
		});

		// Utility function to be used to update the legend.
		createLegend.update = function(nD){

			// update the data attached to the row elements.
			var l = legend.select("tbody").selectAll("tr").data(nD);

			// update the frequencies.
			l.select(".legendFreq").text(function(d){ return d.freq;});

			// update the percentage column.
			l.select(".legendPerc").text(function(d){ return getPercentLegend(d,nD);});

			//update the count for each year
			d3.select(".js-legend-table-sum").text(function(d){
				return d3.sum(nD, function(d){return d.freq});
			});
		}

		function getPercentLegend(d,aD){ // Utility function to compute percentage.
			return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
		}

		return createLegend;
	}

	// calculate total frequency by segment for all year.
	var totalFrequence = ['White','Black','Hispanic','Other'].map(function(d){ 
		return {type:d, freq: d3.sum(fData.map(function(t){ 
			return t[d];
		}))}; 
	});

	// calculate total frequency by year for all segment.
	var segmentFrequence = fData.map(function(d){return [d.Year,d.totalExecutions];});

	var createHistoGram = histoGram(segmentFrequence),		// create the histogram.
		createPieChart = pieChart(totalFrequence);		// create the pie-chart.
		createLegend= legend(totalFrequence);		// create the legend.

}

//fetch the data from a json file
d3.json("executions_by_year.json", function(data){
	dashboard("#dashboard", data.reverse());
});