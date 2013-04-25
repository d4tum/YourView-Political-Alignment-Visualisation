/*JavaScript file that provides the functionality of the yourview.org.au political alignmenet visualisation:
This is:
	- layout of scatterplot (output) and controls (input)
	- plots a scatterplot of json defined coordinates when the html page is first loaded
	- re-plots the scatterplot with fresh points when a slider value is changed

TODO:
	- Move from emulating the API return files wtih lical dummy files to actual API calls
	- Wire up sliders to write to file/POST etc. to send to server the tag weights
	- Implement Entities tab with buttons
	- Implement show/hide of plot point of the entity button clicked
	- Overall style tidy, prettify, tweaking
*/

// ~~~~~~~~~~~~~~~~~~~~~~~~~~d3 stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var DEBUG = true;
// For bug where text labels are only half their supposed x value
// See http://stackoverflow.com/questions/7000190/detect-all-firefox-versions-in-js
// for this solution.
var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

var points;
var userdata;
var data = [];
var w = 600
var h = 600
var entities;

var svg = d3.select("#scatterplot")
	.append("svg")
	.attr("width", w)
	.attr("height", h);

// Retrieve user data from userdata.json
d3.json("json/user_data.json", function(json) {
	userdata = json;
	retrievePoints();
});

// Retrieve points data from points.json

function retrievePoints() {
	d3.json("json/points.json", function(json) {
		points = json;
		data = mergeJSON(data);
		plot();
	});
}

// Merge the points and user data from the json files
// into a single object per datum/plot point/political entity

function mergeJSON(dataset) {

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

	if (DEBUG) console.log(data);

	return dataset;
}

// Scale scatter plot points to be spaced out better
// TODO: Generalise this to calculate the scaling factor
// based on range of values.

function scale(set) {
	for (var i = 0; i < set.length; i++) {
		set[i].x = (set[i].x + 5) * 50
		set[i].y = (set[i].y + 5) * 50
		// points[i][j] = (points[i][j] + 5) * 50;
	}
	return set
}

// For the time being, while the cross site access gets sorted,
// We will use dummy json files to emulate calls to the API
// This is the purpose of the function below.
var previousIndex;

function chooseRandDummyFile() {
	var pathArray = [];

	path1 = "json/dummy_points1.json";
	path2 = "json/dummy_points2.json";
	path3 = "json/dummy_points3.json";
	path4 = "json/dummy_points4.json";
	path5 = "json/dummy_points5.json";

	pathArray.push(path1);
	pathArray.push(path2);
	pathArray.push(path3);
	pathArray.push(path4);
	pathArray.push(path5);

	// Make sure we choose an index different to the last one.
	while (true) {
		index = Math.floor((Math.random() * 5) + 1);
		if (previousIndex != index) break;
	}

	previousIndex = index;
	// Adjust index for zero base
	index -= 1;

	if (DEBUG) console.log(index);

	return pathArray[index];

}

// Called when a slider is changed (see line: 13).
// ATM the JSON API is not used and is replaced with a few random JSON files of points.
// Also implements the transition between the old and new points in the scatter plot.

function update() {
	d3.json(chooseRandDummyFile(), function(json) {
		updatedData = new Array();
		points = json;
		updatedData = mergeJSON(updatedData);

		if (DEBUG) console.log(updatedData);

		// enter() and append() are omitted as we are using transision()
		svg.selectAll("circle")
			.data(scale(updatedData))
			.transition()
			.duration(1500)
			.attr("cx", function(d) {
			return d.x;
		})
			.attr("cy", function(d) {
			return d.y;
		})
			.style("stroke", "#000")
			.attr("r", function(d) {
			return 20;
		})
			.style("fill", function(d) {
			return d3.rgb(d.colour);
		});

		// Move the labels too
		updateLabels();

	});

}

// Called when the visualisation is first loaded.
// Binds the data to the circle svg elements and sets the attributes for a datum.

function plot() {
	entities = svg.selectAll("g")
		.data(scale(data))
		.enter()
		.append("g")
		.on("mouseover", function(d) {
		var sel = d3.select(this);
		sel.moveToFront();
		console.log(d.username);
	});

	entities.append("circle")
		.attr("cx", function(d) {
		return d.x;
	})
		.attr("cy", function(d) {
		return d.y;
	})
		.style("fill", function(d) {
		return d.colour;
	})
		.style("stroke", "#000")
		.style("stroke-width", 2 + "px")
		.transition()
		.duration(800)
		.attr("r", function(d) {
		return 20;
	});

	entities.append("text")
		.attr("dx", function(d) {
		if (is_firefox) return d.x * 2;
		else return d.x;
	})
		.attr("dy", function(d) {
		return d.y + 40;
	})
		.attr("font-family", "sans-serif")
		.attr("font-size", "13px")
		.style("text-anchor", "middle")
		.text(function(d) {
		return d.username;
	});
}

// Animates the labels

function updateLabels() {
	svg.selectAll("text")
		.data(updatedData)
		.transition()
		.duration(1500)
		.attr("dx", function(d) {
		if (is_firefox) return d.x * 2;
		return d.x;
	})
		.attr("dy", function(d) {
		return d.y + 40;
	})
		.attr("font-family", "sans-serif")
		.attr("font-size", "13px")
		.style("text-anchor", "middle")
		.text(function(d) {
		return d.username;
	});
}

// Prototype of moveToFront to move an obscured plot point to the front.
// See mouse over on line: 183
d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
	});
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~jQuery stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create tabs
$(function() {
	$("#tabs").tabs();
});

// Create sliders for the Areas tab with on stop callback to update the plot
$(function() {
	$("#slider1").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		update();
	});
	$("#slider2").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		update();
	});
	$("#slider3").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		update();
	});
	$("#slider4").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		update();
	});
	$("#slider5").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		update();
	});
});