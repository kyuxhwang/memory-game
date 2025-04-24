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
    baby: { pairs: 2, gridSize: 2 },
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
    cheatMode: false,
    difficulty: 'easy',
    totalGames: parseInt(localStorage.getItem('totalGames') || '0')
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const timerDisplay = document.getElementById('timer');
const totalGamesDisplay = document.getElementById('total-games');
const newGameBtn = document.getElementById('new-game');
const difficultySelect = document.getElementById('difficulty');
const playAgainBtn = document.getElementById('play-again');
const gameSummary = document.getElementById('game-summary');
const cheatButton = document.getElementById('cheat-button');
const emojiPreview = document.getElementById('emoji-preview');
const highScoresList = document.getElementById('high-scores-list');

// Initialize game
function initGame() {
    console.log('Initializing game...');
    
    // Stop any existing timer
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }

    // Reset game state but keep totalGames
    const totalGames = gameState.totalGames;
    gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        timer: null,
        startTime: null,
        isPlaying: false,
        cheatMode: false,
        difficulty: difficultySelect.value,
        totalGames: totalGames
    };

    // Reset UI
    movesDisplay.textContent = '0';
    matchesDisplay.textContent = '0';
    timerDisplay.textContent = '00:00';
    totalGamesDisplay.textContent = gameState.totalGames;
    document.getElementById('modal-overlay').classList.remove('visible');
    document.getElementById('game-summary').classList.remove('visible');
    cheatButton.classList.remove('active');
    
    // Clear and create game board
    gameBoard.innerHTML = '';
    createGameBoard();
    showEmojiPreview();
    
    console.log('Game initialized');
}

// Create game board
function createGameBoard() {
    console.log('Creating game board...');
    const { pairs, gridSize } = DIFFICULTY_LEVELS[gameState.difficulty];
    console.log('Difficulty:', gameState.difficulty, 'Pairs:', pairs, 'Grid size:', gridSize);
    
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    gameBoard.className = `${gameState.difficulty}-mode`;

    // Select random emojis
    const selectedEmojis = EMOJIS.sort(() => 0.5 - Math.random()).slice(0, pairs);
    const gameEmojis = [...selectedEmojis, ...selectedEmojis].sort(() => 0.5 - Math.random());

    // Create cards
    gameState.cards = gameEmojis.map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
    }));

    // Add cards to board
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        cardElement.dataset.emoji = card.emoji;
        gameBoard.appendChild(cardElement);
    });
    
    console.log('Game board created with', gameState.cards.length, 'cards');
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

// Handle card click
function handleCardClick(event) {
    const cardElement = event.target.closest('.card');
    if (!cardElement || cardElement.classList.contains('matched')) return;

    const cardId = parseInt(cardElement.dataset.id);
    const card = gameState.cards[cardId];

    if (gameState.flippedCards.length < 2 && !card.isFlipped) {
        if (!gameState.isPlaying) {
            gameState.isPlaying = true;
            startTimer();
        }

        // Add selected class to show which card is currently selected
        cardElement.classList.add('selected');
        flipCard(cardElement, card);
        gameState.flippedCards.push({ id: cardId, emoji: card.emoji });

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
}

// Check for match
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    const card1Element = document.querySelector(`.card[data-id="${card1.id}"]`);
    const card2Element = document.querySelector(`.card[data-id="${card2.id}"]`);

    // Remove selected class from both cards
    card1Element.classList.remove('selected');
    card2Element.classList.remove('selected');

    if (card1.emoji === card2.emoji) {
        setTimeout(() => {
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            gameState.matchedPairs++;
            matchesDisplay.textContent = gameState.matchedPairs;
            
            // Trigger confetti for each match
            confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.6 }
            });

            if (gameState.matchedPairs === DIFFICULTY_LEVELS[gameState.difficulty].pairs) {
                endGame();
            }
        }, 300);
    } else {
        // Add mismatch class to both cards
        card1Element.classList.add('mismatch');
        card2Element.classList.add('mismatch');
        
        setTimeout(() => {
            if (!gameState.cheatMode) {
                card1Element.classList.remove('flipped');
                card2Element.classList.remove('flipped');
                card1Element.textContent = '';
                card2Element.textContent = '';
            }
            // Remove mismatch class after animation
            card1Element.classList.remove('mismatch');
            card2Element.classList.remove('mismatch');
            gameState.cards[card1.id].isFlipped = false;
            gameState.cards[card2.id].isFlipped = false;
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
    console.log('=== Game End Debug ===');
    console.log('1. Game ended, showing summary');
    console.log('2. Current moves:', gameState.moves);
    console.log('3. Current time:', timerDisplay.textContent);
    
    // Increment total games played
    gameState.totalGames++;
    localStorage.setItem('totalGames', gameState.totalGames.toString());
    
    clearInterval(gameState.timer);
    const finalMoves = document.getElementById('final-moves');
    const finalTime = document.getElementById('final-time');
    const overlay = document.getElementById('modal-overlay');
    const summary = document.getElementById('game-summary');
    
    console.log('4. DOM elements found:', {
        finalMoves: !!finalMoves,
        finalTime: !!finalTime,
        overlay: !!overlay,
        summary: !!summary,
        highScoresList: !!highScoresList
    });
    
    // Update final stats
    finalMoves.textContent = gameState.moves;
    finalTime.textContent = timerDisplay.textContent;
    
    // Update high scores
    updateHighScores(timerDisplay.textContent);
    displayHighScores();
    
    // Show the overlay and summary
    console.log('5. Adding visible class to overlay and summary');
    overlay.classList.add('visible');
    summary.classList.add('visible');
    
    console.log('6. Current overlay classes:', overlay.classList.toString());
    console.log('7. Current summary classes:', summary.classList.toString());
    
    // Debug summary content
    console.log('8. Summary content:', {
        title: summary.querySelector('h2')?.textContent,
        moves: summary.querySelector('#final-moves')?.textContent,
        time: summary.querySelector('#final-time')?.textContent,
        highScores: summary.querySelector('#high-scores-list')?.innerHTML
    });
    
    // Debug computed styles
    const summaryStyle = window.getComputedStyle(summary);
    console.log('9. Summary computed styles:', {
        display: summaryStyle.display,
        visibility: summaryStyle.visibility,
        opacity: summaryStyle.opacity,
        transform: summaryStyle.transform,
        zIndex: summaryStyle.zIndex
    });

    // Trigger confetti celebration
    confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
    });

    setTimeout(() => {
        confetti({
            particleCount: 75,
            angle: 60,
            spread: 65,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 75,
            angle: 120,
            spread: 65,
            origin: { x: 1 }
        });
    }, 250);
    
    console.log('=== End Game Debug ===');
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
    console.log('=== Display High Scores Debug ===');
    console.log('1. High scores list element:', highScoresList);
    console.log('2. Current high scores list HTML:', highScoresList.innerHTML);
    
    const highScores = JSON.parse(localStorage.getItem('highScores') || '{}');
    console.log('3. Retrieved high scores:', highScores);
    
    highScoresList.innerHTML = '';

    Object.entries(highScores).forEach(([difficulty, score]) => {
        const li = document.createElement('li');
        li.textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: ${score.time} (${score.date})`;
        highScoresList.appendChild(li);
        console.log('4. Added high score:', li.textContent);
    });
    
    console.log('5. Final high scores list HTML:', highScoresList.innerHTML);
    console.log('=== End High Scores Debug ===');
}

// Toggle cheat mode
function toggleCheatMode() {
    console.log('=== Cheat Mode Debug ===');
    console.log('1. Button clicked, current cheatMode state:', gameState.cheatMode);
    
    // Toggle the state
    gameState.cheatMode = !gameState.cheatMode;
    console.log('2. New cheatMode state:', gameState.cheatMode);
    
    // Update button appearance
    if (gameState.cheatMode) {
        cheatButton.classList.add('active');
        console.log('3. Added active class to button');
    } else {
        cheatButton.classList.remove('active');
        console.log('3. Removed active class from button');
    }
    
    // Get all unmatched cards
    const cards = document.querySelectorAll('.card:not(.matched)');
    console.log('4. Found unmatched cards:', cards.length);
    
    // Process each card
    cards.forEach((card, index) => {
        const cardId = parseInt(card.dataset.id);
        const cardData = gameState.cards[cardId];
        
        console.log(`5. Processing card ${index + 1}:`, {
            cardId,
            isFlipped: cardData.isFlipped,
            isMatched: card.classList.contains('matched'),
            currentContent: card.textContent
        });
        
        if (gameState.cheatMode) {
            // Show the card but don't mark it as flipped
            card.textContent = cardData.emoji;
            card.classList.add('flipped');
            console.log(`6. Card ${index + 1} shown with emoji:`, cardData.emoji);
        } else {
            // Hide the card if it wasn't already flipped by the player
            if (!cardData.isFlipped) {
                card.textContent = '';
                card.classList.remove('flipped');
                console.log(`6. Card ${index + 1} hidden`);
            } else {
                console.log(`6. Card ${index + 1} was player-flipped, keeping visible`);
            }
        }
    });
    
    console.log('=== End Cheat Mode Debug ===');
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

// Add event listener for clicking outside the modal
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('visible');
        document.getElementById('game-summary').classList.remove('visible');
    }
});

// Setup event listeners
console.log('Setting up event listeners...');
gameBoard.addEventListener('click', handleCardClick);
newGameBtn.addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);
playAgainBtn.addEventListener('click', initGame);
cheatButton.addEventListener('click', toggleCheatMode);

// Start the game
console.log('Starting game...');
initGame();