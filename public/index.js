"use strict";
(function () {
  let gameData = {};
  let canvas, context;
  let offsetX, offsetY, scale, resetOnClick;
  const INIT_ACTIVE = [
    "0,0",
    "0,2",
    "0,1",
    "1,0",
    "1,1",
    "1,2",
    "2,0",
    "2,1",
    "2,2",
  ];
  $(document).ready(function () {
    canvas = $("#canvas")[0];
    context = canvas.getContext("2d");
    // disable right clicking
    document.oncontextmenu = function () {
      return false;
    };

    // if the window changes size, redraw the canvas
    window.addEventListener("resize", (event) => {
      redrawCanvas();
    });

    // add keyboard listeners
    document.addEventListener("keydown", (event) => {
      // listen for "R" key
      if (event.keyCode === 82) {
        // reset the game
        initializeBoard();
      }
      // listen for "C" key
      if (event.keyCode === 67) {
        // recenter the board
        scale = 1;
        offsetX = document.body.clientWidth / 2 - 150;
        offsetY = document.body.clientHeight / 2 - 150;
        redrawCanvas();
      }
    });

    $('.instructions-modal').click(function () {
      $('.instructions-modal').hide();
      $('#canvas').removeClass('blur');
      localStorage.setItem('instructions', true);
    });

    if (localStorage.getItem('instructions')) {
      $('.instructions-modal').hide();
      $('#canvas').removeClass('blur');
    }

    // Mouse Event Handlers
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('wheel', onMouseWheel, false);


    // Touch Event Handlers
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);
    canvas.addEventListener('touchmove', onTouchMove);
    initializeBoard();
  });

  function initializeBoard() {
    resetOnClick = false;
    gameData = { activeSquares: INIT_ACTIVE.slice(), x: [], o: [], gameOver: false, winSequence: [] };
    gameData.userIs = "x";
    $('#canvas').addClass(gameData.userIs);
    scale = 1;
    offsetX = document.body.clientWidth / 2 - 150;
    offsetY = document.body.clientHeight / 2 - 150;
    redrawCanvas();
  }

  function isAdjacent(squareID, activeSquares) {
    // check if one of any of the 6 sides is active
    const [x, y] = squareID.split(",").map(Number);
    return activeSquares.some((activeSquare) => {
      const [activeX, activeY] = activeSquare.split(",").map(Number);
      const xDiff = Math.abs(x - activeX);
      const yDiff = Math.abs(y - activeY);
      return (
        (xDiff === 1 && yDiff === 0) ||
        (xDiff === 0 && yDiff === 1));
    });
  }

  function redrawCanvas() {
    // set the canvas to the size of the window
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    // draw rectangle at mouse position
    if (!gameData.gameOver && gameData.hoveredRect && isAdjacent(gameData.hoveredRect.id, gameData.activeSquares)) {
      context.fillStyle = '#EA80FC';
      context.fillRect(
        gameData.hoveredRect.x + offsetX, gameData.hoveredRect.y + offsetY,
        gameData.hoveredRect.width, gameData.hoveredRect.height
      );
    }
    // draw rectangle for each active square
    for (let i = 0; i < gameData.activeSquares.length; i++) {
      let square = getSquare(gameData.activeSquares[i]);
      context.fillStyle = '#7C4DFF';
      context.fillRect(square.x + offsetX, square.y + offsetY, square.width, square.height);
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.strokeRect(square.x + offsetX, square.y + offsetY, square.width, square.height);
    }
    // draw a rectangle for each winning square
    for (let i = 0; i < gameData.winSequence.length; i++) {
      let square = getSquare(gameData.winSequence[i]);
      context.fillStyle = '#FF6E40';
      context.fillRect(square.x + offsetX, square.y + offsetY, square.width, square.height);
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.strokeRect(square.x + offsetX, square.y + offsetY, square.width, square.height);
    }
    // fill in the X's and O's
    for (let i = 0; i < gameData.x.length; i++) {
      let square = getSquare(gameData.x[i]);
      // type the letter X in the middle of the square
      let fontSize = 70 * scale;
      context.font = "bold " + fontSize + "px Arial";
      context.fillStyle = '#fff';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("X", square.x + offsetX + square.width / 2, square.y + offsetY + square.height / 2);
    }
    for (let i = 0; i < gameData.o.length; i++) {
      let square = getSquare(gameData.o[i]);
      // type the letter X in the middle of the square
      let fontSize = 70 * scale;
      context.font = "bold " + fontSize + "px Arial";
      context.fillStyle = '#fff';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("O", square.x + offsetX + square.width / 2, square.y + offsetY + square.height / 2);
    }
    // draw text for game status in top right corner
    context.font = "bold 30px Arial";
    context.fillStyle = '#fff';
    context.textAlign = "right";
    context.textBaseline = "top";
    if (gameData.gameOver) {
      context.fillText((gameData.userIs === 'x' ? 'O' : 'X') + " Wins", canvas.width - 10, 10);
      setTimeout(function () {
        resetOnClick = true;
      }, 2000);
      $('#canvas').removeClass('x').removeClass('o');
    } else {
      context.fillText(gameData.userIs.toUpperCase() + "'s Turn", canvas.width - 10, 10);
    }
  }

  function getHoveredRect(rx, ry) {
    const RECT_SIZE = 100 * scale;
    let x = Math.floor(rx / RECT_SIZE) * RECT_SIZE;
    let y = Math.floor(ry / RECT_SIZE) * RECT_SIZE;
    let width = RECT_SIZE;
    let height = RECT_SIZE;
    let id = x / RECT_SIZE + ',' + y / RECT_SIZE;
    return { x, y, width, height, id };
  }

  function getSquare(id) {
    id = id.split(',');
    let x = parseInt(id[0]) * 100 * scale;
    let y = parseInt(id[1]) * 100 * scale;
    let width = 100 * scale;
    let height = 100 * scale;
    return { x, y, width, height };
  }

  function testGameOver(id, placedBy) {
    // Check if the tic tac toe game is over (4 in a row)
    if (testWinningSequence(id, placedBy, [0, 1]) ||
      testWinningSequence(id, placedBy, [1, 0]) ||
      testWinningSequence(id, placedBy, [1, 1]) ||
      testWinningSequence(id, placedBy, [1, -1])) {
      gameData.gameOver = true;
      redrawCanvas();
    }
  }

  function testWinningSequence(id, placedBy, direction) {
    // Check if the tic tac toe game is over (4 in a row)
    let inARow = [];
    let [x, y] = id.split(',').map(Number);
    for (let i = -3; i <= 3; i++) {
      let testX = x + i * direction[0];
      let testY = y + i * direction[1];
      let testID = testX + ',' + testY;
      if (gameData[placedBy].includes(testID)) {
        inARow.push(testID);
        if (inARow.length >= 4) {
          gameData.winSequence = inARow;
          return true;
        }
      } else {
        inARow = [];
      }
    }
    return false;
  }

  // mouse functions
  let leftMouseDown = false;
  let rightMouseDown = false;
  let cursorX = 0;
  let cursorY = 0;
  let prevCursorX = 0;
  let prevCursorY = 0;
  let movedCanvas = false;
  function onMouseDown(event) {
    // detect left clicks
    if (event.button == 0) {
      leftMouseDown = true;
      rightMouseDown = false;
    }
    // detect right clicks
    if (event.button == 2) {
      rightMouseDown = true;
      leftMouseDown = false;
    }
  }
  function onMouseUp(event) {
    if (leftMouseDown && !movedCanvas && !gameData.gameOver) {
      gameData.hoveredRect = getHoveredRect(event.pageX - offsetX, event.pageY - offsetY);
      if (!gameData.activeSquares.includes(gameData.hoveredRect.id)) {
        if (isAdjacent(gameData.hoveredRect.id, gameData.activeSquares)) {
          gameData.activeSquares.push(gameData.hoveredRect.id);
          gameData.userIs = gameData.userIs === "x" ? "o" : "x";
          $('#canvas').removeClass('x').removeClass('o').addClass(gameData.userIs);
        }
      } else {
        if (!gameData.x.includes(gameData.hoveredRect.id) &&
          !gameData.o.includes(gameData.hoveredRect.id)) {
          gameData[gameData.userIs].push(gameData.hoveredRect.id);
          testGameOver(gameData.hoveredRect.id, gameData.userIs);
          gameData.userIs = gameData.userIs === "x" ? "o" : "x";
          $('#canvas').removeClass('x').removeClass('o').addClass(gameData.userIs);
        }
      }
      redrawCanvas();
    } else if (leftMouseDown && resetOnClick) {
      initializeBoard();
    }
    // detect left clicks
    if (event.button == 0) {
      leftMouseDown = false;
    }
    // detect right clicks
    if (event.button == 2) {
      rightMouseDown = false;
    }
    movedCanvas = false;
  }

  function onMouseMove(event) {
    cursorX = event.pageX;
    cursorY = event.pageY;
    gameData.hoveredRect = getHoveredRect(event.pageX - offsetX, event.pageY - offsetY);
    if (leftMouseDown) {
      // move the screen
      offsetX += (cursorX - prevCursorX) / scale;
      offsetY += (cursorY - prevCursorY) / scale;
      movedCanvas = true;
    }
    redrawCanvas();
    prevCursorX = cursorX;
    prevCursorY = cursorY;
  }
  function onMouseWheel(event) {
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 2;
    if (event.deltaY > 0) {
      scale *= 1.1;
    } else {
      scale /= 1.1;
    }
    if (scale < MIN_SCALE) {
      scale = MIN_SCALE;
    } else if (scale > MAX_SCALE) {
      scale = MAX_SCALE;
    }
    gameData.hoveredRect = getHoveredRect(event.pageX - offsetX, event.pageY - offsetY);
    redrawCanvas();
  }

  const prevTouches = [null, null]; // up to 2 touches
  let singleTouch = false;
  let doubleTouch = false;
  function onTouchStart(event) {
    gameData.hoveredRect = null;
    if (event.touches.length == 1) {
      singleTouch = true;
      doubleTouch = false;
    }
    if (event.touches.length >= 2) {
      singleTouch = false;
      doubleTouch = true;
    }

    // store the last touches
    prevTouches[0] = event.touches[0];
    prevTouches[1] = event.touches[1];
  }
  function onTouchEnd(event) {
    singleTouch = false;
    doubleTouch = false;
  }
  function onTouchMove(event) {
    // get first touch coordinates
    const touch0X = event.touches[0].pageX;
    const touch0Y = event.touches[0].pageY;
    const prevTouch0X = prevTouches[0].pageX;
    const prevTouch0Y = prevTouches[0].pageY;

    if (doubleTouch) {
      // get second touch coordinates
      const touch1X = event.touches[1].pageX;
      const touch1Y = event.touches[1].pageY;
      const prevTouch1X = prevTouches[1].pageX;
      const prevTouch1Y = prevTouches[1].pageY;

      // get midpoints
      const midX = (touch0X + touch1X) / 2;
      const midY = (touch0Y + touch1Y) / 2;
      const prevMidX = (prevTouch0X + prevTouch1X) / 2;
      const prevMidY = (prevTouch0Y + prevTouch1Y) / 2;

      // calculate the distances between the touches
      const hypot = Math.sqrt(Math.pow((touch0X - touch1X), 2) + Math.pow((touch0Y - touch1Y), 2));
      const prevHypot = Math.sqrt(Math.pow((prevTouch0X - prevTouch1X), 2) + Math.pow((prevTouch0Y - prevTouch1Y), 2));

      // calculate the screen scale change
      var zoomAmount = hypot / prevHypot;
      scale = scale * zoomAmount;
      const scaleAmount = 1 - zoomAmount;

      // calculate how many pixels the midpoints have moved in the x and y direction
      const panX = midX - prevMidX;
      const panY = midY - prevMidY;
      // scale this movement based on the zoom level
      offsetX += (panX / scale);
      offsetY += (panY / scale);

      // Get the relative position of the middle of the zoom.
      // 0, 0 would be top left.
      // 0, 1 would be top right etc.
      var zoomRatioX = midX / canvas.clientWidth;
      var zoomRatioY = midY / canvas.clientHeight;

      // calculate the amounts zoomed from each edge of the screen
      const unitsZoomedX = trueWidth() * scaleAmount;
      const unitsZoomedY = trueHeight() * scaleAmount;

      const unitsAddLeft = unitsZoomedX * zoomRatioX;
      const unitsAddTop = unitsZoomedY * zoomRatioY;

      offsetX += unitsAddLeft;
      offsetY += unitsAddTop;

      redrawCanvas();
    } else if (singleTouch) {
      // get the difference between the first touch and the last touch
      const panX = touch0X - prevTouch0X;
      const panY = touch0Y - prevTouch0Y;

      // move the screen
      offsetX += (panX / scale);
      offsetY += (panY / scale);

      redrawCanvas();
    }
    prevTouches[0] = event.touches[0];
    prevTouches[1] = event.touches[1];
  }

  // convert coordinates
  function toScreenX(xTrue) {
    return (xTrue + offsetX) * scale;
  }
  function toScreenY(yTrue) {
    return (yTrue + offsetY) * scale;
  }
  function toTrueX(xScreen) {
    return (xScreen / scale) - offsetX;
  }
  function toTrueY(yScreen) {
    return (yScreen / scale) - offsetY;
  }
  function trueHeight() {
    return canvas.clientHeight / scale;
  }
  function trueWidth() {
    return canvas.clientWidth / scale;
  }
})();