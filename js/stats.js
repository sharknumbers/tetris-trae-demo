/**
 * Stats class for JsTetris
 * Handles game statistics like score, level, lines, etc.
 */
function Stats() {
    this.level = null;
    this.time = null;
    this.apm = null;
    this.lines = null;
    this.score = null;
    this.nextLevel = 1000;
    this.linesLeft = 10;
    this.timerId = null;
    
    // Initialize stats to prevent null reference errors
    var self = this;
    setTimeout(function() {
        self.level = document.getElementById('tetris-stats-level');
        self.time = document.getElementById('tetris-stats-time');
        self.apm = document.getElementById('tetris-stats-apm');
        self.lines = document.getElementById('tetris-stats-lines');
        self.score = document.getElementById('tetris-stats-score');
    }, 0);
}

/**
 * Increment the game time
 */
Stats.prototype.incTime = function() {
    if (this.time) {
        var time = parseInt(this.time.innerHTML);
        this.time.innerHTML = (time + 1).toString();
    }
};

/**
 * Get the current score
 */
Stats.prototype.getScore = function() {
    return parseInt(this.score.innerHTML);
};

/**
 * Set the score
 */
Stats.prototype.setScore = function(score) {
    this.score.innerHTML = score.toString();
};

/**
 * Get the number of actions
 */
Stats.prototype.getActions = function() {
    return parseInt(this.apm.innerHTML);
};

/**
 * Set the number of actions
 */
Stats.prototype.setActions = function(actions) {
    this.apm.innerHTML = actions.toString();
};