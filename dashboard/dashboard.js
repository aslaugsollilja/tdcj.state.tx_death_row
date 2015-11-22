function dashboard(id, fData){
	var barColor = "#8B0000";
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
			.attr('fill',barColor);

		//Create the frequency labels above the rectangles.
		bars.append("text").text(function(d){ return (d[1])})
			.attr("x", function(d){ return xScale(d[0])+xScale.rangeBand()/2; })
			.attr("y", function(d){ return yScale(d[1])-5; })
			.attr("text-anchor", "middle");

	}

	// calculate total frequency by year for all segment.
	var segmentFrequence = fData.map(function(d){return [d.Year,d.totalExecutions];});

	var createHistoGram = histoGram(segmentFrequence);		// create the histogram.
		
}

d3.json("executions_by_year.json", function(data){
	dashboard("#dashboard", data);
});