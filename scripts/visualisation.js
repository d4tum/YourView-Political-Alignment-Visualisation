var w = 600
var h = 600
var range = 0;
var data = []; // datapoints - an array of json objects
var tags;
var users; // user data from the user_data.json file
var points; // points of the points.json file
var visibility = []; // Association array describing which entities are visible

// Load all style sheets
var doc = document; // shortcut

var cssId = 'widgetCss'; // you could encode the css path itself to generate id..
if (!doc.getElementById(cssId)) {
	var head = doc.getElementsByTagName('head')[0];
	var link = doc.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	// link.href = 'https://raw.github.com/qubz/qubz.github.io/master/styles/widget.css';
	link.href = 'styles/widget.css';
	link.media = 'all';
	head.appendChild(link);
}

var cssId = 'themeCss'; // you could encode the css path itself to generate id..
if (!doc.getElementById(cssId)) {
	var head = doc.getElementsByTagName('head')[0];
	var link = doc.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	// link.href = 'https://raw.github.com/qubz/qubz.github.io/master/styles/absolution.css';
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
		// jQuery stuff to build DOM
		// body
		//1. 	|---widget
		//2.			|---scatterplot
		//3.			|---controls
		//4.					|---tabs
		//5.						|---tabs-1
		//								
		//6.						|---tabs-2

		//1.
		var widget = document.getElementById("yourview-visualization");
		var scatterplot = $("<div id='scatterplot'></div>");
		var controls = $("<div id='controls'></div>");

		scatterplot.appendTo(widget);
		controls.appendTo(widget);

		function initControls() {
			//4.
			var tabs = $("<div id='tabs' class='container'></div>");
			tabs.appendTo(controls);

			var ul = $("<ul></ul>");
			ul.appendTo(tabs);

			var li = $("<li></li>");
			li.appendTo(ul);

			//5.
			var tab1Title = $("<a href='#tabs-1'>Areas</a>");
			tab1Title.appendTo(li);

			var li = $("<li></li>");
			li.appendTo(ul);

			//6.
			var tab2Title = $("<a href='#tabs-2'>Entities</a>");
			tab2Title.appendTo(li);

			var tab1 = $("<div id='tabs-1' class='panel'></div>");
			tab1.appendTo(tabs);

			var sliders = [];
			for (var i = 0; i < tags.length; i++) {
				sliders.push($("<p>" + tags[i].name + "</p><div id='slider" + i + "'></div>"));
				sliders[i].appendTo(tab1);

				$("#slider" + i).slider().slider("option", "min", -1).slider({
					max: 1
				}).on("slidestop", function(event, ui) {
					updatePlot();
					console.log("updatePlot called");
				});
			}

			var tab2 = $("<div id='tabs-2' class='panel'></div>");
			tab2.appendTo(tabs);

			var entities = [];
			for (var i = 0; i < users.length; i++) {
				entities.push($("<button id='" + users[i].username + "'>" + users[i].username + "</button>"));
				entities[i].appendTo(tab2);

				$("#" + users[i].username).click(function() {
					var id = $(this).attr('id');
					for (var j = 0; j < visibility.length; j++) {
						if (visibility[j].username == id) {
							visibility[j].enabled = !visibility[j].enabled;
							toggleEntityVisiblity(visibility[j].enabled);
						}
					}

				});
			}

			$(function() {
				$("#tabs").tabs();
			});
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~d3 stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		var svg = d3.select("#scatterplot")
			.append("svg")
			.attr("width", w)
			.attr("height", h);

		// Retrieve user data from user_data.json
		// d3.json("http://staging.yourview.org.au/visualization/user_data.json?forum=1", function(json) {
		d3.json("json/user_data.json", function(json) {
			users = json.users;
			tags = json.tags;
			initControls();
			initScatterplot(users);
		});

		function initScatterplot(users) {
			// d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
			d3.json("json/points.json", function(json) {
				points = json;
				initEntityVisiblity();
				findRange(points);
				data = createData();
				plotData();
			});
		}

		function initEntityVisiblity() {
			for (var i = 0; i < points.length; i++) {
				visibility.push({
					username: users[i].username,
					enabled: true
				});
			}
		}

		Array.max = function(array) {
			return Math.max.apply(Math, array);
		};

		Array.min = function(array) {
			return Math.min.apply(Math, array);
		};

		function findRange(points) {
			var xs = [];
			var ys = [];

			for (var i = 0; i < points.length; i++) {
				xs.push(points[i][0]);
				ys.push(points[i][1]);
			}

			var xRange = Array.max(xs) - Array.min(xs);
			var yRange = Array.max(ys) - Array.min(ys);

			if (xRange > yRange) range = Math.ceil(xRange) + 2;
			else range = Math.ceil(yRange) + 2;
		}

		function createData() {
			var dataset = [];
			// Add the users to the points
			for (var i = 0; i < points.length; i++) {
				if (visibility[i].enabled) {
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
			}

			return dataset;
		}

		function scale(dataset) {
			for (var i = 0; i < dataset.length; i++) {
				dataset[i].x = (dataset[i].x + (range / 2)) * 50;
				dataset[i].y = (dataset[i].y + (range / 2)) * 50;
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
			return array[index - 1];
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
			d3.json("json/points.json", function(json) {
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

		function toggleEntityVisiblity(enable) {

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
				})
					.enter()
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

		}

		d3.selection.prototype.moveToFront = function() {
			return this.each(function() {
				this.parentNode.appendChild(this);
			});
		};

	});
};

loadScript(jQueryUrl, jQueryLoadedCallback);