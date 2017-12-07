//import {appendCssFileToHead} from "tools";

/**
 * Margin to apply to figures.
 */
const FIGURE_MARGIN = 10;

/**
 * Constants for chess pieces. And a list of them.
 */
const PAWN   = "pawn";
const ROOK   = "rook";
const KNIGHT = "knight";
const BISHOP = "bishop";
const QUEEN  = "queen";
const KING   = "king";
const FIGURE_LIST = [PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING];

/**
 * Constants for chess colours.
 */
const WHITE = "white";
const BLACK = "black";

/**
 * Enumeration of possible movements per chess piece.
 */
const MOVEMENT_ENUM = {};
MOVEMENT_ENUM[PAWN]   = [{deltaX: 0, deltaY: 1}];
MOVEMENT_ENUM[ROOK]   = [{deltaX: 0, deltaY: "n"}, {deltaX: "n", deltaY: 0}];
MOVEMENT_ENUM[KNIGHT] = [{deltaX: 1, deltaY: 2}, {deltaX: 1, deltaY: -2}, {deltaX: 2, deltaY: 1}, {deltaX: 2, deltaY: -1}, {deltaX: -1, deltaY: 2}, {deltaX: -1, deltaY: -2}, {deltaX: -2, deltaY: 1}, {deltaX: -2, deltaY: -1}];
MOVEMENT_ENUM[BISHOP] = [{deltaX: "n", deltaY: "n"}, {deltaX: "n", deltaY: "-n"}];
MOVEMENT_ENUM[QUEEN]  = [{deltaX: 0, deltaY: "n"}, {deltaX: "n", deltaY: 0}, {deltaX: "n", deltaY: "n"}, {deltaX: "n", deltaY: "-n"}];
MOVEMENT_ENUM[KING]   = [{deltaX: 0, deltaY: 1}, {deltaX: 0, deltaY: -1}, {deltaX: 1, deltaY: 1}, {deltaX: 1, deltaY: 0}, {deltaX: 1, deltaY: -1}, {deltaX: -1, deltaY: 1}, {deltaX: -1, deltaY: 0}, {deltaX: -1, deltaY: -1}];

/**
 * Enumeration of possible movements for capturing an opponent's piece.
 * Only defines those movements which differ from MOVEMENT_ENUM.
 */
const CAPTURE_ENUM = {};
CAPTURE_ENUM[PAWN] = [{deltaX: -1, deltaY: 1}, {deltaX: 1, deltaY: 1}];

/**
 * Enumeration of possible movements for capturing an opponent's piece.
 * Contains the capture moves for all types of figures - as opposed to CAPTURE_ENUM.
 */
const CAPTURE_MOVEMENT_ENUM = mergeDicts(CAPTURE_ENUM, MOVEMENT_ENUM);

/**
 * Colour-based enumeration of directions.
 */
const MOVEMENT_DIRECTION_ENUM = {};
MOVEMENT_DIRECTION_ENUM[WHITE] = -1;
MOVEMENT_DIRECTION_ENUM[BLACK] = 1;

/**
 * Name of the style which should be used. A corresponding CSS file
 * must exist (with the extension gameStyle+".css") and the images
 * must exist in the folder "img/"+gameStyle.
 */
var gameStyle = "funny";

/**
 * Global game timer instance.
 */
var gameTimer = null;

/**
 * Number of moves the player has already done in the current game.
 */
var numberOfMoves = 0;

/**
 * List of figures the player has already captured in the current game.
 */
var capturedFigures = [];

/**
 * Global random number generator instance.
 */
var randomGenerator = null;

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
	var queryDict = getQueryParametersDict();
	if (queryDict.hasOwnProperty("style")) {
		gameStyle = queryDict["style"]
	}
	appendCssFileToHead(gameStyle+".css");
	window.setTimeout(initNewGame, 42, queryDict);
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
const DEFAULT_OPTIONS = {"xFieldsMin": 8, "xFieldsMax": 12, "yFieldsMin": 8, "yFieldsMax": 12, "stepCountMin": 12, "stepCountMax": 16, "seed": null}

/**
 * Updates the time in the status line at the bottom of the document.
 */
function updateTimeInStatusLine(gameState = null) {
	var element = document.getElementById("status_time");
	var gs = gameState;
	if (gs == null) {
		gs = getCurrentGameState();
	}
	element.innerHTML = 'time: <span class="value">'+getFormattedTime(gs.time)+'</span>';
}

function updateMovesInStatusLine(gameState = null) {
	var element = document.getElementById("status_moves");
	var gs = gameState;
	if (gs == null) {
		gs = getCurrentGameState();
	}
	element.innerHTML = 'moves: <span class="value">'+gs.moves+'</span>';
}

function updateCapturesInStatusLine(gameState = null) {
	var element = document.getElementById("status_captures");
	var gs = gameState;
	if (gs == null) {
		gs = getCurrentGameState();
	}
	element.innerHTML = 'captures: <span class="value">'+gs.capturedFigures.length+'</span>';
}

/**
 * Updates the values in the status line (time, moves, captured figures)
 * at the bottom of the document.
 */
function updateStatusLine() {
	var gameState = getCurrentGameState();
	updateTimeInStatusLine(gameState);
	updateMovesInStatusLine(gameState);
	updateCapturesInStatusLine(gameState);
}

/**
 * Initialises a new game using the given options.
 * @param {Object} options if a specific option is not present here,
 *                         it will be taken from DEFAULT_OPTIONS
 */
function initNewGame(options={}) {
	var opts = mergeDicts(options, DEFAULT_OPTIONS);
	randomGenerator = createRandomNumberGenerator(options.seed);
	initChessboard(opts);
	generateRandomLevel(opts);
	repositionAllFigures();
	updatePossibleMoves();
	if (gameTimer == null) {
		gameTimer = createGameTimer();
		gameTimer.onChanged = updateTimeInStatusLine;
	}
	gameTimer.reset();
	gameTimer.start();
	numberOfMoves = 0;
	capturedFigures = [];
	updateStatusLine();
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

/**
 * Moves the current figure to another field on the chess board. The movement will use a smooth transition.
 * @param {Object} field target field
 */
function moveCurrentFigureTo(field) {
	fieldMatrix[currentFigure.y][currentFigure.x].figure = null;
	currentFigure.x = field.x;
	currentFigure.y = field.y;
	fieldMatrix[currentFigure.y][currentFigure.x].figure = currentFigure;
	repositionFigure(currentFigure, true);
}

/**
 * Callback function to tell that the last move (started from fieldClicked) has ended.
 * The current figure will be thrown away and the captured figure will become the new
 * current figure.
 * @param {Object} figureOnTargetField the figure which stood there before
 */
function moveEnded(figureOnTargetField) {
	if (currentFigure != null) {
		++numberOfMoves;
		if (figureOnTargetField != null) {
			capturedFigures.push(figureOnTargetField);
			removeFigure(currentFigure);
			currentFigure = figureOnTargetField;
		}
		currentFigure.domElement.classList.remove("walking");
		currentFigure.domElement.classList.add("idle");
		updateStatusLine();
	}
}

/**
 * Removes the given figure. The reference from the fieldMatrix as well as the
 * corresponding DOM element will also be removed.
 * @param {Object} figure the figure which should be removed
 */
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
	var xFields = randomGenerator.nextInt(parseInt(options.xFieldsMin), parseInt(options.xFieldsMax) + 1);
	var yFields = randomGenerator.nextInt(parseInt(options.yFieldsMin), parseInt(options.yFieldsMax) + 1);
	var fieldsMax;
	var visibleRect = createRectangle(0, 0, xFields, yFields);
	if (xFields >= yFields) {
		fieldsMax = xFields;
		visibleRect.setTop(Math.floor(0.5 * (fieldsMax - yFields)));
	} else {
		fieldsMax = yFields;
		visibleRect.setLeft(Math.floor(0.5 * (fieldsMax - xFields)));
	}
	repositionChessboard();
	var board = document.getElementById("board");
	board.innerHTML = "";  // delete old content
	var className = "board"+fieldsMax;
	addCssClassToHead("."+className, "display:grid;grid-template-rows:repeat("+fieldsMax+",1fr);grid-template-columns:repeat("+fieldsMax+",1fr);");
	board.classList.add(className);
	fieldMatrix = [];
	var blackWhiteOffset = xFields % 2;  // lower left field must be black
	for (var y = 0; y < fieldsMax; ++y) {
		if (isBetween(visibleRect.top, y, visibleRect.bottom)) {
			fieldMatrix.push([]);
			for (var x = 0; x < fieldsMax; ++x) {
				var visible = isBetween(visibleRect.left, x, visibleRect.right);
				board.appendChild(createField(x-visibleRect.left, y-visibleRect.top, blackWhiteOffset, visible).domElement);
			}
		}
	}
}

/**
 * Creates a field for the chess board at the given x and y coordinates.
 * @param {Number} x horizontal position
 * @param {Number} y vertical position
 * @param {Number} blackWhiteOffset an offset needed to make the lower left field always black
 * @param {Boolean} visible whether this is a visible field or a dummy field
 * @return {Object} newly created field
 */
function createField(x, y, blackWhiteOffset, visible) {
	var result = {x: x,
		          y: y,
		          domElement: document.createElement("div"),
		          figure: null};
	result.onClick = function(e) {
		fieldClicked(result);
	};
	result.domElement.id = "field_"+x+"_"+y;
	result.domElement.classList.add("field");
	if (visible) {
		result.domElement.classList.add(((x+y+blackWhiteOffset)%2==0) ? "white" : "black");
	} else {
		result.domElement.classList.add("hidden");
	}
	result.domElement.onclick = result.onClick;
	result.visible = visible;
	result.moveable = false;
	if (visible) {
		fieldMatrix[y].push(result);
	}
	return result;
}

/**
 * Generates a random level using the given options.
 * @param {Object} options if a specific option is not present here,
 *                         it will be taken from DEFAULT_OPTIONS
 */
function generateRandomLevel(options) {
	var currentField = randomGenerator.nextArrayElement(randomGenerator.nextArrayElement(fieldMatrix));
	var currentColour = BLACK;
	var stepCount = randomGenerator.nextInt(parseInt(options.stepCountMin), parseInt(options.stepCountMax));
	figureList = [];
	currentField.domElement.classList.add("target_field");
	createFigure({x: currentField.x, y: currentField.y, type: KING, colour: currentColour});
	for (var i=0;i<stepCount;++i) {
		var possibleMoves = [];
		FIGURE_LIST.forEach(function (figureType) {
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
					reducedMoves.push(possibleMoves[randomGenerator.nextInt(iFrom, iTo)]);
					iFrom = i;
					figureType = move.figureType;
				}
			});
			reducedMoves.push(possibleMoves[randomGenerator.nextInt(iFrom, possibleMoves.length)]);
		}
		if (reducedMoves.length == 0) {
			break;
		}
		var move = randomGenerator.nextArrayElement(reducedMoves);
		currentField = fieldMatrix[move.y][move.x];
		currentColour = (currentColour == BLACK ? WHITE : BLACK);
		createFigure({x: currentField.x, y: currentField.y, type: move.figureType, colour: currentColour});
	}
	currentField.domElement.classList.add("start_field");
	currentFigure = fieldMatrix[currentField.y][currentField.x].figure;
	currentFigure.domElement.classList.add("current_figure");
	currentFigure.domElement.classList.add("idle");
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
	figure.src = "img/" + gameStyle + "/" + result.type + "_" + result.colour + ".svg";
	boardArea.appendChild(figure);
	figureList.push(result);
	fieldMatrix[options.y][options.x].figure = result;
	return result;
}

/**
 * Saves the moving target fields whose class list can later be updated rather than
 * updating all field's class lists.
 */
var oldMoves = null;

/**
 * Removes the possible_move CSS class from the fields of oldMoves and sets the moveable flag to false.
 */
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

/**
 * Returns a list of fields which are possible moving targets from the given field.
 * A possible target field must be reachable, and must not be occupied by another figure.
 * @param {Number} x horizontal position of the source field
 * @param {Number} y vertical position of the source field
 * @param {Number} dx horizontal delta of a move
 * @param {Number} dy vertical delta of a move
 * @param {String} figureType type of the figure (use the constants PAWN, ROOK, BISHOP etc.)
 * @return {Array} array of possible moving targets.
 */
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

/**
 * Returns a list of fields which are possible capturing targets from the given field.
 * A possible target field must be reachable, and must be occupied by a figure of the other colour.
 * @param {Number} x horizontal position of the source field
 * @param {Number} y vertical position of the source field
 * @param {Number} dx horizontal delta of capturing move
 * @param {Number} dy vertical delta of capturing move
 * @param {String} figureType type of the figure (use the constants PAWN, ROOK, BISHOP etc.)
 * @return {Array} array of possible capturing targets.
 */
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

/**
 * Returns a list of possible moves for a specified figure.
 * @param {Object} field source field
 * @param {String} figureType type of the figure (use the constants PAWN, ROOK, BISHOP etc.)
 * @param {String} figureColour colour of the figure (use the constants WHITE or BLACK)
 * @param {Object} movementDefinitions dictionary of movement definitions, per figureType
 * @param {Boolean} capturing if true, CAPTURE_MOVEMENT_ENUM will be used, MOVEMENT_ENUM otherwise
 * @return {Array} array of possible moves
 */
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

/**
 * Repositions the figure on the chess board. This can be done after
 * moving the figure, or after resizing the document window.
 * @param {Object} figure the figure to be repositioned
 * @param {Boolean} smooth whether the movement should have a transition
 */
function repositionFigure(figure, smooth=false) {
	if ("domElement" in figure && figure.domElement != null) {
		if (smooth) {
			figure.domElement.classList.add("smooth_movement");
			figure.domElement.classList.remove("idle");
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

// TODO
function isGameRunning() {
	return true;
}

// TODO
function getCurrentGameState() {
	return {solved: false,
		    time: gameTimer.time,
		    moves: numberOfMoves,
		    capturedFigures: capturedFigures};
}
