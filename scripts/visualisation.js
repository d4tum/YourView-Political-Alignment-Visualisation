var w = 600
var h = 600
var range = 0;
var data = []; // the  datajoin object for d3
var tags; // Relates to sliders
var users; // user data (index corresponds to that of points.json)
var points; // points (index corresponds to that of user_data.users from user_data.json)
var visibility = []; // Utitlity assoc. array storing the state of en entitys visibility on the map
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
	link.href = 'https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/styles/widget.css';
	// link.href = 'styles/widget.css';
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
	link.href = 'https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/styles/absolution.css';
	// link.href = 'styles/absolution.css';
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
		var scatterplot = $("<div id='scatterplot'></div>");
		var controls = $("<div id='controls'></div>");

		scatterplot.appendTo(widget);
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

				console.log(tags[i].weight);
				$("#slider" + i).slider({
					value: tags[i].weight,
					min: 0,
					max: 1,
					step: 0.2
				}).on("slidestop", function(event, ui) {
					updatePlot();
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
							visibility[j].enabled = !visibility[j].enabled;
							//console.log(visibility[j].username + ", " + visibility[j].enabled);
							if (visibility[j].enabled) $(this).addClass("button_clicked");
							else $(this).removeClass("button_clicked");
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
		d3.json("http://staging.yourview.org.au/visualization/user_data.json?forum=1", function(json) {
		// d3.json("json/user_data.json", function(json) {
			users = json.users;
			tags = json.tags;
			initControls();
			initScatterplot();
		});

		function initScatterplot() {
			d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
			// d3.json("json/points.json", function(json) {
				points = json;
				initEntityVisiblity();
				findRange(points);
				data = createData();
				plotData();
			});
		}

		function initEntityVisiblity() {
			for (var i = 0; i < users.length; i++) {
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
			for (var i = 0; i < users.length; i++) {
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
			return dataset;
		}

		var previousIndex;

		function chooseRandDummyFile() {
			var array = [];

			path1 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points1.json";
			path2 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points2.json";
			path3 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points3.json";
			path4 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points4.json";
			path5 = "https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/json/dummy_points5.json";
			// path1 = "json/dummy_points1.json";
			// path2 = "json/dummy_points2.json";
			// path3 = "json/dummy_points3.json";
			// path4 = "json/dummy_points4.json";
			// path5 = "json/dummy_points5.json";

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
				.append("g");

			g.append("circle")
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
				.style("stroke", function(d) {
				return "dark" + d.colour;
			})
				.style("stroke-width", 2)
				.style("fill", function(d) {
				return d.colour;
			})
				.style("opacity", function(d) {
				return 0.7;
			})
				.transition()
				.duration(700)
				.attr("r", function(d) {
				return 15;
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

		function updatePlot() {
			d3.json(chooseRandDummyFile(), function(json) {
				points = json;
				findRange(points);
				data = scale(createData());

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
					.attr("r", function(d) {
					return 15;
				})
					.style("stroke", function(d) {
					return "dark" + d.colour;
				})
					.style("stroke-width", 2)
					.style("fill", function(d) {
					return d.colour;
				})
					.style("opacity", function(d) {
					return 0.7;
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
					return d.y + 35;
				})
					.attr("font-family", "sans-serif")
					.attr("font-size", "13px")
					.style("text-anchor", "middle")
					.attr("class", "shadow")
					.text(function(d) {
					return d.username;
				});

				console.log(data);
			});
		}

		function toggleEntityVisiblity(enable) {

			data = scale(createData());

			for (var i = 0; i < visibility.length; i++) {
				//console.log(data[i].username + i);
				console.log(visibility[i].username + i + ", " + visibility[i].enabled);
			}

			for (var i = 0; i < data.length; i++) {
				//console.log(data[i].username + i);
				console.log(data[i].username + i);
			}

			if (!enable) { // remove point
				svg.selectAll('g')
					.data(data, function(d) {
					return (d.username);
				})
					.exit()
					.transition()
					.duration(700)
					.attr("r", 0)
					.remove();

				svg.selectAll('circle')
					.data(data, function(d) {
					return (d.username);
				})
					.exit()
					.transition()
					.duration(700)
					.attr("r", 0)
					.remove();

				svg.selectAll('text')
					.data(data, function(d) {
					return (d.username);
				})
					.exit()
					.remove();

			} else { // add point
				var g = svg.selectAll("g")
					.data(data, function(d) {
					return (d.username);
				})
					.enter()
					.append("g");

				g.append('circle')
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
					.style("stroke", function(d) {
					return "dark" + d.colour;
				})
					.style("stroke-width", 2)
					.style("fill", function(d) {
					return d.colour;
				})
					.style("opacity", function(d) {
					return 0.7;
				})
					.transition()
					.duration(700)
					.attr("r", function(d) {
					return 15;
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

		}

		d3.selection.prototype.moveToFront = function() {
			return this.each(function() {
				this.parentNode.appendChild(this);
			});
		};

	});
};

loadScript(jQueryUrl, jQueryLoadedCallback);