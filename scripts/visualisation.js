// ~~~~~~~~~~~~~~~~~~~~~~~~~~d3 stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var w = 600
var h = 600
var range = 0;
var data = []; // datapoints - an array of json objects
var points; // points of the points.json file
var userdata; // user data from the user_data.json file
var visibility = []; // Association array describing which entities are visible

var svg = d3.select("#scatterplot")
	.append("svg")
	.attr("width", w)
	.attr("height", h);

// Retrieve user data from userdata.json
d3.json("json/user_data.json", function(json) {
	userdata = json;
	retrievePoints(userdata);
});

function retrievePoints(userdata) {
	d3.json("json/points.json", function(json) {
		points = json;
		initVisiblityArray();
		findRange(points);
		data = createData();
		plotData();
	});
}

function initVisiblityArray() {
	for (var i = 0; i < points.length; i++) {
		visibility.push({
			username: userdata[i].username,
			enabled: true
		});
	}
	console.log(visibility);
}

Array.max = function( array ){
    return Math.max.apply( Math, array );
};
 
Array.min = function( array ){
    return Math.min.apply( Math, array );
};

function findRange (points) {
	var xs = [];
	var ys = [];

	for (var i = 0; i < points.length; i++) {
		xs.push(points[i][0]);
		ys.push(points[i][1]);
	}

	var xRange = Array.max(xs) - Array.min(xs);
	var yRange = Array.max(ys) - Array.min(ys);
	
	if (xRange > yRange)
		range = Math.ceil(xRange) + 2;
	else
		range = Math.ceil(yRange) + 2;
}

function createData() {
	var dataset = [];
	// Add the user data to the points
	for (var i = 0; i < points.length; i++) {
		if (visibility[i].enabled) {
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
	}

	return dataset;
}

function scale(dataset) {
	for (var i = 0; i < dataset.length; i++) {
		dataset[i].x = (dataset[i].x + (range/2)) * 50;
		dataset[i].y = (dataset[i].y + (range/2)) * 50;
		// points[i][j] = (points[i][j] + 5) * 50;
	}
	return dataset
}

var previousIndex;

function chooseRandDummyFile() {
	var array = [];

	path1 = "json/dummy_points1.json";
	path2 = "json/dummy_points2.json";
	path3 = "json/dummy_points3.json";
	path4 = "json/dummy_points4.json";
	path5 = "json/dummy_points5.json";

	array.push(path1);
	array.push(path2);
	array.push(path3);
	array.push(path4);
	array.push(path5);

	// Make sure we choose an index different to the last one.
	while (true) {
		index = Math.floor((Math.random() * 5) + 1);
		if (previousIndex != index) break;
	}

	previousIndex = index;
	// Adjust index for zero base
	index -= 1;

	return array[index];
}

function plotData() {
	var g = svg.selectAll("g")
		.data(scale(data)).enter()
		.append("g")
		.on("mouseover", function(d) {
		var sel = d3.select(this);
		sel.moveToFront();
		console.log(d.username);
	})

	var circle = g.append("circle")
		.attr("cx", function(d) {
		return d.x;
	})
		.attr("cy", function(d) {
		return d.y;
	})
		.style("fill", function(d) {
		return d.colour;
	})
		.transition()
		.duration(700)
		.attr("r", function(d) {
		return 15;
	});

	g.append("svg:title").text(function(d) {
		return d.username;
	});
}

function updatePlot() {
	d3.json(chooseRandDummyFile(), function(json) {
		points = json;
		findRange(points);
		data = createData();

		// enter() and append() are omitted for a transision()
		svg.selectAll("circle")
			.data(scale(data))
			.transition()
			.duration(1100)
			.attr("cx", function(d) {
			return d.x;
		})
			.attr("cy", function(d) {
			return d.y;
		})
			.attr("r", function(d) {
			return 15;
		})
			.style("fill", function(d) {
			return d3.rgb(d.colour);
		});
	});
}

function toggleEntity(enable) {

	data = createData();

	if (!enable) {
		svg.selectAll('circle')
			.data(scale(data), function(d) {
			return (d.username);
		})
			.exit().transition()
			.attr("r", 0)
			.remove();
	} else {
		svg.selectAll("circle")
			.data(scale(data), function(d) {
			return (d.username);
		}).enter()
			.append("circle")
			.on("mouseover", function(d) {
			var sel = d3.select(this);
			sel.moveToFront();
			console.log(d.username);
		})
			.attr("cx", function(d) {
			return d.x;
		})
			.attr("cy", function(d) {
			return d.y;
		})
			.style("fill", function(d) {
			return d.colour;
		})
			.transition()
			.duration(700)
			.attr("r", function(d) {
			return 15;
		});
	}


	console.log(data);

}

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
		updatePlot();
	});
	$("#slider2").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		updatePlot();
	});
	$("#slider3").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		updatePlot();
	});
	$("#slider4").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		updatePlot();
	});
	$("#slider5").slider().slider("option", "min", -1).slider({
		max: 1
	}).on("slidestop", function(event, ui) {
		updatePlot();
	});
});

// 1. find the username of the circle clicked
// 2. toggle it's enabled state
// 3. create a new data array bad bind it to circle
// 4. call exit().remove()
// see - http://mbostock.github.io/d3/tutorial/circle.html
$(function() {
	$("#button1").click(function() {
		for (var i = 0; i < visibility.length; i++) {
			if (visibility[i].username == 'Liberals') {
				console.log(visibility[i].enabled);
				visibility[i].enabled = !visibility[i].enabled;
				toggleEntity(visibility[i].enabled);
			}
		}

	});
});

$(function() {
	$("#button2").click(function() {

		for (var i = 0; i < visibility.length; i++) {
			if (visibility[i].username == 'Labor') {
				console.log(visibility[i].enabled);
				visibility[i].enabled = !visibility[i].enabled;
				console.log(visibility[i].enabled);
				toggleEntity(visibility[i].enabled);
			}
		}

	});
});

$(function() {
	$("#button3").click(function() {

		for (var i = 0; i < visibility.length; i++) {
			if (visibility[i].username == 'Greens') {
				console.log(visibility[i].enabled);
				visibility[i].enabled = !visibility[i].enabled;
				toggleEntity(visibility[i].enabled);
			}
		}

	});
});

$(function() {
	$("#button4").click(function() {

		for (var i = 0; i < visibility.length; i++) {
			if (visibility[i].username == 'Nationals') {
				console.log(visibility[i].enabled);
				visibility[i].enabled = !visibility[i].enabled;
				toggleEntity(visibility[i].enabled);
			}
		}

	});
});

$(function() {
	$("#button5").click(function() {

		for (var i = 0; i < visibility.length; i++) {
			if (visibility[i].username == 'timvangelder') {
				console.log(visibility[i].enabled);
				visibility[i].enabled = !visibility[i].enabled;
				toggleEntity(visibility[i].enabled);
			}
		}

	});
});