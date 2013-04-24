/*JavaScript file that:
	- plots a scatterplot of json defined coordinates
*/
var points;
var userdata;
var dataset = [];

var svg = d3.select("#widget")
	.append("svg")
	.attr("width", "100%")
	.attr("height", "100%");

// Retrieve user data from userdata.json
d3.json("json/user_data.json", function(json) {
	userdata = json;
	getPoints();
});

// Retrieve points data from points.json

function getPoints() {
	d3.json("json/points.json", function(json) {
		points = json;
		mergeJSON();
	});
}
// Merge points and user data

function mergeJSON() {

	// Add the user data to the points
	for (var i = 0; i < points.length; i++) {
		dataset.push({
			x: points[i][0],
			y: points[i][1],
			colour: userdata[i].colour,
			cred: userdata[i].cred,
			id: userdata[i].id,
			link: userdata[i].link,
			primary: userdata[i].primary,
			username: userdata[i].username
		});

	}
	console.log(dataset);

	// Add the user data to the points
	for (var i = 0; i < points.length; i++) {
		points[i].push({ //d[2]
			colour: userdata[i].colour,
			cred: userdata[i].cred,
			id: userdata[i].id,
			link: userdata[i].link,
			primary: userdata[i].primary,
			username: userdata[i].username
		});


	}

	draw();
	// DEBUG
	// console.log(points);
}

function scaleCoordinates() {
	// Scale points to be spaced out better
	for (var i = 0; i < dataset.length; i++) {
		dataset[i].x = (dataset[i].x + 5) * 50
		dataset[i].y = (dataset[i].y + 5) * 50
		// points[i][j] = (points[i][j] + 5) * 50;
	}
}

function draw() {

	scaleCoordinates();

	// Configure circles
	svg.selectAll("circle")
		.data(dataset)
		.enter()
		.append("circle")
		.on("mouseover", function(d) {
		console.log(d.username);
	})
		.attr("cx", function(d) {
		return d.x;
	})
		.attr("cy", function(d) {
		return d.y;
	})
		.style("stroke", "#000")
		.transition()
		.attr("r", function(d) {
		return 20;
	})
		.style("fill", function(d) {
		if (d.colour == "red") return "darkred";
		else if (d.colour == "blue") return "darkblue";
		else if (d.colour == "green") return "darkgreen";
		else return d.colour;
	});

	setLabels();

}

function setLabels() {
	// Configure labels
	svg.selectAll("text")
		.data(dataset)
		.enter()
		.append("text")
		.attr("dx", function(d) {
		return d.x;
	})
		.attr("dy", function(d) {
		return d.y - 25;
	})
		.attr("font-family", "sans-serif")
		.attr("font-size", "13px")
		.style("text-anchor", "middle")
		.text(function(d) {
		return d.username;
	});
}