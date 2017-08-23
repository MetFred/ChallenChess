//import {appendCssFileToHead} from "tools";

/**
 * Initialises the document.
 * Evaluates the provided URL parameters (after '?'), such as
 * applying a specific style.
 */
function initDocument() {
	q = getQueryParametersDict();
	if (q.hasOwnProperty("style")) {
		appendCssFileToHead(q["style"]+".css");
	} else {
		appendCssFileToHead("classic.css");
	}
	window.setTimeout(initNewGame, 42);
}

/**
 * Opens the main menu of the game.
 * Meanwhile, the game will be faded out by activating the pause layer.
 */
function openMainMenu() {
	document.getElementById("main_menu").classList.remove("moved_out");
	document.getElementById("pause_layer").classList.add("faded");
}

/**
 * Closes the main menu and deactivates the pause layer.
 */
function closeMainMenu() {
	document.getElementById("main_menu").classList.add("moved_out");
	document.getElementById("pause_layer").classList.remove("faded");
}

/**
 * Default values for all game related attributes.
 */
const DEFAULT_OPTIONS = {"xFieldsMin": 8, "xFieldsMax": 8, "yFieldsMin": 8, "yFieldsMax": 8, "stepCountMin": 8, "stepCountMax": 8, "seed": null}

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

/**
 * Initialises a new game using the given options.
 * @param {Object} options if a specific option is not present here,
 *                         it will be taken from DEFAULT_OPTIONS
 */
function initNewGame(options={}) {
	var opts = mergeDicts(options, DEFAULT_OPTIONS);
	initChessboard(opts);
	generateRandomLevel(opts);
	showPotentialMovingTargets();
}

/**
 * Callback function for clicking a field on the chess board.
 * @param {Object} event click event
 */
function fieldClicked(event) {
}

/**
 * Initialises a chess board using the given options.
 * @param {Object} options if a specific option is not present here,
 *                         it will be taken from DEFAULT_OPTIONS
 */
function initChessboard(options) {
	var xFields = options.xFieldsMax;
	repositionChessboard();
	board = document.getElementById("board");
	board.innerHTML = "";  // alten Inhalt löschen
	board.classList.add("board"+xFields);
	var blackWhiteOffset = xFields % 2;  // Feld unten links muss schwarz werden
	for (var y = 0; y < xFields; ++y) {
		for (var x = 0; x < xFields; ++x) {
			var field = document.createElement("div");
			field.id = "field_"+x+"_"+y;
			field.classList.add("field");
			field.classList.add(((x+y+blackWhiteOffset)%2==0) ? "white" : "black");
			/*if (3 <= x && x <= 4 && 3 <= y && y <= 4) {
				field.classList.add("hidden");
			}*/
			field.onclick = fieldClicked;
			//field.innerHTML = x+";"+y;  //field.id;
			board.appendChild(field);
		}
	}
}

/**
 * Generates a random level using the given options.
 * @param {Object} options if a specific option is not present here,
 *                         it will be taken from DEFAULT_OPTIONS
 */
function generateRandomLevel(options) {
}

/**
 * Highlights those fields on the chess board which the player can
 * move to.
 */
function showPotentialMovingTargets() {
}

/**
 * Recomputes the position of the chess board, based on the current
 * document's size.
 * In particular, this should be done after the document or the whole
 * window has been resized.
 */
function repositionChessboard() {
	var boardAreaRect = getElementBounds(document.getElementById("board_area"));
	var boardRect = createRectangle();
	var size;
	if (boardAreaRect.width > boardAreaRect.height) {
		size = boardAreaRect.height;
		boardRect.setLeft(boardAreaRect.left + Math.floor(0.5*(boardAreaRect.width-size)));
		boardRect.setTop(boardAreaRect.top);
	} else {
		size = boardAreaRect.width;
		boardRect.setLeft(boardAreaRect.left);
		boardRect.setTop(boardAreaRect.top + Math.floor(0.5*(boardAreaRect.height-size)));
	}
	boardRect.setWidth(size);
	boardRect.setHeight(size);
	board = document.getElementById("board");
	board.style.position = "absolute";
	board.style.left = boardRect.left+"px";
	board.style.top = boardRect.top+"px";
	board.style.width = (boardRect.width-2)+"px";  // subtract border width
	board.style.height = (boardRect.height-2)+"px";  // subtract border width
	board.style.display = "grid";
}

/**
 * Recomputes the position of all figures which are currently placed
 * on the chess board.
 */
function repositionFigures() {
}

/**
 * Callback function for the resize event of the window or document.
 * Recomputes the position of the chess board and of all figures.
 * @param {Object} event resize event
 */
function documentResized(event) {
	repositionChessboard();
	repositionFigures();
}
