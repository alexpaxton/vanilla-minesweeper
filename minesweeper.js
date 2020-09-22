/*
  Global Variables
  ------------------------------------------------------------------------------
*/

let gameContainer = document.getElementById('game-container')
const statusElement = document.getElementById('game-status')
const timerElement = document.getElementById('game-timer')

const localStorageKey = 'vanilla-minesweeper'
const initialTime = 0
let gameTimer
let gameTime = initialTime

let gameStatus = ''

let gameDifficulty = 'easy'
const gamePresets = {
  easy: {
    buttonText: 'Easy',
    height: 16,
    width: 16,
    mines: 0.1,
  },
  medium: {
    buttonText: 'Medium',
    height: 32,
    width: 32,
    mines: 0.1,
  },
  hard: {
    buttonText: 'Hard',
    height: 64,
    width: 64,
    mines: 0.1,
  },
}
const squareSize = 20
const initialMinefield = []
let currentMinefield = initialMinefield
const squareColors = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
]

/*
  Helper Functions
  ------------------------------------------------------------------------------
*/

const createElement = (el, props) => {
  if (typeof el !== "string") {
    return console.error('createElement requires a string')
  }

  const element = document.createElement(el)

  if (props) {
    const keys = Object.keys(props)

    keys.forEach(key => {
      element.setAttribute(key, props[key])
    })
  }

  return element
}

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const loadFromLocalStorage = () => {
  const gameData = window.localStorage.getItem(localStorageKey)

  if (!gameData) {
    return {
      highscores: [],
      minefield: {
        squares: [],
      },
      status: 'initial'
    }
  }

  return JSON.parse(gameData)
}

const saveGameStatus = (status) => {
  const data = loadFromLocalStorage()
  data['status'] = status

  localStorage.setItem(localStorageKey, JSON.stringify(data))
}

const saveMinefield = () => {
  const data = loadFromLocalStorage()
  data['minefield'] = currentMinefield

  localStorage.setItem(localStorageKey, JSON.stringify(data))
}

const loadMinefield = () => {
  const data = loadFromLocalStorage()
  
  return data.minefield
}

const clearGameContainer = () => {
  gameContainer.innerHTML = ''
}

const disableNewGameButton = () => {
  const newGameButton = document.getElementById('start-new-game')
  newGameButton.setAttribute('disabled', 'true')
}

const enableNewGameButton = () => {
  const newGameButton = document.getElementById('start-new-game')
  newGameButton.setAttribute('disabled', null)
}

const shuffleArray = (array) => {
  let shuffledArray = array
  for(let i = shuffledArray.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * i)
    const temp = shuffledArray[i]
    shuffledArray[i] = shuffledArray[j]
    shuffledArray[j] = temp
  }

  return shuffledArray
}

const incrementTimer = () => {
  gameTime ++
  timerElement.innerText = `${gameTime}`
}

const startTimer = () => {
  gameTimer = setInterval(incrementTimer, 1000)
}

const stopTimer = () => {
  clearInterval(gameTimer)
}

const resetTimer = () => {
  gameTime = initialTime
}

const getAdjacentSquares = (id, squares) => {
  if (typeof squares !== 'object') {
    console.error('You must pass an array in to getAdjacentSquares')
  }

  const originSquare = squares[id]
  const {x, y} = originSquare

  const squaresWithoutOrigin = squares.filter(square => square.index !== id)
  const adjacentSquares = squaresWithoutOrigin.filter(square => {
    const horizontallyAdjacent = square.x === x || square.x === x + 1 || square.x === x - 1
    const verticallyAdjacent = square.y === y || square.y === y + 1 || square.y === y - 1

    return horizontallyAdjacent && verticallyAdjacent
  })

  return adjacentSquares
}

/*
  Game Functions
  ------------------------------------------------------------------------------
*/


const handleSetupNewGame = () => {
  stopTimer()
  resetTimer()
  clearGameContainer()
  displayNewGameOptions()
}

const handleStartGame = () => {
  const {height, width, mines} = gamePresets[gameDifficulty]
  currentMinefield = generateMinefield(height, width, mines)
  gameStatus = 'initial'
  saveGameStatus('initial')
  startTimer()
  displayMinefield()
}

const handleSetDifficulty = (e) => {
  const difficulty = e.target.getAttribute('data-difficulty')
  gameDifficulty = difficulty

  clearGameContainer()
  displayNewGameOptions()
}

const displayNewGameOptions = () => {
  // Timer & Emoji
  timerElement.innerText = 'Select Difficulty'

  if (gameDifficulty === 'easy') {
    statusElement.innerText = '😎'
  } else if (gameDifficulty === 'medium') {
    statusElement.innerText = '😣'
  } else if (gameDifficulty === 'hard') {
    statusElement.innerText = '🤬'
  }

  // Display Options
  const container = createElement('div', {class: 'difficulty-options'})
  const buttonList = createElement('div', {class: 'difficulty-buttons'})
  const difficultyOptions = Object.keys(gamePresets)

  difficultyOptions.forEach(option => {
    const preset = gamePresets[option]
    const buttonClass = option === gameDifficulty ? 'button active' : 'button'
    const button = createElement('button', {
      class: buttonClass,
      type: 'button',
      'data-difficulty': option,
      id: `difficulty-${option}`
    })
    button.innerText = preset.buttonText
    button.addEventListener('click', handleSetDifficulty)

    buttonList.appendChild(button)
  })

  container.appendChild(buttonList)

  const {width, height, mines} = gamePresets[gameDifficulty]

  const difficultySummary = createElement('div', {class: 'difficulty-summary'})
  difficultySummary.innerHTML = `
    <div class="difficulty-summary--box">
      <div class="difficulty-summary--icon">
        <div class="square square__hidden"></div>
        <div class="square square__hidden"></div>
        <div class="square square__hidden"></div>
        <div class="square square__hidden"></div>
      </div>
      <p>${width}x${height}</p>
    </div>
    <div class="difficulty-summary--box">
      <div class="difficulty-summary--icon">
        💣
      </div>
      <p>${Math.floor(mines * (width * height))}</p>
    </div>
  `
  container.appendChild(difficultySummary)

  const startButton = createElement('button', {class: 'button button-blue start-game-button'})
  startButton.innerText = 'Start Game'
  startButton.addEventListener('click', handleStartGame)
  container.appendChild(startButton)

  gameContainer.appendChild(container)
}

const generateMinefield = (height, width, mines) => {
  const totalSquares = height * width
  let squares = []
  let minesIndex = []
  let mineCount = Math.floor(mines * totalSquares)
  let x = 0
  let y = 0

  // Ensure proper distribution of mines across minefield
  for (let i = 0; i < totalSquares; i++) {
    if (i < mineCount) {
      minesIndex.push(true)
    } else {
      minesIndex.push(false)
    }
  }
  minesIndex = shuffleArray(minesIndex)

  // Generate each mine
  for (let i = 0; i < totalSquares; i++) {
    let square = {}
    
    square.index = i
    square.mine = minesIndex[i]
    square.flag = false
    square.revealed = false
    square['x'] = x
    square['y'] = y
  
    // Start new row when edge is reached
    var indexPlusOne = i + 1
    if (indexPlusOne % width === 0) {
      x = 0
      y ++
    } else {
      x ++
    }

    squares.push(square)
  }

  // Calculate adjacent mine count
  for (let i = 0; i < squares.length; i ++) {
    squares[i].adjacent = calculateAdjacentMineCount(i, squares)
  }

  return {
    width,
    height,
    squares,
  }
}

const calculateAdjacentMineCount = (index, squares) => {
  let adjacentMineCount = 0
  const adjacentSquares = getAdjacentSquares(index, squares)

  adjacentSquares.forEach(square => {
    if (square.mine) {
      adjacentMineCount ++
    }
  })

  return adjacentMineCount
}

const calculateSquareText = (square) => {
  if (square.mine && square.revealed) {
    return '💣'
  } else if (square.flag) {
    return '🚩'
  } else if (square.adjacent > 0 && square.revealed) {
    return `${square.adjacent}`
  }

  return ''
}

const displayMinefield = () => {
  clearGameContainer()
  const {width, height, squares} = currentMinefield
  const pxWidth = width * squareSize
  const pxHeight = height * squareSize
  const minefield = createElement('div', {
    class: 'minefield',
    style: `width: ${pxWidth}px; height: ${pxHeight}px;`,
  })

  squares.forEach(square => {
    const left = square.x * squareSize
    const top = square.y * squareSize
    const squareElement = createElement('div', {
      class: `square square__${square.revealed ? 'revealed' : 'hidden'} square-${squareColors[square.adjacent]}`,
      style: `width: ${squareSize}px; height: ${squareSize}px; top: ${top}px; left: ${left}px;`,
      id: square.index,
    })

    squareElement.innerText = calculateSquareText(square)

    if (gameStatus === 'initial') {
      squareElement.addEventListener('click', handleSquareClick)
      squareElement.addEventListener('contextmenu', handleSquareRightClick)
    }

    minefield.appendChild(squareElement)
  })

  gameContainer.appendChild(minefield)

  // Persist minefield to local storage
  saveMinefield()
}

const handleCascadingReveal = (id) => {
  let revealedIDs = [id]
  let cascading = true

  while (cascading === true) {
    const prevLength = revealedIDs.length
    revealedIDs.forEach(revealedSquareID => {
      const adjacentSquares = getAdjacentSquares(revealedSquareID, currentMinefield.squares)
      const allAdjacentSquaresAreMineFree = adjacentSquares.filter(square => !square.mine).length === adjacentSquares.length

      if (allAdjacentSquaresAreMineFree) {
        adjacentSquares.forEach(square => {
          const squareNotInList = !revealedIDs.includes(square.index)

          if (squareNotInList) {
            revealedIDs.push(square.index)
          }
        })
      }
    })
    const nextLength = revealedIDs.length

    if (prevLength === nextLength) {
      cascading = false
    }
  }

  // Update squares
  revealedIDs.forEach(id => {
    currentMinefield.squares[id].flag = false
    currentMinefield.squares[id].revealed = true
  })
}

const handleSquareClick = (e) => {
  // currentMinefield = loadMinefield()

  const id = parseInt(e.target.getAttribute('id'))
  const square = currentMinefield.squares[id]

  if (square.revealed || square.flag) {
    return
  } else if (square.mine) {
    handleGameOver()
  }

  handleCascadingReveal(id)

  // Redraw minefield
  displayMinefield()
}

const handleSquareRightClick = (e) => {
  // Block browser right click meny
  e.preventDefault()

  const id = parseInt(e.target.getAttribute('id'))
  const square = currentMinefield.squares[id]

  if (square.revealed) {
    return
  } else if (square.flag) {
    currentMinefield.squares[id].flag = false
  } else {
    currentMinefield.squares[id].flag = true
  }

  // Redraw minefield
  displayMinefield()
}

const handleGameOver = () => {
  stopTimer()
  timerElement.innerText = 'Game Over!'
  statusElement.innerText = '🤯'
  gameStatus = 'gameover'
  saveGameStatus(gameStatus)
}

/*
  Global Event Listeners
  ------------------------------------------------------------------------------
*/

document.getElementById('start-new-game').addEventListener('click', handleSetupNewGame)

/*
  Initialize
  ------------------------------------------------------------------------------
*/

const initalize = () => {
  const data = loadFromLocalStorage()
  const {minefield, status} = data

  if (minefield.squares.length && status === 'initial') {
    currentMinefield = minefield
    displayMinefield()
  } else {
    handleSetupNewGame()
  }
}

initalize()
