//import {appendCssFileToHead} from "tools";

/**
 * Margin to apply to figures.
 */
const FIGURE_MARGIN = 10;

/**
 * Enumeration of chess pieces.
 */
const FIGURE_ENUM = { "PAWN": "pawn", "ROOK": "rook", "KNIGHT": "knight", "BISHOP": "bishop", "QUEEN": "queen", "KING": "king" };

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

const CAPTURE_MOVEMENT_ENUM = mergeDicts(CAPTURE_ENUM, MOVEMENT_ENUM);

/**
 * Colour-based enumeration of directions.
 */
const MOVEMENT_DIRECTION_ENUM = { "white": -1, "black": 1 };

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
 * Determines whether a specified position lies within the chess board's
 * field matrix.
 * @param {Number} x column position, starting from 0
 * @param {Number} y row position, starting from 0
 * @return {Boolean} whether the position lies within the field matrix
 */
function isPositionInField(x, y) {
	return (fieldMatrix != null && isBetween(0, x, fieldMatrix[0].length-1) && isBetween(0, y, fieldMatrix.length-1));
}

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
		var figureOnTargetField = fieldMatrix[field.y][field.x].figure;
		moveCurrentFigureTo(field);
		clearPossibleMoves();
		window.setTimeout(function() {
			moveEnded(figureOnTargetField);
			updatePossibleMoves();
		}, 750);
	}
}

function moveCurrentFigureTo(field) {
	fieldMatrix[currentFigure.y][currentFigure.x].figure = null;
	currentFigure.x = field.x;
	currentFigure.y = field.y;
	fieldMatrix[currentFigure.y][currentFigure.x].figure = currentFigure;
	repositionFigure(currentFigure, true);
}

function moveEnded(figureOnTargetField) {
	if (currentFigure != null) {
		if (figureOnTargetField != null) {
			removeFigure(currentFigure);
			currentFigure = figureOnTargetField;
		}
		currentFigure.domElement.classList.remove("walking");
		currentFigure.domElement.classList.add("swinging");
	}
}

function removeFigure(figure) {
	if (figure != null) {
		fieldMatrix[figure.y][figure.x].figure = null;
		var boardArea = document.getElementById("board_area");
		boardArea.removeChild(figure.domElement);
	}
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
	var rand = createRandomNumberGenerator(options.seed);
	var currentField = fieldMatrix[rand.nextInt(0, fieldMatrix.length)][rand.nextInt(0, fieldMatrix[0].length)];
	var currentColour = COLOUR_ENUM.BLACK;
	var stepCount = rand.nextInt(options.stepCountMin, options.stepCountMax);
	figureList = [];
	currentField.domElement.classList.add("target_field");
	createFigure({x: currentField.x, y: currentField.y, type: FIGURE_ENUM.KING, colour: currentColour});
	for (var i=0;i<stepCount;++i) {
		var possibleMoves = [];
		Object.values(FIGURE_ENUM).forEach(function (figureType) {
			getPossibleMoves(currentField, figureType, currentColour, CAPTURE_MOVEMENT_ENUM, false).forEach(function (possibleMove) {
				possibleMoves.push(possibleMove);
			});
		});
		var reducedMoves = []
		if (possibleMoves.length > 0) {
			var figureType = possibleMoves[0].figureType;
			var iFrom = 0;
			var iTo = 0;
			possibleMoves.forEach(function (move, i) {
				if (move.figureType != figureType) {
					iTo = i;
					reducedMoves.push(possibleMoves[rand.nextInt(iFrom, iTo)]);
					iFrom = i;
					figureType = move.figureType;
				}
			});
			reducedMoves.push(possibleMoves[rand.nextInt(iFrom, possibleMoves.length)]);
		}
		if (reducedMoves.length == 0) {
			return;
		}
		var move = reducedMoves[rand.nextInt(0, reducedMoves.length)];
		currentField = fieldMatrix[move.y][move.x];
		currentColour = (currentColour == COLOUR_ENUM.BLACK ? COLOUR_ENUM.WHITE : COLOUR_ENUM.BLACK);
		createFigure({x: currentField.x, y: currentField.y, type: move.figureType, colour: currentColour});
	}
	currentField.domElement.classList.add("start_field");
	currentFigure = fieldMatrix[currentField.y][currentField.x].figure;
	currentFigure.domElement.classList.add("current_figure");
	currentFigure.domElement.classList.add("swinging");
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
	fieldMatrix[options.y][options.x].figure = result;
	return result;
}

var oldMoves = null;

function clearPossibleMoves() {
	if (oldMoves != null) {
		oldMoves.forEach(function (move) {
			fieldMatrix[move.y][move.x].domElement.classList.remove("possible_move");
			fieldMatrix[move.y][move.x].moveable = false;
		});
	}
}

/**
 * Highlights those fields on the chess board which the player can
 * move to.
 */
function updatePossibleMoves() {
	clearPossibleMoves();
	moves = getPossibleMoves(currentFigure, currentFigure.type, currentFigure.colour, CAPTURE_MOVEMENT_ENUM, true);
	moves.forEach(function (move) {
		fieldMatrix[move.y][move.x].domElement.classList.add("possible_move");
		fieldMatrix[move.y][move.x].moveable = true;
	});
	oldMoves = moves;
}

function getPossibleMoveFields(x, y, dx, dy, figureType, figureColour) {
	var result = [];
	var mx = x + dx;
	var my = y + dy;
	while (isPositionInField(mx, my) && fieldMatrix[my][mx].figure == null) {
		result.push({x: mx, y: my, figureType: figureType});
		mx = mx + dx;
		my = my + dy;
	}
	return result;
}

function getPossibleCaptureFields(x, y, dx, dy, figureType, figureColour) {
	var result = [];
	var mx = x + dx;
	var my = y + dy;
	while (isPositionInField(mx, my)) {
		var otherFigure = fieldMatrix[my][mx].figure;
		if (otherFigure != null) {
			if (otherFigure.colour != figureColour) {
				result.push({x: mx, y: my, figureType: figureType});
			}
			break;
		}
		mx = mx + dx;
		my = my + dy;
	}
	return result;
}

function getPossibleMoves(field, figureType, figureColour, movementDefinitions, capturing) {
	result = [];
	var moveFunction = capturing ? getPossibleCaptureFields : getPossibleMoveFields;
	movementDefinitions[figureType].forEach(function (move) {
		var dir = MOVEMENT_DIRECTION_ENUM[figureColour];
		if (move.deltaX == 'n' && move.deltaY == 'n') {
			result = result.concat(moveFunction(field.x, field.y,  1,  dir, figureType, figureColour));
			result = result.concat(moveFunction(field.x, field.y, -1, -dir, figureType, figureColour));
		} else if ((move.deltaX == 'n' && move.deltaY == '-n') || (move.deltaX == '-n' && move.deltaY == 'n')) {
			result = result.concat(moveFunction(field.x, field.y,  1, -dir, figureType, figureColour));
			result = result.concat(moveFunction(field.x, field.y, -1,  dir, figureType, figureColour));
		} else if (move.deltaX == 'n') {
			result = result.concat(moveFunction(field.x, field.y,  1, 0, figureType, figureColour));
			result = result.concat(moveFunction(field.x, field.y, -1, 0, figureType, figureColour));
		} else if (move.deltaY == 'n') {
			result = result.concat(moveFunction(field.x, field.y, 0,  dir, figureType, figureColour));
			result = result.concat(moveFunction(field.x, field.y, 0, -dir, figureType, figureColour));
		} else {
			var mx = field.x + move.deltaX;
			var my = field.y + dir*move.deltaY;
			if (isPositionInField(mx, my)) {
				var otherFigure = fieldMatrix[my][mx].figure;
				if (capturing) {
					if (otherFigure != null && otherFigure.colour != figureColour) {
						result.push({x: mx, y: my, figureType: figureType});
					}
				} else {
					if (otherFigure == null) {
						result.push({x: mx, y: my, figureType: figureType});
					}
				}
			}
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
			figure.domElement.classList.remove("swinging");
			figure.domElement.classList.add("walking");
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
