function dashboard(id, fData){

	var barColor = "#8B0000";
		// calculate total frequency by year for all segment.
		var segmentFrequence = fData.map(function(d){return [d.Year,d.totalExecutions];});

		var hG = {};
		var hGDim = {t: 60, r: 0, b: 30, l: 0};
		hGDim.w = 1000 - hGDim.l - hGDim.r, 
		hGDim.h = 400 - hGDim.t - hGDim.b;

		//create SVG for histogram
		var histogramSVG = d3.select(id).append("svg")
			.attr("width", hGDim.w + hGDim.l + hGDim.r)
			.attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")

		// create function for x-axis mapping.
		var xScale = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
				.domain(segmentFrequence.map(function(d) { return d[0]; }));

		// Create function for y-axis map.
		var yScale = d3.scale.linear().range([hGDim.h, 0])
				.domain([0, d3.max(segmentFrequence, function(d) { return d[1]; })]);

		// Create bars for histogram to contain rectangles and freq labels.
		var bars = histogramSVG.selectAll(".bar").data(segmentFrequence).enter()
				.append("g").attr("class", "bar");

		//create the rectangles.
		bars.append("rect")
			.attr("x", function(d) { return xScale(d[0]); })
			.attr("y", function(d) { return yScale(d[1]); })
			.attr("width", xScale.rangeBand())
			.attr("height", function(d) { return hGDim.h - yScale(d[1]); })
			.attr('fill', barColor);

}

d3.json("executions_by_year.json", function(data){
	dashboard("#dashboard", data);
});