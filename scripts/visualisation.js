// Constants
var w = 600;
var h = 600;
var padding = 60;
var radius = 15;

// Global vars
var data = []; // the  datajoin object for d3
var tags; // Tag wieghts for sliders
var users; // user data (index corresponds to that of points.json)
var points; // points (index corresponds to the users from user_data.json)
var visibility = []; // Utitlity association array storing the state of an entitys visibility on the map

// For bug where text labels are only half their supposed x value
// See http://stackoverflow.com/questions/7000190/detect-all-firefox-versions-in-js
// for this solution.
var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

// Load each style sheet
var doc = document; // shortcut

// Pull in the main css file
var cssId = 'widgetCss';
if (!doc.getElementById(cssId)) {
	var head = doc.getElementsByTagName('head')[0];
	var link = doc.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	// link.href = 'https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/styles/widget.css';
	link.href = 'styles/widget.css';
	link.media = 'all';
	head.appendChild(link);
}

// Grab the theme css file
var cssId = 'themeCss';
if (!doc.getElementById(cssId)) {
	var head = doc.getElementsByTagName('head')[0];
	var link = doc.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	// link.href = 'https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/styles/absolution.css';
	link.href = 'styles/absolution.css';
	link.media = 'all';
	head.appendChild(link);
}

// Load jQuery.js using only JS
var jQueryUrl = '//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js';
var jQueryUiUrl = '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js';
var d3Url = 'http://d3js.org/d3.v2.js';

function loadScript(url, callback) {
	// adding the script tag to the head as suggested before
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;

	// then bind the event to the callback function 
	// there are several events for cross browser compatibility
	script.onreadystatechange = callback;
	script.onload = callback;

	// fire the loading
	head.appendChild(script);
}

var jQueryLoadedCallback = function() {
	loadScript(jQueryUiUrl, jQueryUILoadedCallback);
};

var jQueryUILoadedCallback = function() {
	loadScript(d3Url, d3LoadedCallback);
};

var d3LoadedCallback = function() {
	// Everything is loaded, ready to run the rest of the code
	$(document).ready(function() {
		// jQuery stuff to build DOM from this script
		var widget = document.getElementById("yourview-visualization");
		var plot = $("<div id='plot'></div>");
		var controls = $("<div id='controls'></div>");

		plot.appendTo(widget);
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

			// Add each slider from tags and set its callback function
			// TODO: 	- A POST request with all tags sent to the server for fresh points
			var sliders = [];
			for (var i = 0; i < tags.length; i++) {
				sliders.push($("<p>" + tags[i].name + "</p><div id='slider" + i + "'></div>"));
				sliders[i].appendTo(tab1);

				$("#slider" + i).slider({
					value: tags[i].weight,
					min: 0,
					max: 1,
					step: 0.2
				}).on("slidestop", function(event, ui) {
					translate();
				});
			}

			var tab2 = $("<div id='tabs-2' class='panel'></div>");
			tab2.appendTo(tabs);

			var table = $("<table></table>");
			table.appendTo(tab2);

			// Add each button from users and set its callback function
			// TODO: 	- This could probably be simplified
			//			- Checked/clicked state (using Checkbox button?)
			//			- Tranlate to links?
			var entities = [];
			for (var i = 0; i < users.length; i++) {

				var tr = $("<tr></tr>");
				tr.appendTo(table);

				var td = $("<td></td>");
				td.appendTo(tr);

				entities.push($("<button id='" + users[i].username + "' class='button'>" + users[i].username + "</button>").addClass("button_clicked"));
				entities[i].appendTo(td);

				$("#" + users[i].username).click(function() {
					var id = $(this).attr('id');
					for (var j = 0; j < visibility.length; j++) {
						if (visibility[j].username == id) {
							visibility[j].isVisible = !visibility[j].isVisible;
							if (visibility[j].isVisible) $(this).addClass("button_clicked");
							else $(this).removeClass("button_clicked");
							toggleVisible();
						}
					}

				});
			}

			$(function() {
				$("#tabs").tabs();
			});
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~d3 stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		var svg = d3.select("#plot")
			.append("svg")
			.attr("width", w)
			.attr("height", h);

		// Retrieve user data from user_data.json
		// d3.json("http://staging.yourview.org.au/visualization/user_data.json?forum=1", function(json) {
		d3.json("json/user_data.json", function(json) {
			users = json.users;
			tags = json.tags;
			initControls();
			initPlot();
		});

		function initPlot() {
			// d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
			d3.json("json/points.json", function(json) {
				points = scale(json);
				initVisible();
				data = createData();
				draw();
			});
		}

		function initVisible() {
			for (var i = 0; i < users.length; i++) {
				visibility.push({
					username: users[i].username,
					isVisible: true
				});
			}
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
				.range([0 + padding, w - padding]);

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
			console.log(array[index - 1]);
			return array[index - 1];
		}

		function draw() {
			var g = svg.selectAll("g")
				.data(data)
				.enter()
				.append("g")
				.style("opacity", function(d) {
				return 0.8;
			})
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
				.style("stroke", function(d) {
				return "dark" + d.colour;
			})
				.style("stroke-width", 2)
				.style("fill", function(d) {
				return d.colour;
			})
				.transition()
				.duration(700)
				.attr("r", function(d) {
				return radius;
			});

			g.append("svg:title")
				.text(function(d) {
				return d.username;
			});

			g.append("text")
				.attr("dx", function(d) {
				if (is_firefox) return d.x * 2;
				return d.x;
			})
				.attr("dy", function(d) {
				return d.y + 35;
			})
				.attr("font-family", "sans-serif")
				.attr("font-size", "13px")
				.style("text-anchor", "middle")
				.attr("class", "shadow")
				.text(function(d) {
				return d.username;
			});
		}

		function translate() {
			d3.json(chooseRandDummyFile(), function(json) {
				points = scale(json);
				// update datapoints
				data = createData();

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
					if (!visibility[i].isVisible) return radius - 5;
					else return radius;
				})
					.style("stroke", function(d, i) {
					if (!visibility[i].isVisible) return "dimgray";
					else return "dark" + d.colour;
				})
					.style("stroke-width", 2)
					.style("fill", function(d, i) {
					if (!visibility[i].isVisible) return "dimgraydimgray";
					return d.colour;
				})

				svg.selectAll("text")
					.data(data)
					.transition()
					.duration(1100)
					.attr("dx", function(d) {
					if (is_firefox) return d.x * 2;
					return d.x;
				})
					.attr("dy", function(d) {
					return d.y + 35;
				})
					.attr("font-family", "sans-serif")
					.attr("font-size", "13px")
					.style("text-anchor", "middle")
					.text(function(d) {
					return d.username;
				});

			});
		}

		function toggleVisible(visible) {

			// svg.selectAll('g')
			// 	.style("opacity", function(d, i) {
			// 	if (!visibility[i].isVisible) return 0.0;
			// 	else return 0.8;
			// });
			svg.selectAll('text')
				.transition()
				.style("opacity", function(d, i) {
				if (!visibility[i].isVisible) return 0.0;
				else return 0.8;
			});

			svg.selectAll('circle')
				.transition()
				.duration(500)
				.attr("r", function(d, i) {
				if (!visibility[i].isVisible) return radius - 5;
				else return radius;
			})
				.style("stroke", function(d, i) {
				if (!visibility[i].isVisible) return "dimgray";
				else return "dark" + d.colour;
			})
				.style("stroke-width", 2)
				.style("fill", function(d, i) {
				if (!visibility[i].isVisible) return "dimgray";
				return d.colour;
			});

		}

		d3.selection.prototype.moveToFront = function() {
			return this.each(function() {
				this.parentNode.appendChild(this);
			});
		};

	});
};

loadScript(jQueryUrl, jQueryLoadedCallback);