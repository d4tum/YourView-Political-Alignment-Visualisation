// Constants
var w = 600;
var h = 600;
var svgPadding = 60;
var circleRaduis = 12;
var raduisShrinkage = 2;
var labelOffest = 25;

// Global vars
var data = []; // the  datajoin object for d3
var tags; // Tag wieghts for sliders
var users; // user data (index corresponds to that of points.json)
var points; // points (index corresponds to the users from user_data.json)

// For bug where text labels are only half their supposed x value
// See http://stackoverflow.com/questions/7000190/detect-all-firefox-versions-in-js
// for this solution.
var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

$(document).ready(function() {
	// jQuery stuff to build DOM from this script
	var widget = document.getElementById("yourview-visualization");
	var map = $("<div id='map'></div>");
	var controls = $("<div id='controls'></div>");

	map.appendTo(widget);
	controls.appendTo(widget);

	// Initiealise the controls; the tabs.

	function initControls() {
		var tabs = $("<div id='tabs' class='container'></div>");
		tabs.appendTo(controls);

		var ul = $("<ul></ul>");
		ul.appendTo(tabs);

		var li = $("<li></li>");
		li.appendTo(ul);

		var tab1Title = $("<a href='#tabs-1'>Areas</a>");
		tab1Title.appendTo(li);

		var li = $("<li></li>");
		li.appendTo(ul);

		var tab2Title = $("<a href='#tabs-2'>Entities</a>");
		tab2Title.appendTo(li);

		var tab1 = $("<div id='tabs-1' class='panel'></div>");
		tab1.appendTo(tabs);

		// Decribe the function of the tag weights to the user
		var sliderHeaderTitle = $("<p id='slider-header-title' ><--- Less --- IMPORTANT --- More ---></p>");
		sliderHeaderTitle.appendTo(tab1);

		// Tag weight sliders
		var sliders = [];
		for (var i = 0; i < tags.length; i++) {
			sliders.push($("<p>" + tags[i].name + "</p><div id='" + tags[i].id + "'></div>"));
			sliders[i].appendTo(tab1);

			$("#" + tags[i].id).slider({
				value: tags[i].weight,
				min: 0,
				max: 1,
				step: 0.25
			}).on("slidestop", function(event, ui) {
				// Find the id of the slider just changed
				var id = $(this).attr('id');
				// Set the tag weight to the value of the slider
				for (var j = 0; j < tags.length; j++) {
					if (tags[j].id == id) tags[j].weight = $(this).slider("value");
				}
				// Parse tags array into a string to append to the API url
				var str = "";
				for (var i = 0; i < tags.length; i++) {
					str += "&tag[" + tags[i].id + "]=" + tags[i].weight;
				};

				console.log(str);
				// make an ajax request
				// NYI: update in the callback, test on server
				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: 'http://staging.yourview.org.au/visualization/points.json?forum=1' + str,
					success: function(json) {
						points = scale(json);
						update();
					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log(textStatus, errorThrown);
					}
				});
			});
		}

		var tab2 = $("<div id='tabs-2' class='panel'></div>");
		tab2.appendTo(tabs);

		var table = $("<table></table>");
		table.appendTo(tab2);

		// Entity buttons
		var entities = [];
		for (var i = 0; i < users.length; i++) {

			var tr = $("<tr></tr>");
			tr.appendTo(table);

			var td = $("<td></td>");
			td.appendTo(tr);

			if (users[i].primary) var button = $("<button id='" + users[i].id + "' class='button'>" + users[i].username + "</button>");
			else var button = $("<button id='" + users[i].id + "' class='button'>" + users[i].username + "</button>").addClass("button_clicked");

			entities.push(button);
			entities[i].appendTo(td);

			$("#" + users[i].id).click(function() {
				var id = $(this).attr('id');
				for (var j = 0; j < users.length; j++) {
					if (users[j].id == id) {
						users[j].primary = !users[j].primary;
						if (users[j].primary) $(this).removeClass("button_clicked");
						else $(this).addClass("button_clicked");
						toggleEnitiy();

					}
				}

			});
		}

		$(function() {
			$("#tabs").tabs();
		});
	}

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~d3 stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	var svg = d3.select("#map")
		.append("svg")
		.attr("width", w)
		.attr("height", h);
		// .attr("pointer-events", "all")
		// .append('svg:g')
		// .call(d3.behavior.zoom().on("zoom", redraw))
		// .append('svg:g');

	// Zoom and pan logic
	// see - http://stackoverflow.com/questions/7871425/is-there-a-way-to-zoom-into-a-graph-layout-done-using-d3
	// svg.append('svg:rect')
	// 	.attr('width', w)
	// 	.attr('height', h)
	// 	.attr('fill', '#eeeeee');

	// Retrieve user data from user_data.json
	d3.json("http://staging.yourview.org.au/visualization/user_data.json?forum=1", function(json) {
	// d3.json("json/user_data.json", function(json) {
		users = json.users;
		tags = json.tags;
		initControls();
		initMap();
	});

	// function redraw() {
	// 	console.log("here", d3.event.translate, d3.event.scale);
	// 	svg.attr("transform",
	// 		"translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
	// }

	function initMap() {
		d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
		// d3.json("json/points.json", function(json) {
			points = scale(json);
			data = createData();
			draw();
		});
	}

	function scale(points) {
		var xs = [];
		var ys = [];

		for (var i = 0; i < points.length; i++) {
			xs.push(points[i][0]);
			ys.push(points[i][1]);
		}

		var xMin = d3.min(xs);
		var xMax = d3.max(xs);
		var yMin = d3.min(ys);
		var yMax = d3.max(ys);

		if (xMin < yMin) var min = xMin;
		else var min = yMin;

		if (xMax > yMax) var max = xMax;
		else var max = yMax;

		var linearScale = d3.scale.linear()
			.domain([min, max])
			.range([0 + svgPadding, w - svgPadding]);

		var scaledPoints = []
		for (var i = 0; i < points.length; i++) {
			xs[i] = linearScale(xs[i]);
			ys[i] = linearScale(ys[i]);
			scaledPoints.push([xs[i], ys[i]]);
		}

		return scaledPoints;
	}

	function createData() {
		var dataset = [];
		// Merge users with points into an object
		for (var i = 0; i < users.length; i++) {
			dataset.push({
				x: points[i][0],
				y: points[i][1],
				colour: users[i].colour,
				cred: users[i].cred,
				id: users[i].id,
				link: users[i].link,
				primary: users[i].primary,
				username: users[i].username
			});
		}

		return dataset;
	}

	var previousIndex;

	function chooseRandDummyFile() {
		var array = [];

		// path1 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points1.json";
		// path2 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points2.json";
		// path3 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points3.json";
		// path4 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points4.json";
		// path5 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points5.json";

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
			index = Math.floor((Math.random() * array.length) + 1);
			if (previousIndex != index) break;
		}

		previousIndex = index;
		return array[index - 1];
	}

	function sortPrimaryZBelow(a, b) {
		if (a.primary && !b.primary) return -1;
		else if (!a.primary && b.primary) return 1;
		else return 0;
	}

	function draw() {
		var g = svg.selectAll("g")
			.data(data)
			.enter()
			.append("g")
			.on("mouseover", function(d) {
			var sel = d3.select(this);
			sel.moveToFront();
			console.log(d.username);
		});

		g.append("circle")
			.attr("cx", function(d) {
			return d.x;
		})
			.attr("cy", function(d) {
			return d.y;
		})
			.style("opacity", function(d) {
			return 0.8;
		})
			.style("stroke", function(d, i) {
			if (users[i].primary) return "dark" + d.colour;
			else return "dimgrey";
		})
			.style("stroke-width", 1)
			.style("fill", function(d, i) {
			if (users[i].primary) return d.colour;
			return "grey";
		})
			.transition()
			.duration(700)
			.attr("r", function(d, i) {
			if (users[i].primary) return circleRaduis;
			else return circleRaduis - raduisShrinkage;
		});

		g.append("text")
			.attr("dx", function(d) {
			if (is_firefox) return d.x * 2;
			return d.x;
		})
			.attr("dy", function(d) {
			return d.y + labelOffest;
		})
			.attr("font-family", "sans-serif")
			.attr("font-size", "13px")
			.style("text-anchor", "middle")
			.text(function(d) {
			return d.username;
		});

		g.append("svg:title")
			.text(function(d) {
			return d.username;
		});

		svg.selectAll('text')
			.transition()
			.style("opacity", function(d, i) {
			if (users[i].primary) return 1.0;
			else return 0.0;
		});

	}

	function update() {
		// d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
		// d3.json(chooseRandDummyFile(), function(json) {
			
			// points = scale(json);
			// update datapoints
			data = createData();

			svg.selectAll("g")
				.data(data)
				.on("mouseover", function(d) {
				var sel = d3.select(this);
				sel.moveToFront();
				console.log(d.username);
			});
			// enter() and append() are omitted for a transision()
			svg.selectAll("circle")
				.data(data)
				.transition()
				.duration(1100)
				.attr("cx", function(d) {
				return d.x;
			})
				.attr("cy", function(d) {
				return d.y;
			})
				.attr("r", function(d, i) {
				if (users[i].primary) return circleRaduis;
				else return circleRaduis - raduisShrinkage;
			})
				.style("stroke", function(d, i) {
				if (users[i].primary) return "dark" + d.colour;
				else return "dimgrey";
			})
				.style("stroke-width", 1)
				.style("fill", function(d, i) {
				if (users[i].primary) return d.colour;
				return "grey";
			});


			svg.selectAll("text")
				.data(data)
				.transition()
				.duration(1100)
				.attr("dx", function(d) {
				if (is_firefox) return d.x * 2;
				return d.x;
			})
				.attr("dy", function(d) {
				return d.y + labelOffest;
			})
				.attr("font-family", "sans-serif")
				.attr("font-size", "13px")
				.style("text-anchor", "middle")
				.text(function(d) {
				return d.username;
			});

		// });
	}

	function toggleEnitiy() {

		// svg.selectAll('g')
		// 	.style("opacity", function(d, i) {
		// 	if (!visibility[i].isVisible) return 0.0;
		// 	else return 0.8;
		// });

		svg.selectAll('text')
			.transition()
			.style("opacity", function(d, i) {
			if (users[i].primary) return 1.0;
			else return 0.0;
		});

		svg.selectAll('circle')
			.transition()
			.duration(500)
			.attr("r", function(d, i) {
			if (users[i].primary) return circleRaduis;
			else return circleRaduis - raduisShrinkage;
		})
			.style("stroke", function(d, i) {
			if (users[i].primary && users[i].colour == "grey") return "dimgrey";
			else if (users[i].primary) return "dark" + d.colour;
			else return "dimgrey";
		})
			.style("stroke-width", 1)
			.style("fill", function(d, i) {
			if (users[i].primary) return d.colour;
			return "grey";
		});

		// svg.selectAll("g")
		// 	.on("mouseover", function(d) {
		// 	var sel = d3.select(this);
		// 	sel.moveToFront();
		// 	console.log(d.username);
		// });

	}

	d3.selection.prototype.moveToFront = function() {
		return this.each(function() {
			this.parentNode.appendChild(this);
		});
	};

});