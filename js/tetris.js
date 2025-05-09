/**
 * JsTetris - A JavaScript implementation of the popular Tetris game
 * Version 1.20
 * 
 * Copyright (c) Czarek Tomczak
 * License: BSD revised (free for any use)
 * https://github.com/cztomczak/jstetris
 */

function Tetris() {
    this.stats = new Stats();
    this.puzzle = null;
    this.area = null;
    this.unit = 14; // unit = x pixels
    this.areaX = 12; // area width = x units
    this.areaY = 22; // area height = y units
    this.puzzleX = 4; // puzzle width = x units
    this.puzzleY = 4; // puzzle height = y units
    this.piecesArray = null;
    this.next = null;
    // Next puzzle preview removed
    this.interval = null;
    this.running = false;
    this.speed = 700; // 1000 = 1 second
    this.speedUp = 50;
    this.sounds = true;
    this.soundFiles = {
        'line': 'sound/line.mp3',
        'gameover': 'sound/gameover.mp3',
        'rotate': 'sound/rotate.mp3',
        'move': 'sound/move.mp3'
    };
    this.soundsLoaded = 0;
    this.gameOver = false;
    this.paused = false;
    this.linePoints = 100;
    this.actions = 0;
    this.time = 0;
    this.apm = 0;
    this.init();
}

Tetris.prototype.init = function() {
    var self = this;
    
    // Hide loading screen immediately
    var loadingElement = document.getElementById('tetris-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    this.area = document.getElementById('tetris-area-data');
    // Next puzzle preview element removed
    this.stats.level = document.getElementById('tetris-stats-level');
    this.stats.time = document.getElementById('tetris-stats-time');
    this.stats.apm = document.getElementById('tetris-stats-apm');
    this.stats.lines = document.getElementById('tetris-stats-lines');
    this.stats.score = document.getElementById('tetris-stats-score');
    this.stats.nextLevel = 1000;
    this.stats.linesLeft = 10;
    this.piecesArray = [
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], // I
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0], // O
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0], // T
        [0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0], // S
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0], // Z
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0], // L
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0]  // J
    ];
    
    // Initialize the game area
    this.initArea();
    
    // Load sounds
    this.loadSounds();
    
    // Event listeners
    document.getElementById('tetris-menu-start').addEventListener('click', function() { self.start(); });
    document.getElementById('tetris-menu-pause').addEventListener('click', function() { self.pause(); });
    document.getElementById('tetris-menu-resume').addEventListener('click', function() { self.resume(); });
    document.getElementById('tetris-menu-highscores').addEventListener('click', function() { self.showHighscores(); });
    document.getElementById('tetris-menu-help').addEventListener('click', function() { self.showHelp(); });
    document.getElementById('tetris-help-close').addEventListener('click', function() { self.hideHelp(); });
    document.getElementById('tetris-highscores-close').addEventListener('click', function() { self.hideHighscores(); });
    document.getElementById('tetris-sound-on-off').addEventListener('click', function() { self.soundOnOff(); });
    document.getElementById('tetris-sound-off-on').addEventListener('click', function() { self.soundOffOn(); });
    
    // Make sure the area cover keys element is clickable to start the game
    var areaCoverKeys = document.getElementById('tetris-area-cover-keys');
    if (areaCoverKeys) {
        areaCoverKeys.style.cursor = 'pointer';
        areaCoverKeys.addEventListener('click', function() { self.start(); });
        areaCoverKeys.style.display = 'block';
        areaCoverKeys.style.zIndex = '1001';
    }
    
    // Position sound toggle button properly
    document.getElementById('tetris-sound-on').style.zIndex = '1002';
    document.getElementById('tetris-sound-off').style.zIndex = '1002';
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) { self.keyDown(e); });
    
    // Make sure the game area is visible
    var areaElement = document.getElementById('tetris-area');
    if (areaElement) {
        areaElement.style.display = 'block';
        areaElement.style.width = (this.areaX * this.unit) + 'px';
        areaElement.style.height = (this.areaY * this.unit) + 'px';
    }
};

Tetris.prototype.initArea = function() {
    // Clear the area
    if (this.area) {
        this.area.innerHTML = '';
        
        // Create the area grid
        for (var y = 0; y < this.areaY; y++) {
            for (var x = 0; x < this.areaX; x++) {
                var el = document.createElement('div');
                el.className = 'tetris-block';
                el.id = 'tetris-block-' + x + '-' + y;
                el.style.left = (x * this.unit) + 'px';
                el.style.top = (y * this.unit) + 'px';
                el.style.width = this.unit + 'px';
                el.style.height = this.unit + 'px';
                el.style.zIndex = '5';
                el.style.position = 'absolute';
                el.style.boxSizing = 'border-box';
                this.area.appendChild(el);
            }
        }
        
        // Make sure the area cover is properly positioned
        var areaCover = document.getElementById('tetris-area-cover');
        if (areaCover) {
            areaCover.style.width = (this.areaX * this.unit) + 'px';
            areaCover.style.height = (this.areaY * this.unit) + 'px';
            areaCover.style.display = 'none';
        }
        
        // Make sure the game area is visible
        var areaElement = document.getElementById('tetris-area');
        if (areaElement) {
            areaElement.style.display = 'block';
            areaElement.style.width = (this.areaX * this.unit) + 'px';
            areaElement.style.height = (this.areaY * this.unit) + 'px';
        }
    } else {
        console.error('Game area element not found');
    }
};

Tetris.prototype.loadSounds = function() {
    if (!this.sounds) {
        return;
    }
    
    var self = this;
    var soundsToLoad = Object.keys(this.soundFiles).length;
    
    for (var sound in this.soundFiles) {
        var audio = new Audio();
        audio.src = this.soundFiles[sound];
        
        // Add error handling for sound loading
        audio.addEventListener('error', function() {
            console.warn('Failed to load sound file');
            self.soundsLoaded++;
        });
        
        audio.addEventListener('canplaythrough', function() {
            self.soundsLoaded++;
        });
    }
};


Tetris.prototype.playSound = function(sound) {
    if (!this.sounds) return;
    
    var audio = new Audio();
    audio.src = this.soundFiles[sound];
    audio.play();
};

Tetris.prototype.keyDown = function(e) {
    if (!this.running || this.gameOver || this.paused) return;
    
    switch(e.keyCode) {
        case 37: // Left arrow
            this.movePuzzleLeft();
            break;
        case 38: // Up arrow
            this.rotatePuzzle();
            break;
        case 39: // Right arrow
            this.movePuzzleRight();
            break;
        case 40: // Down arrow
            this.movePuzzleDown();
            break;
        case 32: // Space
            this.dropPuzzle();
            break;
    }
};

Tetris.prototype.showHighscores = function() {
    document.getElementById('tetris-highscores').style.display = 'block';
};

Tetris.prototype.hideHighscores = function() {
    document.getElementById('tetris-highscores').style.display = 'none';
};

Tetris.prototype.showHelp = function() {
    document.getElementById('tetris-help').style.display = 'block';
};

Tetris.prototype.hideHelp = function() {
    document.getElementById('tetris-help').style.display = 'none';
};

Tetris.prototype.soundOnOff = function() {
    this.sounds = false;
    document.getElementById('tetris-sound-on').style.display = 'none';
    document.getElementById('tetris-sound-off').style.display = 'block';
};

Tetris.prototype.soundOffOn = function() {
    this.sounds = true;
    document.getElementById('tetris-sound-on').style.display = 'block';
    document.getElementById('tetris-sound-off').style.display = 'none';
};

Tetris.prototype.checkHighscore = function() {
    // Placeholder for highscore checking functionality
    // Would typically save the score if it's high enough
    return false;
};

Tetris.prototype.start = function() {
    console.log('Start function called');
    
    if (this.running) {
        console.log('Game already running, ignoring start call');
        return;
    }
    
    // Reset game state
    this.gameOver = false;
    this.paused = false;
    
    // Make sure stats elements exist before setting their innerHTML
    if (this.stats.level) this.stats.level.innerHTML = '1';
    if (this.stats.lines) this.stats.lines.innerHTML = '0';
    if (this.stats.score) this.stats.score.innerHTML = '0';
    if (this.stats.apm) this.stats.apm.innerHTML = '0';
    
    this.stats.nextLevel = 1000;
    this.stats.linesLeft = 10;
    this.actions = 0;
    this.time = 0;
    this.apm = 0;
    this.speed = 700;
    
    // Clear the area
    this.initArea();
    
    // Hide all overlay elements with error checking
    var gameoverElement = document.getElementById('tetris-gameover');
    if (gameoverElement) gameoverElement.style.display = 'none';
    
    var areaCoverElement = document.getElementById('tetris-area-cover');
    if (areaCoverElement) areaCoverElement.style.display = 'none';
    
    var areaCoverKeysElement = document.getElementById('tetris-area-cover-keys');
    if (areaCoverKeysElement) areaCoverKeysElement.style.display = 'none';
    
    var loadingElement = document.getElementById('tetris-loading');
    if (loadingElement) loadingElement.style.display = 'none';
    
    // Show pause button, hide resume button
    var pauseElement = document.getElementById('tetris-pause');
    if (pauseElement) pauseElement.style.display = 'block';
    
    var resumeElement = document.getElementById('tetris-resume');
    if (resumeElement) resumeElement.style.display = 'none';
    
    // Create the first piece
    this.next = Math.floor(Math.random() * this.piecesArray.length);
    // Next puzzle preview creation removed
    this.createPuzzle();
    
    // Start the game loop
    var self = this;
    this.interval = setInterval(function() {
        self.time += self.speed;
        self.apm = Math.round(self.actions / (self.time / 60000));
        if (self.stats.apm) self.stats.apm.innerHTML = self.apm.toString();
        self.movePuzzleDown();
    }, this.speed);
    
    // Make sure the game area has the correct dimensions
    var areaElement = document.getElementById('tetris-area');
    if (areaElement) {
        areaElement.style.display = 'block';
        areaElement.style.width = (this.areaX * this.unit) + 'px';
        areaElement.style.height = (this.areaY * this.unit) + 'px';
    }
    
    this.running = true;
    console.log('Game started successfully');
};


Tetris.prototype.pause = function() {
    if (!this.running || this.gameOver) return;
    
    clearInterval(this.interval);
    this.paused = true;
    this.running = false;
    
    // Show resume button, hide pause button
    document.getElementById('tetris-pause').style.display = 'none';
    document.getElementById('tetris-resume').style.display = 'block';
    
    // Show area cover
    document.getElementById('tetris-area-cover').style.display = 'block';
};

Tetris.prototype.resume = function() {
    if (this.running || this.gameOver) return;
    
    var self = this;
    this.interval = setInterval(function() {
        self.time += self.speed;
        self.apm = Math.round(self.actions / (self.time / 60000));
        self.stats.apm.innerHTML = self.apm.toString();
        self.movePuzzleDown();
    }, this.speed);
    
    // Force a small delay to ensure proper rendering
    setTimeout(function() {
        document.getElementById('tetris-area').style.width = (self.areaX * self.unit) + 'px';
    }, 100);
    
    this.paused = false;
    this.running = true;
    
    // Show pause button, hide resume button
    document.getElementById('tetris-pause').style.display = 'block';
    document.getElementById('tetris-resume').style.display = 'none';
    
    // Hide area cover
    document.getElementById('tetris-area-cover').style.display = 'none';
};

Tetris.prototype.createPuzzle = function() {
    console.log('Creating new puzzle');
    
    if (!this.area) {
        console.error('Game area not initialized');
        return;
    }
    
    if (!this.piecesArray) {
        console.error('Pieces array not initialized');
        return;
    }
    
    this.puzzle = {
        x: Math.floor(this.areaX / 2) - Math.floor(this.puzzleX / 2),
        y: 0,
        type: this.next,
        rotation: 0,
        blocks: []
    };
    
    // Create the next puzzle preview
    this.next = Math.floor(Math.random() * this.piecesArray.length);
    // Next puzzle preview creation removed
    
    // Create the puzzle blocks
    var piece = this.piecesArray[this.puzzle.type];
    if (!piece) {
        console.error('Piece not found for type:', this.puzzle.type);
        return;
    }
    
    // Apply rotation to the piece if needed
    var rotatedPiece = piece.slice();
    for (var r = 0; r < this.puzzle.rotation; r++) {
        var newPiece = [];
        for (var y = 0; y < this.puzzleY; y++) {
            for (var x = 0; x < this.puzzleX; x++) {
                newPiece[x * this.puzzleY + (this.puzzleY - y - 1)] = rotatedPiece[y * this.puzzleX + x];
            }
        }
        rotatedPiece = newPiece;
    }
    
    // Shark-themed block animations
    var blockAnimations = [
        'shimmer', 'pulse', 'glow', 'wave', 'flash', 'ripple', 'sparkle'
    ];
    var randomAnimation = blockAnimations[Math.floor(Math.random() * blockAnimations.length)];
    
    for (var y = 0; y < this.puzzleY; y++) {
        for (var x = 0; x < this.puzzleX; x++) {
            if (rotatedPiece[y * this.puzzleX + x] == 1) {
                var newX = this.puzzle.x + x;
                var newY = this.puzzle.y + y;
                
                // Only create blocks that are within the game area
                if (newX >= 0 && newX < this.areaX && newY >= 0 && newY < this.areaY) {
                    var block = document.createElement('div');
                    block.className = 'block' + this.puzzle.type;
                    block.style.left = (newX * this.unit) + 'px';
                    block.style.top = (newY * this.unit) + 'px';
                    block.style.width = this.unit + 'px';
                    block.style.height = this.unit + 'px';
                    block.style.zIndex = '1000';
                    block.style.position = 'absolute';
                    
                    // Add shark-themed styling
                    block.style.borderRadius = '2px';
                    block.style.boxShadow = 'inset 0 0 2px rgba(255, 255, 255, 0.5)';
                    
                    // Add a class to indicate this is a falling block (not locked)
                    block.classList.add('falling-block');
                    block.classList.add(randomAnimation);
                    
                    this.area.appendChild(block);
                    this.puzzle.blocks.push(block);
                }
            }
        }
    }
    
    // Check if the puzzle can be placed
    if (this.checkCollision()) {
        this.gameOver = true;
        this.running = false;
        clearInterval(this.interval);
        
        // Show game over message
        var gameoverElement = document.getElementById('tetris-gameover');
        if (gameoverElement) {
            gameoverElement.style.display = 'block';
            gameoverElement.innerHTML = '<img src="img/neon-shark.svg" width="50" height="50" style="vertical-align: middle;"> Game Over <img src="img/neon-shark.svg" width="50" height="50" style="vertical-align: middle; transform: scaleX(-1);">';
        }
        
        // Play game over sound
        this.playSound('gameover');
        
        // Check for high score
        this.checkHighscore();
    }
    
    console.log('Puzzle created successfully');
};


// Next puzzle preview functionality removed

Tetris.prototype.checkCollision = function() {
    var piece = this.piecesArray[this.puzzle.type];
    var rotation = this.puzzle.rotation;
    
    // Rotate the piece matrix according to the rotation
    for (var r = 0; r < rotation; r++) {
        var newPiece = [];
        for (var y = 0; y < this.puzzleY; y++) {
            for (var x = 0; x < this.puzzleX; x++) {
                newPiece[x * this.puzzleY + (this.puzzleY - y - 1)] = piece[y * this.puzzleX + x];
            }
        }
        piece = newPiece;
    }
    
    // Check for collisions
    for (var y = 0; y < this.puzzleY; y++) {
        for (var x = 0; x < this.puzzleX; x++) {
            if (piece[y * this.puzzleX + x] == 1) {
                var blockX = this.puzzle.x + x;
                var blockY = this.puzzle.y + y;
                
                // Check if the block is outside the area
                if (blockX < 0 || blockX >= this.areaX || blockY < 0 || blockY >= this.areaY) {
                    return true;
                }
                
                // Check if the block collides with another locked block
                // Only consider blocks that have the locked-block class or aren't tetris-block
                var block = document.getElementById('tetris-block-' + blockX + '-' + blockY);
                if (block && (block.className != 'tetris-block' || block.classList.contains('locked-block'))) {
                    return true;
                }
            }
        }
    }
    
    return false;
};

Tetris.prototype.movePuzzleDown = function() {
    if (!this.running || this.gameOver || this.paused) return;
    
    // Move the puzzle down
    this.puzzle.y++;
    
    // Check for collisions
    if (this.checkCollision()) {
        // Move the puzzle back up
        this.puzzle.y--;
        
        // Only lock the puzzle if it truly cannot move down anymore
        // This prevents premature locking
        if (this.puzzle.y > 0) {
            // Lock the puzzle in place
            this.lockPuzzle();
            
            // Check for completed lines
            this.checkLines();
            
            // Create a new puzzle
            this.createPuzzle();
        }
    } else {
        // Update the puzzle position
        this.updatePuzzle();
    }
};

Tetris.prototype.movePuzzleLeft = function() {
    if (!this.running || this.gameOver || this.paused) return;
    
    // Move the puzzle left
    this.puzzle.x--;
    
    // Check for collisions
    if (this.checkCollision()) {
        // Move the puzzle back right
        this.puzzle.x++;
    } else {
        // Update the puzzle position
        this.updatePuzzle();
        
        // Play move sound
        this.playSound('move');
        
        // Increment actions counter
        this.actions++;
    }
};

Tetris.prototype.movePuzzleRight = function() {
    if (!this.running || this.gameOver || this.paused) return;
    
    // Move the puzzle right
    this.puzzle.x++;
    
    // Check for collisions
    if (this.checkCollision()) {
        // Move the puzzle back left
        this.puzzle.x--;
    } else {
        // Update the puzzle position
        this.updatePuzzle();
        
        // Play move sound
        this.playSound('move');
        
        // Increment actions counter
        this.actions++;
    }
};

Tetris.prototype.rotatePuzzle = function() {
    if (!this.running || this.gameOver || this.paused) return;
    
    // Rotate the puzzle
    this.puzzle.rotation = (this.puzzle.rotation + 1) % 4;
    
    // Check for collisions
    if (this.checkCollision()) {
        // Rotate the puzzle back
        this.puzzle.rotation = (this.puzzle.rotation + 3) % 4;
    } else {
        // Update the puzzle position
        this.updatePuzzle();
        
        // Play rotate sound
        this.playSound('rotate');
        
        // Increment actions counter
        this.actions++;
    }
};

Tetris.prototype.dropPuzzle = function() {
    if (!this.running || this.gameOver || this.paused) return;
    
    // Drop the puzzle to the bottom
    while (!this.checkCollision()) {
        this.puzzle.y++;
    }
    
    // Move the puzzle back up
    this.puzzle.y--;
    
    // Update the puzzle position
    this.updatePuzzle();
    
    // Only lock the puzzle if it truly cannot move down anymore
    // This prevents premature locking
    if (this.puzzle.y > 0) {
        // Lock the puzzle in place
        this.lockPuzzle();
        
        // Check for completed lines
        this.checkLines();
        
        // Create a new puzzle
        this.createPuzzle();
    }
    
    // Increment actions counter
    this.actions++;
};

Tetris.prototype.updatePuzzle = function() {
    // Remove all existing blocks
    for (var i = 0; i < this.puzzle.blocks.length; i++) {
        var block = this.puzzle.blocks[i];
        if (block && block.parentNode) {
            block.parentNode.removeChild(block);
        }
    }
    
    // Clear the blocks array
    this.puzzle.blocks = [];
    
    // Create new blocks based on the current position and rotation
    var piece = this.piecesArray[this.puzzle.type];
    var rotatedPiece = piece.slice();
    
    // Apply rotation to the piece
    for (var r = 0; r < this.puzzle.rotation; r++) {
        var newPiece = [];
        for (var y = 0; y < this.puzzleY; y++) {
            for (var x = 0; x < this.puzzleX; x++) {
                newPiece[x * this.puzzleY + (this.puzzleY - y - 1)] = rotatedPiece[y * this.puzzleX + x];
            }
        }
        rotatedPiece = newPiece;
    }
    
    // Create new blocks at the current position
    for (var y = 0; y < this.puzzleY; y++) {
        for (var x = 0; x < this.puzzleX; x++) {
            if (rotatedPiece[y * this.puzzleX + x] == 1) {
                var newX = this.puzzle.x + x;
                var newY = this.puzzle.y + y;
                
                // Only create blocks that are within the game area
                if (newX >= 0 && newX < this.areaX && newY >= 0 && newY < this.areaY) {
                    var block = document.createElement('div');
                    block.className = 'block' + this.puzzle.type;
                    block.style.left = (newX * this.unit) + 'px';
                    block.style.top = (newY * this.unit) + 'px';
                    block.style.width = this.unit + 'px';
                    block.style.height = this.unit + 'px';
                    block.style.zIndex = '1000';
                    block.style.position = 'absolute';
                    block.classList.add('falling-block');
                    this.area.appendChild(block);
                    this.puzzle.blocks.push(block);
                }
            }
        }
    }
};

Tetris.prototype.lockPuzzle = function() {
    // Lock the puzzle blocks in place
    for (var i = 0; i < this.puzzle.blocks.length; i++) {
        var block = this.puzzle.blocks[i];
        var x = parseInt(block.style.left) / this.unit;
        var y = parseInt(block.style.top) / this.unit;
        
        // Verify this position is valid before locking
        if (x >= 0 && x < this.areaX && y >= 0 && y < this.areaY) {
            // Remove any existing block at this position (should be empty)
            var existingBlock = document.getElementById('tetris-block-' + x + '-' + y);
            if (existingBlock && existingBlock.className === 'tetris-block') {
                this.area.removeChild(existingBlock);
            }
            
            // Update the block ID to mark it as locked
            block.id = 'tetris-block-' + x + '-' + y;
            
            // Ensure blocks maintain proper dimensions and styling
            block.style.width = (this.unit - 1) + 'px';
            block.style.height = (this.unit - 1) + 'px';
            block.style.zIndex = '15';
            block.style.boxShadow = 'inset 0 0 2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.3)';
            block.style.borderWidth = '1px';
            block.style.position = 'absolute';
            block.style.overflow = 'hidden';
            
            // Add a class to indicate this is a locked block
            block.classList.add('locked-block');
            
            // Remove the falling-block class
            block.classList.remove('falling-block');
        }
    }
    
    // Clear the puzzle blocks array since they're now locked
    this.puzzle.blocks = [];
};


Tetris.prototype.checkLines = function() {
    var linesCleared = 0;
    
    // Check each row from bottom to top
    for (var y = this.areaY - 1; y >= 0; y--) {
        var lineComplete = true;
        
        // Check if all blocks in this row are filled
        for (var x = 0; x < this.areaX; x++) {
            var block = document.getElementById('tetris-block-' + x + '-' + y);
            if (!block || !block.classList.contains('locked-block')) {
                lineComplete = false;
                break;
            }
        }
        
        // If the line is complete, remove it and shift blocks down
        if (lineComplete) {
            linesCleared++;
            
            // Remove all blocks in this row
            for (var x = 0; x < this.areaX; x++) {
                var block = document.getElementById('tetris-block-' + x + '-' + y);
                if (block) {
                    block.className = 'tetris-block';
                    block.classList.remove('locked-block');
                }
            }
            
            // Move all blocks above this row down one row
            for (var y2 = y - 1; y2 >= 0; y2--) {
                for (var x = 0; x < this.areaX; x++) {
                    var block = document.getElementById('tetris-block-' + x + '-' + y2);
                    if (block && block.classList.contains('locked-block')) {
                        var blockBelow = document.getElementById('tetris-block-' + x + '-' + (y2 + 1));
                        if (blockBelow) {
                            blockBelow.className = block.className;
                            blockBelow.classList.add('locked-block');
                        }
                        block.className = 'tetris-block';
                        block.classList.remove('locked-block');
                    }
                }
            }
            
            // Check this row again since blocks have moved down
            y++;
        }
    }
    
    // Update score and level if lines were cleared
    if (linesCleared > 0) {
        // Play line clear sound
        this.playSound('line');
        
        // Update score
        var currentScore = parseInt(this.stats.score.innerHTML);
        var newScore = currentScore + (linesCleared * this.linePoints * parseInt(this.stats.level.innerHTML));
        this.stats.score.innerHTML = newScore.toString();
        
        // Update lines cleared
        var currentLines = parseInt(this.stats.lines.innerHTML);
        var newLines = currentLines + linesCleared;
        this.stats.lines.innerHTML = newLines.toString();
        
        // Check for level up
        this.stats.linesLeft -= linesCleared;
        if (this.stats.linesLeft <= 0) {
            // Level up
            var currentLevel = parseInt(this.stats.level.innerHTML);
            this.stats.level.innerHTML = (currentLevel + 1).toString();
            this.stats.linesLeft = 10;
            
            // Increase game speed
            this.speed -= this.speedUp;
            if (this.speed < 100) this.speed = 100; // Don't go too fast
            
            // Restart the game loop with the new speed
            clearInterval(this.interval);
            var self = this;
            this.interval = setInterval(function() {
                self.time += self.speed;
                self.apm = Math.round(self.actions / (self.time / 60000));
                if (self.stats.apm) self.stats.apm.innerHTML = self.apm.toString();
                self.movePuzzleDown();
            }, this.speed);
        }
    }
};

Tetris.prototype.keyDown = function(e) {
    if (!this.running || this.gameOver) return;
    
    var key = e.keyCode;
    
    switch (key) {
        case 37: // Left arrow
            this.movePuzzleLeft();
            break;
        case 39: // Right arrow
            this.movePuzzleRight();
            break;
        case 38: // Up arrow
            this.rotatePuzzle();
            break;
        case 40: // Down arrow
            this.movePuzzleDown();
            break;
        case 32: // Space
            this.dropPuzzle();
            break;
        case 80: // P key
            if (this.paused) {
                this.resume();
            } else {
                this.pause();
            }
            break;
    }
};

Tetris.prototype.showHighscores = function() {
    document.getElementById('tetris-highscores').style.display = 'block';
    
    // Load highscores from cookies
    var highscores = [];
    var cookies = document.cookie.split(';');
    
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf('tetris-highscore-') === 0) {
            var score = parseInt(cookie.substring(cookie.indexOf('=') + 1));
            highscores.push(score);
        }
    }
    
    // Sort highscores
    highscores.sort(function(a, b) { return b - a; });
    
    // Display highscores
    var html = '';
    for (var i = 0; i < Math.min(highscores.length, 10); i++) {
        html += '<div>' + (i + 1) + '. ' + highscores[i] + '</div>';
    }
    
    document.getElementById('tetris-highscores-content').innerHTML = html;
};

Tetris.prototype.hideHighscores = function() {
    document.getElementById('tetris-highscores').style.display = 'none';
};

Tetris.prototype.showHelp = function() {
    document.getElementById('tetris-help').style.display = 'block';
};

Tetris.prototype.hideHelp = function() {
    document.getElementById('tetris-help').style.display = 'none';
};

Tetris.prototype.checkHighscore = function() {
    var score = parseInt(this.stats.score.innerHTML);
    
    // Save the score to a cookie
    var date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
    document.cookie = 'tetris-highscore-' + date.getTime() + '=' + score + '; expires=' + date.toUTCString() + '; path=/';
    
    // Show the highscores
    this.showHighscores();
};

Tetris.prototype.soundOnOff = function() {
    this.sounds = false;
    document.getElementById('tetris-sound-on').style.display = 'none';
    document.getElementById('tetris-sound-off').style.display = 'block';
};

Tetris.prototype.soundOffOn = function() {
    this.sounds = true;
    document.getElementById('tetris-sound-on').style.display = 'block';
    document.getElementById('tetris-sound-off').style.display = 'none';
};

// Stats class is now defined in stats.js