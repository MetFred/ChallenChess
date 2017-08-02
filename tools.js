/**
 * Decodes window.location.search and returns the parameters as key value pairs.
 * @return {object} dictionary (associative array) of key value pairs
 */
function getQueryParametersDict() {
	return window.location.search ? stringToDict(decodeURI(window.location.search.substring(1)),"&") : {};
}

/**
 * Decodes a given string and returns the key value pairs.
 * @param {String} s source string to be decoded
 * @param {String} pairSep separator string between the pairs, defaults to semicolon (";")
 * @param {String} keyValueSep separator string between key and value for each pair, defaults to equal sign ("=")
 * @return {object} dictionary (associative array) of key value pairs
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
 * Returns the "absolute" bounds (relative to the body) of the given element.
 * @param element as determined e.g. via document.getElementById()
 * @return {object} bounds as the object's left, top, width, height, right, and bottom properties
 */
function getElementBounds(element) {
	var [left, top] = getElementPosition(element);
	return {left: left, top: top, width: element.offsetWidth, height: element.offsetHeight, right: left+element.offsetWidth, bottom: top+element.offsetHeight};
}
