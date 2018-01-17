
/**
 * Square root of 2 as a constant to use for many calculations.
 */
const SQRT2 = Math.sqrt(2);

/**
 * Decodes window.location.search and returns the parameters as key value pairs.
 * @return {Object} dictionary (associative array) of key value pairs
 */
function getQueryParametersDict() {
	return window.location.search ? stringToDict(decodeURI(window.location.search.substring(1)),"&") : {};
}

/**
 * Decodes a given string and returns the key value pairs.
 * @param {String} s source string to be decoded
 * @param {String} pairSep separator string between the pairs, defaults to semicolon (";")
 * @param {String} keyValueSep separator string between key and value for each pair, defaults to equal sign ("=")
 * @return {Object} dictionary (associative array) of key value pairs
 */
function stringToDict(s, pairSep=";", keyValueSep="=") {
	result = {};
	if (s) {
		s.split(pairSep).forEach(function(pair) {
			pairList = pair.split(keyValueSep, 2);
			result[pairList[0]] = (pairList.length >= 2) ? pairList[1] : "";
		});
	}
	return result;
}

/**
 * Appends a new link tag to the HTML head, specifying the given stylesheet file.
 * @param {String} path path of the file, including the extension
 */
function appendCssFileToHead(path) {
	var linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	linkElement.type = "text/css";
	linkElement.href = path;
	document.getElementsByTagName("head")[0].appendChild(linkElement);
}

/**
 * List of CSS classes which have been added to the head.
 */
var additionalCssClassNames = [];

/**
 * Will add a new CSS class to the head if it has not already been
 * added.
 * @param {String} className the class name, e.g. "span.new"
 * @param {String} classStyleDefinition e.g. "color: black; font-weight: bold;"
 */
function addCssClassToHead(className, classStyleDefinition) {
	if (additionalCssClassNames.indexOf(className) < 0) {
		var style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = className + "{" + classStyleDefinition + "}";
		document.getElementsByTagName('head')[0].appendChild(style);
		additionalCssClassNames.push(className);
	} else {
		console.warn("Cannot add another CSS class \""+className+"\" to <head>, because this name has already been used.");
	}
}

/**
 * Returns the "absolute" position (relative to the body) of the given element.
 * @param DOM element as determined e.g. via document.getElementById()
 * @return {Object} object with left and top properties representing the element's position
 */
function getElementPosition(element) {
	var result = {left: 0, top: 0};
	for (el = element; el; el = el.offsetParent) {
		result.left += el.offsetLeft;
		result.top  += el.offsetTop;
	}
	return result;
}

/**
 * Creates a rectangle object which has the attributes left, top, right,
 * bottom, width, and height.
 * Setting values via the methods setLeft, setTop etc. automatically
 * adjusts the depending attributes.
 * @param {Number} left smallest x value of the rectangle
 * @param {Number} top smallest y value of the rectangle
 * @param {Number} width x span of the rectangle
 * @param {Number} height y span of the rectangle
 * @return {Object} rectangle object
 */
function createRectangle(left=0, top=0, width=0, height=0) {
	return {
		left: left,
		top: top,
		width: width,
		height: height,
		right: left + width - 1,
		bottom: top + height - 1,
		/**
		 * Moves the rectangle in x direction. right will also be changed. width stays the same.
		 * @param {Number} newValue new value for left
		 */
		setLeft: function(newValue) {
			this.left = newValue;
			this.right = this.left + this.width - 1;
		},
		/**
		 * Moves the rectangle in y direction. bottom will also be changed. height stays the same.
		 * @param {Number} newValue new value for top
		 */
		setTop: function(newValue) {
			this.top = newValue;
			this.bottom = this.top + this.height - 1;
		},
		/**
		 * Resizes the rectangle in x direction. right will be changed. left stays the same.
		 * @param {Number} newValue new value for width
		 */
		setWidth: function(newValue) {
			this.width = newValue;
			this.right = this.left + this.width - 1;
		},
		/**
		 * Resizes the rectangle in y direction. bottom will be changed. top stays the same.
		 * @param {Number} newValue new value for height
		 */
		setHeight: function(newValue) {
			this.height = newValue;
			this.bottom = this.top + this.height - 1;
		},
		/**
		 * Resizes the rectangle in x direction. width will be changed. left stays the same.
		 * @param {Number} newValue new value for right
		 */
		setRight: function(newValue) {
			this.right = newValue;
			this.width = this.right - this.left + 1;
		},
		/**
		 * Resizes the rectangle in y direction. height will be changed. top stays the same.
		 * @param {Number} newValue new value for bottom
		 */
		setBottom: function(newValue) {
			this.bottom = newValue;
			this.height = this.bottom - this.top + 1;
		},
		/**
		 * Checks whether a specified point lies within the rectangle or on its borders.
		 * @param {Number} x the horizontal position of the point
		 * @param {Number} y the vertical position of the point
		 * @return {Boolean} whether left <= x <= right and top <= y <= bottom
		 */
		isInside: function(x, y) {
			return isBetween(this.left, x, this.right) && isBetween(this.top, y, this.bottom);
		}
	};
}

/**
 * Returns the "absolute" bounds (relative to the body) of the given element.
 * @param DOM element as determined e.g. via document.getElementById()
 * @return {Object} bounds as the object's left, top, width, height, right, and bottom properties
 */
function getElementBounds(element) {
	var pos = getElementPosition(element);
	return createRectangle(pos.left, pos.top, element.offsetWidth, element.offsetHeight);
}

/**
 * Creates a new object to generate random numbers. If a seed is given the generated
 * numbers will be always the same  depending on the seed and the previous generated number.
 * @param seed value for determination of the next random value, if null it will be taken from Math.random()
 * @return {Object} random number generator with seed and function to get next random number
 */
function createRandomNumberGenerator(seed) {
	result = {
		seed: null,
	    number: null,
		/**
		 * Returns a randomly generated integer value between 0 (inclusive) and 1 (exclusive).
		 * @return {Number} integer value
		 */
		next: function () {
			this.number += this.number * SQRT2;
			this.number *= 1000;
			this.number -= Math.floor(this.number);
			return this.number;
		},
		/**
		 * Returns a randomly generated integer value between the given bounds.
		 * @param {Number} lowerBound lower bound, inclusive
		 * @param {Number} upperBound upper bound, exclusive
		 * @return {Number} integer value
		 */
		nextInt: function (lowerBound, upperBound) {
			return lowerBound + Math.floor(this.next() * (upperBound - lowerBound));
		},
		/**
		 * Returns a randomly generated Boolean value.
		 * @return {Boolean} true or false, randomly selected
		 */
		nextBoolean: function () {
			return this.next() < 0.5;
		},
		/**
		 * Returns a randomly selected element of a given array.
		 * @param {Array} array of elements
		 * @return {Object} element of the array which has been selected, or null if the array is empty
		 */
		nextArrayElement: function (array) {
			return (array.length >= 1 ? array[this.nextInt(0, array.length)] : null);
		},
		/**
		 * Returns a randomly selected value of a given object.
		 * @param {Object} object whose key/value pairs will be taken as a list for selection
		 * @return {Object} selected value, or null if the object is empty
		 */
		nextObjectEntry: function (object) {
			var key = this.nextArrayElement(Object.keys(object));
			return key == null ? [null, null] : [key, object[key]];
		}
	};
	var numericalSeed;
	if (seed == null || typeof seed === "undefined" || seed == "") {
		numericalSeed = Math.random();
	} else if (typeof seed === "number") {
		numericalSeed = seed;
	} else {
		numericalSeed = 1;
		var s = "" + seed;
		for (var i = 0; i < s.length; ++i) {
			numericalSeed = (numericalSeed * s.charCodeAt(i)) >> 4;
			if (numericalSeed > 1000000000) {
				numericalSeed >>= 4;
			}
		}
	}
	result.seed = numericalSeed;
	result.number = numericalSeed;
	return result;
}

/**
 * Tests whether a value lies between an upper and a lower bound.
 * @param {Number} lowerBound lower bound, inclusive
 * @param {Number} value check value
 * @param {Number} upperBound upper bound, inclusive
 * @return {Boolean} whether lowerBound <= value <= upperBound
 */
function isBetween(lowerBound, value, upperBound) {
	return (lowerBound <= value && value <= upperBound);
}

/**
 * Merges two dictionaries by creating a new one and copying all values
 * from both to the result.
 * @param {Object} values dictionary which values will be favoured
 * @param {Object} defaults dictionary which provides the values which
 *                          will be taken where values does not have
 *                          the corresponding attribute
 * @return {Object} combined dictionary
 */
function mergeDicts(values, defaults) {
	var result = {};
	for (var key in defaults) {
		result[key] = defaults[key];
	}
	for (var key in values) {
		result[key] = values[key];
	}
	return result;
}
