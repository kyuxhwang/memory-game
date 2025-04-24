// Game configuration
const EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
    "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
    "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
    "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾",
    "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿"
];

const DIFFICULTY_LEVELS = {
    easy: { pairs: 8, gridSize: 4 },
    medium: { pairs: 18, gridSize: 6 },
    hard: { pairs: 32, gridSize: 8 },
    ultra: { pairs: 50, gridSize: 10 }
};

// Game state
let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timer: null,
    startTime: null,
    isPlaying: false,
    difficulty: 'medium',
    cheatMode: false
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const newGameBtn = document.getElementById('new-game');
const difficultySelect = document.getElementById('difficulty');
const cheatModeBtn = document.getElementById('cheat-mode');
const gameSummary = document.getElementById('game-summary');
const finalTimeDisplay = document.getElementById('final-time');
const highScoresList = document.getElementById('high-scores-list');
const playAgainBtn = document.getElementById('play-again');
const emojiPreview = document.getElementById('emoji-preview');
const darkModeToggle = document.getElementById('dark-mode-checkbox');
const modeLabel = document.getElementById('mode-label');

// Initialize game
function initGame() {
    gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timer: null,
        startTime: null,
        isPlaying: false,
        difficulty: difficultySelect.value,
        cheatMode: false
    };

    // Hide the game summary panel
    gameSummary.classList.add('hidden');
    
    // Reset timer display immediately
    timerDisplay.textContent = '00:00';
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    updateStats();
    createGameBoard();
    setupEventListeners();
    showEmojiPreview();
}

// Create game board
function createGameBoard() {
    gameBoard.innerHTML = '';
    const { pairs, gridSize } = DIFFICULTY_LEVELS[gameState.difficulty];
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    gameBoard.className = `${gameState.difficulty}-mode`;

    // Select random emojis for the game
    const selectedEmojis = EMOJIS.sort(() => 0.5 - Math.random()).slice(0, pairs);
    const gameEmojis = [...selectedEmojis, ...selectedEmojis].sort(() => 0.5 - Math.random());

    gameState.cards = gameEmojis.map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
    }));

    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        cardElement.textContent = gameState.cheatMode ? card.emoji : '';
        gameBoard.appendChild(cardElement);
    });

    // Show the emoji preview after creating the game board
    showEmojiPreview();
}

// Show emoji preview
function showEmojiPreview() {
    emojiPreview.innerHTML = '';
    
    // Get unique emojis from the game cards
    const uniqueEmojis = [...new Set(gameState.cards.map(card => card.emoji))];
    
    uniqueEmojis.forEach(emoji => {
        const emojiElement = document.createElement('span');
        emojiElement.textContent = emoji;
        emojiPreview.appendChild(emojiElement);
    });
}

// Setup event listeners
function setupEventListeners() {
    gameBoard.addEventListener('click', handleCardClick);
    newGameBtn.addEventListener('click', initGame);
    difficultySelect.addEventListener('change', initGame);
    cheatModeBtn.addEventListener('click', toggleCheatMode);
    playAgainBtn.addEventListener('click', initGame);
    darkModeToggle.addEventListener('change', toggleDarkMode);
}

// Handle card click
function handleCardClick(event) {
    const cardElement = event.target.closest('.card');
    if (!cardElement || cardElement.classList.contains('matched')) {
            return;
        }

    if (!gameState.isPlaying) {
        gameState.isPlaying = true;
        startTimer();
    }

    const cardId = parseInt(cardElement.dataset.id);
    const card = gameState.cards[cardId];

    // Don't allow selecting the same card twice
    if (gameState.flippedCards.some(flipped => flipped.card.id === card.id)) {
        return;
    }

    if (gameState.flippedCards.length < 2 && !card.isFlipped) {
        if (!gameState.cheatMode) {
            flipCard(cardElement, card);
        } else {
            // In cheat mode, just add the selected class
            cardElement.classList.add('selected');
        }
        gameState.flippedCards.push({ element: cardElement, card });

        if (gameState.flippedCards.length === 2) {
            gameState.moves++;
            updateStats();
            checkMatch();
        }
    }
}

// Flip card
function flipCard(cardElement, card) {
    card.isFlipped = true;
    cardElement.classList.add('flipped');
    cardElement.textContent = card.emoji;
    cardElement.classList.add('flip');
}

// Check for match
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;

    if (card1.card.emoji === card2.card.emoji) {
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        card1.element.classList.remove('selected');
        card2.element.classList.remove('selected');
        card1.card.isMatched = true;
        card2.card.isMatched = true;
        gameState.matchedPairs++;

        // Add jiggle animation to matched cards
        card1.element.classList.add('jiggle');
        card2.element.classList.add('jiggle');

        // Trigger confetti effect
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Update emoji preview
        updateEmojiPreview();

        if (gameState.matchedPairs === DIFFICULTY_LEVELS[gameState.difficulty].pairs) {
            endGame();
        }
    } else {
        setTimeout(() => {
            if (!gameState.cheatMode) {
                card1.element.classList.remove('flipped');
                card2.element.classList.remove('flipped');
                card1.element.textContent = '';
                card2.element.textContent = '';
            } else {
                card1.element.classList.remove('selected');
                card2.element.classList.remove('selected');
            }
            card1.card.isFlipped = false;
            card2.card.isFlipped = false;
        }, 1000);
    }

    gameState.flippedCards = [];
}

// Update game stats
function updateStats() {
    movesDisplay.textContent = gameState.moves;
}

// Start timer
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// End game
function endGame() {
    console.log('Game ended, showing summary');
    console.log('Viewport width:', window.innerWidth);
    clearInterval(gameState.timer);
    showGameSummary();
}

// Update high scores
function updateHighScores(finalTime) {
    const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
    if (!highScores[gameState.difficulty] || highScores[gameState.difficulty].time > finalTime) {
        highScores[gameState.difficulty] = {
            time: finalTime,
            date: new Date().toLocaleDateString()
        };
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }
    displayHighScores();
}

// Display high scores
function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
    highScoresList.innerHTML = '';

    Object.entries(highScores).forEach(([difficulty, score]) => {
        const li = document.createElement('li');
        li.textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: ${score.time} (${score.date})`;
        highScoresList.appendChild(li);
    });
}

// Toggle cheat mode
function toggleCheatMode() {
    gameState.cheatMode = !gameState.cheatMode;
    cheatModeBtn.classList.toggle('active');
    
    // Reset all unmatched cards
    gameState.cards.forEach((card, index) => {
        const cardElement = gameBoard.children[index];
        if (!card.isMatched) {
            cardElement.textContent = gameState.cheatMode ? card.emoji : '';
            cardElement.classList.remove('flipped');
            card.isFlipped = false;
        }
    });

    // Clear any pending matches
    gameState.flippedCards = [];
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.setAttribute('data-theme', darkModeToggle.checked ? 'dark' : 'light');
    modeLabel.textContent = darkModeToggle.checked ? 'Dark Mode' : 'Light Mode';
}

// Update emoji preview
function updateEmojiPreview() {
    const emojiElements = emojiPreview.querySelectorAll('span');
    emojiElements.forEach(emojiElement => {
        const emoji = emojiElement.textContent;
        const isMatched = gameState.cards.some(card => card.emoji === emoji && card.isMatched);
        if (isMatched) {
            emojiElement.classList.add('matched');
        }
    });
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Prevent default touch behaviors
document.addEventListener('touchmove', function(e) {
    if (e.target.classList.contains('card')) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize game on load
initGame();

function showGameSummary() {
    console.log('Showing game summary');
    const summary = document.getElementById('game-summary');
    console.log('Summary element:', summary);
    console.log('Summary position:', summary.getBoundingClientRect());
    console.log('Summary classes:', summary.classList);
    console.log('Is mobile view:', window.innerWidth <= 768);
    
    const finalMoves = document.getElementById('final-moves');
    const finalTime = document.getElementById('final-time');
    
    finalMoves.textContent = gameState.moves;
    finalTime.textContent = timerDisplay.textContent;
    
    // Update high scores
    updateHighScores(timerDisplay.textContent);
    
    // Display high scores
    displayHighScores();
    
    // Remove hidden class to show the modal
    console.log('Removing hidden class');
    summary.classList.remove('hidden');
    console.log('Summary classList after removal:', summary.classList);
    console.log('Summary computed style:', window.getComputedStyle(summary));
    
    // Add click outside handler for mobile
    if (window.innerWidth <= 768) {
        console.log('Setting up mobile click handler');
        const handleClickOutside = (event) => {
            console.log('Click outside detected');
            console.log('Clicked element:', event.target);
            console.log('Summary contains target:', summary.contains(event.target));
            if (!summary.contains(event.target)) {
                summary.classList.add('hidden');
                document.removeEventListener('click', handleClickOutside);
            }
        };
        
        // Use setTimeout to prevent immediate trigger of the click event
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            console.log('Click handler added');
        }, 100);
    }
}