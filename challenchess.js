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
 * Default values for all game related options.
 */
const DEFAULT_OPTIONS = {"xFieldsMin":          6,
                         "xFieldsMax":          12,
                         "yFieldsMin":          6,
                         "yFieldsMax":          12,
                         "replaceAfterCapture": false,
                         "captureAll":          false,
                         "stepCountMin":        12,
                         "stepCountMax":        16,
                         "seed":                null};

/**
 * Definition of a spin-button-adjustable value range in the main menu.
 */
var spinValuesAndLimits = {};

/**
 * Adds a new spin-button-adjustable value range definition for the main menu.
 * @String name name of the value range
 * @Number minLimit minimum value which can be chosen
 * @Number maxLimit maximum value which can be chosen
 */
function addSpinValueDefinition(name, minLimit, maxLimit) {
	spinValuesAndLimits[name] = {"minValue":     minLimit,
		                         "maxValue":     maxLimit,
		                         "minLimit":     minLimit,
		                         "maxLimit":     maxLimit,
		                         "minOptionKey": name+"Min",
		                         "maxOptionKey": name+"Max",
		                         "minElementId": name + "MinOption",
		                         "maxElementId": name + "MaxOption",
		                         "refresh": function() {
									clonedGameOptionsForMainMenu[this.minOptionKey] = this.minValue;
									clonedGameOptionsForMainMenu[this.maxOptionKey] = this.maxValue;
									document.getElementById(this.minElementId).innerHTML = this.minValue;
									document.getElementById(this.maxElementId).innerHTML = this.maxValue;
								 },
		                         "decreaseMin": function() {
									if (this.minValue > this.minLimit) {
										this.minValue--;
										this.refresh();
									}
								 },
								 "increaseMin": function() {
									if (this.minValue < this.maxLimit) {
										this.minValue++;
										if (this.minValue > this.maxValue) {
											this.maxValue = this.minValue;
										}
										this.refresh();
									}
								 },
								 "decreaseMax": function() {
									if (this.maxValue > this.minLimit) {
										this.maxValue--;
										if (this.maxValue < this.minValue) {
											this.minValue = this.maxValue;
										}
										this.refresh();
									}
							     },
							     "increaseMax": function() {
									if (this.maxValue < this.maxLimit) {
										this.maxValue++;
										this.refresh();
									}
								 }};
}
addSpinValueDefinition("xFields", 4, 16);
addSpinValueDefinition("yFields", 4, 16);
addSpinValueDefinition("stepCount", 3, 20);

/**
 * Name of the style which should be used. A corresponding CSS file
 * must exist (with the extension gameStyle+".css") and the images
 * must exist in the folder "img/"+gameStyle.
 */
var gameStyle = "funny";

/**
 * Dictionary of game options.
 */
var gameOptions = null;

/**
 * Global game timer instance.
 */
var gameTimer = null;

/**
 * Flag whether the game is still running.
 */
var gameRunning = null;

/**
 * Number of moves the player has already done in the current game.
 */
var numberOfMoves = null;

/**
 * List of figures the player has already captured in the current game.
 */
var capturedFigures = null;

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
 * currentFigure. A figure will be removed from this list when it is
 * captured (but will be added to capturedFigures).
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
	gameOptions = mergeDicts(queryDict, DEFAULT_OPTIONS);
	if (typeof gameOptions.replaceAfterCapture === "string") {
		gameOptions.replaceAfterCapture = gameOptions.replaceAfterCapture == "true";
	}
	if (typeof gameOptions.captureAll === "string") {
		gameOptions.captureAll = gameOptions.captureAll == "true";
	}
	window.setTimeout(initNewGame, 42);
}

/**
 * Cloned game options which can be manipulated in the main menu without affecting the real gameOptions.
 * Thus, simply closing the main menu without applying any option changes leaves the real gameOptions unchanged.
 */
var clonedGameOptionsForMainMenu = null;

/**
 * Updates the displayed value of all options in the main menu.
 */
function showAllOptions() {
	Object.values(spinValuesAndLimits).forEach(function(spinValue) {
		spinValue.refresh();
	});
}

/**
 * Opens the main menu of the game.
 * Meanwhile, the game will be faded out by activating the pause layer.
 */
function openMainMenu() {
	clonedGameOptionsForMainMenu = clone(gameOptions);
	spinValuesAndLimits.xFields.minValue = clonedGameOptionsForMainMenu.xFieldsMin;
	spinValuesAndLimits.xFields.maxValue = clonedGameOptionsForMainMenu.xFieldsMax;
	spinValuesAndLimits.yFields.minValue = clonedGameOptionsForMainMenu.yFieldsMin;
	spinValuesAndLimits.yFields.maxValue = clonedGameOptionsForMainMenu.yFieldsMax;
	spinValuesAndLimits.stepCount.minValue = clonedGameOptionsForMainMenu.stepCountMin;
	spinValuesAndLimits.stepCount.maxValue = clonedGameOptionsForMainMenu.stepCountMax;
	showAllOptions();
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
 * Updates the time in the status line at the bottom of the document.
 */
function updateTimeInStatusLine() {
	var element = document.getElementById("status_time");
	element.innerHTML = 'time: <span class="value">'+getFormattedTime(gameTimer.time)+'</span>';
}

/**
 * Updates the number of performed moves in the status line at the bottom of the document.
 */
function updateMovesInStatusLine() {
	var element = document.getElementById("status_moves");
	element.innerHTML = 'moves: <span class="value">'+numberOfMoves+'</span>';
}

/**
 * Updates the number of captured figures in the status line at the bottom of the document.
 */
function updateCapturesInStatusLine() {
	var element = document.getElementById("status_captures");
	element.innerHTML = 'captures: <span class="value">'+capturedFigures.length+'</span>';
}

/**
 * Updates the values in the status line (time, moves, captured figures)
 * at the bottom of the document.
 */
function updateStatusLine() {
	updateTimeInStatusLine();
	updateMovesInStatusLine();
	updateCapturesInStatusLine();
}

/**
 * Initialises a new game using the current gameOptions.
 */
function initNewGame() {
	gameRunning = true;
	randomGenerator = createRandomNumberGenerator(gameOptions.seed);
	initChessboard();
	generateRandomLevel();
	repositionAllFigures();
	numberOfMoves = 0;
	capturedFigures = [];
	updatePossibleMoves();
	if (gameTimer == null) {
		gameTimer = createGameTimer();
		gameTimer.onChanged = updateTimeInStatusLine;
	}
	gameTimer.reset();
	gameTimer.start();
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
			if (gameRunning) {
				updatePossibleMoves();
			} else {
				clearPossibleMoves();
			}
		}, 750);
	}
}

/**
 * Tells whether the current figure is still able to move.
 * @return {Boolean} flag about the figure's agility
 */
function currentFigureCanMove() {
	return possibleMoves.length > 0;
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
			if (gameOptions.replaceAfterCapture) {
				removeFigure(currentFigure);
				currentFigure = figureOnTargetField;
			} else {
				removeFigure(figureOnTargetField);
			}
		}
		currentFigure.domElement.classList.remove("walking");
		currentFigure.domElement.classList.add("idle");
		updateStatusLine();
		destinationField = fieldMatrix[currentFigure.y][currentFigure.x];
		checkAndHandleGameEnd(destinationField);
	}
}

/**
 * Checks whether the current game's end conditions are fulfilled.
 * If so, stop the game and decide whether the game has successfully
 * been solved, or not. Display a corresponding message.
 * @param {Object} destinationField destination of the last move
 */
function checkAndHandleGameEnd(destinationField) {
	if (destinationField.domElement.classList.contains("target_field")) {
		if (figureList.length == 1 || !gameOptions.captureAll) {
			stopGame(true);
		} else {
			stopGame(false, "You did not capture all figures.")
		}
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
		var boardArea = document.getElementById("figures");
		boardArea.removeChild(figure.domElement);
		var figureIndex = figureList.indexOf(figure);
		if (figureIndex >= 0) {
			figureList.splice(figureIndex, 1);
		}
	}
}

/**
 * Clears the current chessboard, if there is any from a previous game.
 */
function clearChessboard() {
	fieldMatrix = [];
	var board = document.getElementById("board");
	board.innerHTML = "";  // delete old content
	board.className = "";  // clear classList
	possibleMoves = null;
}

/**
 * Initialises a chess board using the current gameOptions.
 */
function initChessboard() {
	clearChessboard();
	var board = document.getElementById("board");
	var xFields = randomGenerator.nextInt(parseInt(gameOptions.xFieldsMin), parseInt(gameOptions.xFieldsMax) + 1);
	var yFields = randomGenerator.nextInt(parseInt(gameOptions.yFieldsMin), parseInt(gameOptions.yFieldsMax) + 1);
	var className = "board"+xFields+"x"+yFields;
	addCssClassToHead("."+className, "display:grid;grid-template-rows:repeat("+yFields+",1fr);grid-template-columns:repeat("+xFields+",1fr);");
	board.classList.add(className);
	var blackWhiteOffset = yFields % 2;  // lower left field must be black
	for (var y = 0; y < yFields; ++y) {
		fieldMatrix.push([]);
		for (var x = 0; x < xFields; ++x) {
			var field = createField(x, y, blackWhiteOffset);
			fieldMatrix[y].push(field);
			board.appendChild(field.domElement);
		}
	}
	repositionChessboard();
}

/**
 * Creates a field for the chess board at the given x and y coordinates.
 * @param {Number} x horizontal position
 * @param {Number} y vertical position
 * @param {Number} blackWhiteOffset an offset needed to make the lower left field always black
 * @return {Object} newly created field
 */
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
	return result;
}

/**
 * Clears old figures if there are some from a previous game.
 */
function clearFigures() {
	figureList = null;
	currentFigure = null;
	capturedFigures = null;
	document.getElementById("figures").innerHTML = "";  // delete old figures
}

/**
 * Generates a random level using the current gameOptions.
 */
function generateRandomLevel() {
	clearFigures();
	figureList = [];
	var currentField = randomGenerator.nextArrayElement(randomGenerator.nextArrayElement(fieldMatrix));
	var currentColour = BLACK;
	var stepCount = randomGenerator.nextInt(parseInt(gameOptions.stepCountMin), parseInt(gameOptions.stepCountMax));
	currentField.domElement.classList.add("target_field");
	createFigure({x: currentField.x, y: currentField.y, type: KING, colour: currentColour});
	var usedFigureList = []
	if (gameOptions.replaceAfterCapture) {
		usedFigureList = FIGURE_LIST;
	} else {
		usedFigureList = [randomGenerator.nextArrayElement(FIGURE_LIST)];
	}
	for (var i=0;i<stepCount;++i) {
		var possibleMoves = [];
		usedFigureList.forEach(function (figureType) {
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
		var newFigureType;
		currentField = fieldMatrix[move.y][move.x];
		if (gameOptions.replaceAfterCapture) {
			currentColour = (currentColour == BLACK ? WHITE : BLACK);
			newFigureType = move.figureType;
		} else {
			newFigureType = randomGenerator.nextArrayElement(FIGURE_LIST);
		}
		createFigure({x: currentField.x, y: currentField.y, type: newFigureType, colour: currentColour});
	}
	currentField.domElement.classList.add("start_field");
	if (gameOptions.replaceAfterCapture) {
		currentFigure = fieldMatrix[currentField.y][currentField.x].figure;
	} else {
		removeFigure(fieldMatrix[currentField.y][currentField.x].figure);
		currentFigure = createFigure({x: currentField.x, y: currentField.y, type: usedFigureList[0], colour: WHITE});
	}
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
	var figuresDomElement = document.getElementById("figures");
	var figureImageElement = document.createElement("img");
	result.domElement = figureImageElement;
	figureImageElement.classList.add("figure");
	figureImageElement.src = "img/" + gameStyle + "/" + result.type + "_" + result.colour + ".svg";
	figuresDomElement.appendChild(figureImageElement);
	figureList.push(result);
	fieldMatrix[options.y][options.x].figure = result;
	return result;
}

/**
 * Saves the moving target fields whose class list can later be updated rather than
 * updating all field's class lists.
 */
var possibleMoves = null;

/**
 * Removes the possible_move CSS class from the fields of possibleMoves and sets the moveable flag to false.
 */
function clearPossibleMoves() {
	if (possibleMoves != null) {
		possibleMoves.forEach(function (move) {
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
	var moves = getPossibleMoves(currentFigure, currentFigure.type, currentFigure.colour, CAPTURE_MOVEMENT_ENUM, true);
	moves.forEach(function (move) {
		fieldMatrix[move.y][move.x].domElement.classList.add("possible_move");
		fieldMatrix[move.y][move.x].moveable = true;
	});
	possibleMoves = moves;
	if (gameRunning && !currentFigureCanMove()) {
		stopGame(false, "The current figure can no longer move.");
	}
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
	var xFields, yFields;
	if (fieldMatrix == null) {
		xFields = 8;
		yFields = 8;
	} else {
		yFields = fieldMatrix.length;
		xFields = (yFields >= 1 ? fieldMatrix[0].length : 8);
	}
	var boardAspectRatio = xFields == 0 ? 1 : xFields/yFields;
	var boardAreaRect = getElementBounds(document.getElementById("board_area"));
	var boardAreaAspectRatio = boardAreaRect.height == 0 ? 1 : boardAreaRect.width/boardAreaRect.height;
	var boardRect = createRectangle();
	if (boardAreaAspectRatio > boardAspectRatio) {
		boardRect.setHeight(boardAreaRect.height);
		boardRect.setTop(boardAreaRect.top);
		boardRect.setWidth(Math.floor(boardAreaRect.height*xFields/yFields));
		boardRect.setLeft(boardAreaRect.left + Math.floor(0.5*(boardAreaRect.width-boardRect.width)));
	} else {
		boardRect.setWidth(boardAreaRect.width);
		boardRect.setLeft(boardAreaRect.left);
		boardRect.setHeight(Math.floor(boardAreaRect.width*yFields/xFields));
		boardRect.setTop(boardAreaRect.top + Math.floor(0.5*(boardAreaRect.height-boardRect.height)));
	}
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
	if (figureList != null) {
		figureList.forEach(function(figure) {
			repositionFigure(figure);
		});
	}
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

/**
 * Tells whether the game is still running with respect to fulfilled
 * end conditions.
 */
function isGameRunning() {
	return gameRunning;
}

/**
 * Stops the game.
 * @param {Boolean} has the game successfully been solved?
 * @param {String} message text telling why the player has lost the game
 */
function stopGame(solved, messageText) {
	gameTimer.pause();
	gameRunning = false;
	updateStatusLine();
	if (solved) {
		document.getElementById("game_end_message").innerHTML = "Congratulations!<br />You solved this challenge.";
	} else {
		document.getElementById("game_end_message").innerHTML = "Sorry, you failed.<br />" + messageText;
	}
	openGameEndDialogue();
}

/**
 * Opens (shows) the game end dialogue.
 */
function openGameEndDialogue() {
	document.getElementById("game_end_dialogue").classList.add("visible");
	document.getElementById("pause_layer").classList.add("faded");
}

/**
 * Closes (hides) the game end dialogue.
 */
function closeGameEndDialogue() {
	document.getElementById("game_end_dialogue").classList.remove("visible");
	document.getElementById("pause_layer").classList.remove("faded");
}

/**
 * Inits the game using the same seed for the random number generator.
 */
function onButtonRetryClicked() {
	closeGameEndDialogue();
	gameOptions.seed = randomGenerator.seed;  // take the same seed in order to recreate the same level
	initNewGame();
}

/**
 * Inits a new game using the same options as before.
 */
function onButtonNewGameClicked() {
	closeGameEndDialogue();
	gameOptions.seed = null;  // will take a new, random seed, and thus probably creates a different level
	initNewGame();
}

/**
 * Closes the dialogue and opens the main menu instead.
 */
function onButtonMenuClicked() {
	closeGameEndDialogue();
	openMainMenu();
}

/**
 * Closes the dialogue.
 */
function onButtonBackToGameClicked() {
	closeGameEndDialogue();
}

/**
 * Applies changed options, closes the main menu, and starts a new game using the new options.
 */
function onButtonApplyOptionsClicked() {
	applyNewOptions();
	closeMainMenu();
	initNewGame();
}

/**
 * Closes the main menu without applying any option changes.
 */
function onButtonCancelOptionsClicked() {
	closeMainMenu();
}

/**
 * Copies the options from the main menu to the gameOptions so a new game can be startet using them.
 */
function applyNewOptions() {
	gameOptions = clonedGameOptionsForMainMenu;
	gameOptions.seed = null;
}
