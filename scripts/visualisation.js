// Constants
var w = 600;
var h = 600;
var svgPadding = 60;
var circleRaduis = 12;
var raduisShrinkage = 4;
var labelOffset = 25;

// Global vars
var data; // the  datajoin object for d3
var tags; // Tag wieghts for sliders
var userDict; // user data (index corresponds to that of points.json)
var pointDict; // points (index corresponds to the users from user_data.json)
var primaryFlags; // Dnother dictionary, key is the id, value is the boolean primary

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
		var sliderHeaderTitle = $("<p id='slider-header-title' ><-- Less -- IMPORTANT -- More --></p>");
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

				// DEBUG
				//console.log(str);

				// make an ajax request
				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: 'http://staging.yourview.org.au/visualization/points.json?forum=1&id_key=1' + str,
					success: function(json) {
						pointDict = scale(json);
						update();
					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log(textStatus, errorThrown);
					}
				});

				// update();
			});
		}

		var tab2 = $("<div id='tabs-2' class='panel'></div>");
		tab2.appendTo(tabs);

		var table = $("<table></table>");
		table.appendTo(tab2);

		// Entity buttons
		var entities = [];
		var i = 0;
		for (var key in userDict) {
			if (userDict.hasOwnProperty(key)) {

				var tr = $("<tr></tr>");
				tr.appendTo(table);

				var td = $("<td></td>");
				td.appendTo(tr);

				if (userDict[key].primary) {
					var button = $("<button id='" + key + "' class='button'>" + userDict[key].username + "</button>");

					// else var button = $("<button id='" + key + "' class='button'>" + userDict[key].username + "</button>").addClass("button_clicked");

					entities.push(button);
					entities[i].appendTo(td);
					i++;

					$("#" + key).click(function() {
						var id = $(this).attr('id');
						primaryFlags[id].primary = !primaryFlags[id].primary;
						if (primaryFlags[id].primary) $(this).removeClass("button_clicked");
						else $(this).addClass("button_clicked");
						toggleEnitiy();
					});
				}
			}
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
	// Zoom and pan stuff
	// .attr("pointer-events", "all")
	// .append('svg:g')
	// .call(d3.behavior.zoom().on("zoom", reenter))
	// .append('svg:g');

	// Zoom and pan logic
	// see - http://stackoverflow.com/questions/7871425/is-there-a-way-to-zoom-into-a-graph-layout-done-using-d3
	// svg.append('svg:rect')
	// 	.attr('width', w)
	// 	.attr('height', h)
	// 	.attr('fill', '#eeeeee');

	// Retrieve user data from user_data.json
	d3.json("http://staging.yourview.org.au/visualization/user_data.json?forum=1&id_key=1", function(json) {
	// d3.json("json/user_data_id_key.json", function(json) {
		userDict = json.users;
		tags = json.tags;
		initPrimaryFlags();
		initControls();
		initMap();
	});

	// Zoom and pan utility
	// function reenter() {
	// 	console.log("here", d3.event.translate, d3.event.scale);
	// 	svg.attr("transform",
	// 		"translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
	// }

	function initMap() {
		d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1&id_key=1", function(json) {
		// d3.json("json/points_id_key.json", function(json) {
			pointDict = scale(json);
			data = createData();
			enter();
		});
	}

	// Map the input domain given in the x and y coordunates 
	// to the output range defined by the width - padding
	// This coyld be done in enter/upade when setting x and y attributes.

	function scale(json) {
		var xs = [];
		var ys = [];

		for (var key in json) {
			if (json.hasOwnProperty(key)) {
				xs.push(json[key][0]);
				ys.push(json[key][1]);
			}
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

		var i = 0;
		for (var key in json) {
			if (json.hasOwnProperty(key)) {
				json[key][0] = linearScale(xs[i]);
				json[key][1] = linearScale(ys[i]);
				i++;
			}
		}

		return json;
	}

	// Set the boolean primary state array for all dots

	function initPrimaryFlags() {
		primaryFlags = {};
		for (var key in userDict) {
			if (userDict.hasOwnProperty(key)) {
				primaryFlags[key] = {
					primary: userDict[key].primary
				};
			}
		}
	}

	// Boolean function returns true if the dot is set to primary

	function isPrimary(d) {
		return primaryFlags[d.id].primary ? true : false;
	}

	// Combines user data and point data into the d3 data object.

	function createData() {
		var dataset = [];
		for (var key in userDict) {
			if (userDict.hasOwnProperty(key)) {
				dataset.push({
					x: pointDict[key][0],
					y: pointDict[key][1],
					colour: userDict[key].colour,
					cred: userDict[key].cred,
					id: key,
					link: userDict[key].link,
					primary: userDict[key].primary,
					username: userDict[key].username
				});
			}
		}

		return dataset;
	}

	// Used for testing
	var previousIndex;

	function chooseRandDummyFile() {
		var array = [];

		// path1 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points1.json";
		// path2 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points2.json";
		// path3 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points3.json";
		// path4 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points4.json";
		// path5 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points5.json";

		path1 = "json/points_id_key1.json";
		path2 = "json/points_id_key2.json";
		path3 = "json/points_id_key3.json";
		// path4 = "json/dummy_points4.json";
		// path5 = "json/dummy_points5.json";

		array.push(path1);
		array.push(path2);
		array.push(path3);
		// array.push(path4);
		// array.push(path5);

		// Make sure we choose an index different to the last one.
		while (true) {
			index = Math.floor((Math.random() * array.length) + 1);
			if (previousIndex != index) break;
		}

		previousIndex = index;
		console.log(array[index - 1]);
		return array[index - 1];
	}

	// An Aattempt at setting a higher z-order for grey dots
	// function sortPrimaryZBelow(a, b) {
	// 	if (a.primary && !b.primary) return -1;
	// 	else if (!a.primary && b.primary) return 1;
	// 	else return 0;
	// }

	// Key function
	// see - http://bost.ocks.org/mike/selection/#key

	function id(d) {
		return d.id;
	}

	// Called by sort() to order grey dots ontop of coloured dots

	function primaryUnderneath(a, b) {
		return d3.descending(isPrimary(a), isPrimary(b));
	}

	// The d3 enter event wrapper.
	// This is called only once, after the page is first loaded
	// Not a remove event is not used in this script.

	function enter() {
		var g = svg.selectAll("g")
			.data(data, id)
			.enter()
			.append("g")
			.order(primaryUnderneath)
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
			return 0.7;
		})
			.style("stroke", function(d) {
			if (isPrimary(d)) return "dark" + d.colour;
			else return "dimgrey";
		})
			.style("stroke-width", 1)
			.style("fill", function(d) {
			if (isPrimary(d)) return d.colour;
			return "grey";
		})
			.transition()
			.duration(700)
			.attr("r", function(d, i) {
			if (isPrimary(d)) return circleRaduis;
			else return circleRaduis - raduisShrinkage;
		});

		g.append("text")
			.attr("dx", function(d) {
			if (is_firefox) return d.x * 2;
			return d.x;
		})
			.attr("dy", function(d) {
			return d.y + labelOffset;
		})
			.attr("font-family", "sans-serif")
			.attr("font-size", "13px")
			.style("opacity", function(d) {
			if (isPrimary(d)) return 1.0;
			else return 0.0;
		})
			.style("text-anchor", "middle")
			.text(function(d) {
			return d.username;
		});

		g.append("svg:title")
			.text(function(d) {
			return d.username;
		});

	}

	// The d3 update event wrapper.
	// This is called on subsequent updates of points from changing the sliders.

	function update() {
		// Testing stuff
		// d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
		// d3.json(chooseRandDummyFile(), function(json) {

			// pointDict = scale(json);

			// Update the data with new points
			data = createData();

			svg.selectAll("g")
				.data(data, id)
				.sort(primaryUnderneath)
				.on("mouseover", function(d) {
				var sel = d3.select(this);
				sel.moveToFront();
				console.log(d.username);
			});

			// enter() and append() are omitted for a transision
			svg.selectAll("circle")
				.data(data, id)
				.transition()
				.duration(1100)
				.attr("cx", function(d) {
				return d.x;
			})
				.attr("cy", function(d) {
				return d.y;
			})
				.attr("r", function(d) {
				if (isPrimary(d)) return circleRaduis;
				else return circleRaduis - raduisShrinkage;
			})
				.style("stroke", function(d) {
				if (isPrimary(d)) return "dark" + d.colour;
				else return "dimgrey";
			})
				.style("stroke-width", 1)
				.style("fill", function(d) {
				if (isPrimary(d)) return d.colour;
				return "grey";
			});

			svg.selectAll("text")
				.data(data, id)
				.transition()
				.duration(1100)
				.attr("dx", function(d) {
				if (is_firefox) return d.x * 2;
				return d.x;
			})
				.attr("dy", function(d) {
				return d.y + labelOffset;
			})
				.attr("font-family", "sans-serif")
				.attr("font-size", "13px")
				.style("text-anchor", "middle")
				.text(function(d) {
				return d.username;
			});

		// });
	}

	// This is Called when buttons are toggled un the entity tab

	function toggleEnitiy() {

		// svg.selectAll('g')
		// 	.style("opacity", function(d, i) {
		// 	if (!visibility[i].isVisible) return 0.0;
		// 	else return 0.8;
		// });

		// Set the dot to grey and smaller when not primary
		svg.selectAll('circle')
			.transition()
			.duration(500)
			.attr("r", function(d) {
			if (isPrimary(d)) return circleRaduis;
			else return circleRaduis - raduisShrinkage;
		})
			.style("stroke", function(d) {
			if ((isPrimary(d)) && d.colour == "grey") return "dimgrey";
			else if (isPrimary(d)) {
				return "dark" + d.colour;
			} else {
				return "dimgrey";
			}
		})
			.style("stroke-width", 1)
			.style("fill", function(d) {
			if (isPrimary(d)) return d.colour;
			else return "grey";
		});

				// Hide the text if it dot is not a primary
		svg.selectAll('text')
			.transition()
			.duration(500)
			.style("opacity", function(d) {
			if (isPrimary(d)) return 1.0;
			else return 0.0;
		});


		svg.selectAll('g')
			.sort(primaryUnderneath);
		// svg.selectAll("g")
		// 	.on("mouseover", function(d) {
		// 	var sel = d3.select(this);
		// 	sel.moveToFront();
		// 	console.log(d.username);
		// });

	}

	// Brings the dot being hovered over to the front
	d3.selection.prototype.moveToFront = function() {
		return this.each(function() {
			this.parentNode.appendChild(this);
		});
	};

});