
function vis () {
	//Width and height
	var w = 1200;
	var h = 800;

	var color = d3.scale.category10();

	var dataset = [];					
	for (var i = 0; i < 25; i++) {						
		dataset.push([Math.random() * w, Math.random() * h]);			 
	}

	//Create SVG element
	var svg = d3.select("body")
				.append("svg")
				.attr("width", w)
				.attr("height", h);

	var circle = svg.selectAll("circle")
					.data(dataset)
					.enter()
					.append("circle")
					.attr("cx", function(d) {
						return d[0];
					})
					.attr("cy", function(d) {
						return d[1];
					})
					.transition()
					.attr("r", function(d) {
						return Math.sqrt(h - d[1]);
					})
					.style("fill", function(d) { 
						return color(Math.random()); 
					});
}