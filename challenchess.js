//import {appendCssFileToHead} from "tools";

/**
 * Margin to apply to figures.
 */
const FIGURE_MARGIN = 10;

/**
 * Enumeration of chess pieces.
 */
const FIGURE_ENUM = { PAWN: "pawn", ROOK: "rook", KNIGHT: "knight", BISHOP: "bishop", QUEEN: "queen", KING: "king" };

/**
 * Enumeration of chess colours.
 */
const COLOUR_ENUM = { WHITE: "white", BLACK: "black" };

/**
 * Enumeration of possible movements per chess piece.
 */
const MOVEMENT_ENUM = { "pawn":   [{deltaX: 0, deltaY: 1}],
	                    "rook":   [{deltaX: 0, deltaY: "n"}, {deltaX: "n", deltaY: 0}],
	                    "knight": [{deltaX: 1, deltaY: 2}, {deltaX: 1, deltaY: -2}, {deltaX: 2, deltaY: 1}, {deltaX: 2, deltaY: -1}, {deltaX: -1, deltaY: 2}, {deltaX: -1, deltaY: -2}, {deltaX: -2, deltaY: 1}, {deltaX: -2, deltaY: -1}],
	                    "bishop": [{deltaX: "n", deltaY: "n"}, {deltaX: "n", deltaY: "-n"}],
	                    "queen":  [{deltaX: 0, deltaY: "n"}, {deltaX: "n", deltaY: 0}, {deltaX: "n", deltaY: "n"}, {deltaX: "n", deltaY: "-n"}],
	                    "king":   [{deltaX: 0, deltaY: 1}, {deltaX: 0, deltaY: -1}, {deltaX: 1, deltaY: 1}, {deltaX: 1, deltaY: 0}, {deltaX: 1, deltaY: -1}, {deltaX: -1, deltaY: 1}, {deltaX: -1, deltaY: 0}, {deltaX: -1, deltaY: -1}] };

/**
 * Enumeration of possible movements for capturing an opponent's piece.
 * Only defines those movements which differ from MOVEMENT_ENUM.
 */
const CAPTURE_ENUM = { "pawn": [{deltaX: -1, deltaY: 1}, {deltaX: 1, deltaY: 1}] };

/**
 * Colour-based enumeration of directions.
 */
const MOVEMENT_DIRECTION_ENUM = { "white": 1, "black": -1 };

/**
 * The figure which the player can control.
 */
var currentFigure = null;

/**
 * The list of figures which appear in the game, including
 * currentFigure.
 */
var figureList = null;

/**
 * All chessboard fields in matrix notation, as [y, x],
 * y starting with 0 from the top,
 * x starting with 0 from the left.
 */
var fieldMatrix = null;

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
	repositionAllFigures();
	updatePossibleMoves();
}

/**
 * Callback function for clicking a field on the chess board.
 * @param {Object} field object
 */
function fieldClicked(field) {
	if (field.moveable) {
		moveCurrentFigureTo(field);
		updatePossibleMoves();
	}
}

function moveCurrentFigureTo(field) {
	currentFigure.x = field.x;
	currentFigure.y = field.y;
	repositionFigure(currentFigure, true);
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
	fieldMatrix = [];
	var blackWhiteOffset = xFields % 2;  // Feld unten links muss schwarz werden
	for (var y = 0; y < xFields; ++y) {
		fieldMatrix.push([]);
		for (var x = 0; x < xFields; ++x) {
			board.appendChild(createField(x, y, blackWhiteOffset).domElement);
		}
	}
}

function createField(x, y, blackWhiteOffset) {
	var result = {x: x,
		          y: y,
		          domElement: document.createElement("div"),
		          figure: null};
	result.onClick = function(e) {
		fieldClicked(result);
	};
	result.domElement.id = "field_"+x+"_"+y;
	result.domElement.classList.add("field");
	result.domElement.classList.add(((x+y+blackWhiteOffset)%2==0) ? "white" : "black");
	result.domElement.onclick = result.onClick;
	result.moveable = false;
	fieldMatrix[y].push(result);
	return result;
}

/**
 * Generates a random level using the given options.
 * @param {Object} options if a specific option is not present here,
 *                         it will be taken from DEFAULT_OPTIONS
 */
function generateRandomLevel(options) {
	figureList = [];
	rand = createRandomNumberGenerator(options.seed);
	currentFigure = createFigure({x: rand.nextInt(0, 8), y: rand.nextInt(0, 8), type: FIGURE_ENUM.KNIGHT, colour: COLOUR_ENUM.WHITE});
}

/**
 * Creates a new figure object using the given options.
 * Also the corresponding image will be inserted into the document.
 * The figure will also be added to the global figureList.
 * @param {Object} options attributes of the newly created figure, such
 *                 as x, y, type, colour
 * @return {Object} the new figure
 */
function createFigure(options) {
	var result = options;
	var boardArea = document.getElementById("board_area");
	var figure = document.createElement("img");
	result.domElement = figure;
	figure.classList.add("figure");
	figure.src = "img/" + result.type + "_" + result.colour + "_test.svg";
	boardArea.appendChild(figure);
	figureList.push(result);
	return result;
}

var oldMoves = null;

/**
 * Highlights those fields on the chess board which the player can
 * move to.
 */
function updatePossibleMoves() {
	if (oldMoves != null) {
		oldMoves.forEach(function (move) {
			fieldMatrix[move.y][move.x].domElement.classList.remove("possible_move");
			fieldMatrix[move.y][move.x].moveable = false;
		});
	}
	moves = getPossibleMoves();
	moves.forEach(function (move) {
		fieldMatrix[move.y][move.x].domElement.classList.add("possible_move");
		fieldMatrix[move.y][move.x].moveable = true;
	});
	oldMoves = moves;
}

function getPossibleMoves() {
	result = [];
	MOVEMENT_ENUM[currentFigure.type].forEach(function (move) {
		var newX = currentFigure.x + move.deltaX;
		var newY = currentFigure.y + move.deltaY;
		if (0 <= newX && newX < 8 && 0 <= newY && newY < 8) {
			result.push({x: newX, y: newY});
		}
	});
	return result;
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
function repositionAllFigures() {
	figureList.forEach(function(figure) {
		repositionFigure(figure);
	});
}

function repositionFigure(figure, smooth=false) {
	if ("domElement" in figure && figure.domElement != null) {
		if (smooth) {
			figure.domElement.classList.add("smooth_movement");
		} else {
			figure.domElement.classList.remove("smooth_movement");
		}
		var bounds = getElementBounds(fieldMatrix[figure.y][figure.x].domElement);
		figure.domElement.style.left = (bounds.left+FIGURE_MARGIN) + "px";
		figure.domElement.style.top = (bounds.top+FIGURE_MARGIN) + "px";
		figure.domElement.style.width = (bounds.width - 2*FIGURE_MARGIN) + "px";
		figure.domElement.style.height = (bounds.height - 2*FIGURE_MARGIN) + "px";
	}
}

/**
 * Callback function for the resize event of the window or document.
 * Recomputes the position of the chess board and of all figures.
 * @param {Object} event resize event
 */
function documentResized(event) {
	repositionChessboard();
	repositionAllFigures();
}
