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
 * Returns the "absolute" position (relative to the body) of the given element.
 * @param element as determined e.g. via document.getElementById()
 * @return {Array} left and top coordinates as an array's elements
 */
function getElementPosition(element) {
	var [left, top] = [0, 0];
	for (el = element; el; el = el.offsetParent) {
		[left, top] = [left + el.offsetLeft, top + el.offsetTop];
	}
	return [left, top];
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
		right: left+width,
		bottom: top+height,
		setLeft: function(newValue) {
			this.left = newValue;
			this.right = this.left + this.width;
		},
		setTop: function(newValue) {
			this.top = newValue;
			this.bottom = this.top + this.height;
		},
		setWidth: function(newValue) {
			this.width = newValue;
			this.right = this.left + this.width;
		},
		setHeight: function(newValue) {
			this.height = newValue;
			this.bottom = this.top + this.height;
		},
		setRight: function(newValue) {
			this.right = newValue;
			this.width = this.right - this.left;
		},
		setBottom: function(newValue) {
			this.bottom = newValue;
			this.height = this.bottom - this.top;
		}
	};
}

/**
 * Returns the "absolute" bounds (relative to the body) of the given element.
 * @param element as determined e.g. via document.getElementById()
 * @return {Object} bounds as the object's left, top, width, height, right, and bottom properties
 */
function getElementBounds(element) {
	var [left, top] = getElementPosition(element);
	return createRectangle(left, top, element.offsetWidth, element.offsetHeight);
}

/**
 * Initialises the random number generator with a given seed.
 * @param seed value for determination of the next random value
 */
function initRandomNumberGenerator(seed) {
	// currently not possible
}

/**
 * Returns a random number.
 * @return {Number} random number x where 0 <= x < 1.
 */
function getRandomNumber() {
	return Math.random();
}

/**
 * Returns a randomly generated integer value between the given
 * bounds.
 * @param lowerBound lower bound, inclusive
 * @param upperBound upper bound, exclusive
 * @return {Number} integer value
 */
function getRandomInteger(lowerBound, upperBound) {
	return lowerBound + Math.floor(getRandomNumber()*(upperBound-lowerBound));
}
