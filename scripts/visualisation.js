/*JavaScript file that:
	- plots a scatterplot of json defined coordinates
*/
var points;
var user_data;

var svg = d3.select("#widget")
	.append("svg")
	.attr("width", "100%")
	.attr("height", "100%");

// Retrieve user data from user_data.json
d3.json("json/user_data.json", function(json) {
	user_data = json;
});

// Retrieve points data from points.json
d3.json("json/points.json", function(json) {
	points = json;

	// Add the user data to the points
	for (var i = 0; i < json.length; i++) {
		points[i].push({ //d[2]
			colour: user_data[i].colour,
			cred: user_data[i].cred,
			id: user_data[i].id,
			link: user_data[i].link,
			primary: user_data.primary,
			username: user_data[i].username
		});

		// Scale points to be spaced out better
		for (var j = 0; j < 2; j++) {
			points[i][j] = (points[i][j] + 5) * 50;
		}
	}

	// DEBUG
	console.log(points);

	// Configure circles
	svg.selectAll("circle")
		.data(points)
		.enter()
		.append("circle")
		.on("mouseover", function(d) {
		console.log(d[2].username);
	})
		.attr("cx", function(d) {
		return d[0];
	})
		.attr("cy", function(d) {
		return d[1];
	})
		.style("stroke", "#000")
		.transition()
		.attr("r", function(d) {
		return 20;
	})
		.style("fill", function(d) {
		if (d[2].colour == "red") return "darkred";
		else if (d[2].colour == "blue") return "darkblue";
		else if (d[2].colour == "green") return "darkgreen";
		else return d[2].colour;
	});

	// Configure labels
	// svg.selectAll("text")
	// 	.data(points)
	// 	.enter()
	// 	.append("text")
	// 	.attr("dx", function(d) {
	// 	return d[0];
	// })
	// 	.attr("dy", function(d) {
	// 	return d[1] - 25;
	// })
	// 	.attr("font-family", "sans-serif")
	// 	.attr("font-size", "13px")
	// 	.style("text-anchor", "middle")
	// 	.text(function(d) {
	// 	return d[2].username;
	// });
});