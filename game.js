class BubbleShooter {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.timerElement = document.getElementById('timer');
        this.startBtn = document.getElementById('startBtn');
        
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.timeLeft = 60;
        this.isPlaying = false;
        this.bubbles = [];
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
        this.maxBubbles = 12; // Maximum bubbles allowed at once
        
        this.init();
    }

    init() {
        this.highScoreElement.textContent = this.highScore;
        this.startBtn.addEventListener('click', () => this.toggleGame());
        this.gameArea.addEventListener('click', (e) => this.handleClick(e));
    }

    toggleGame() {
        if (this.isPlaying) {
            this.endGame();
        } else {
            this.startGame();
        }
    }

    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.timeLeft = 60;
        this.scoreElement.textContent = '0';
        this.gameArea.innerHTML = '';
        this.bubbles = [];
        
        this.startBtn.textContent = 'Stop Game';
        this.gameLoop = setInterval(() => this.update(), 1000);
        this.spawnInterval = setInterval(() => this.spawnBubble(), 1000);
    }

    update() {
        this.timeLeft--;
        this.updateTimer();
        
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    spawnBubble() {
        if (!this.isPlaying || this.bubbles.length >= this.maxBubbles) return;

        const bubble = document.createElement('div');
        const size = Math.random() * (60 - 30) + 30;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        bubble.className = 'bubble';
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.backgroundColor = color;
        bubble.style.left = `${Math.random() * (this.gameArea.offsetWidth - size)}px`;
        bubble.style.top = `${Math.random() * (this.gameArea.offsetHeight - size)}px`;
        
        this.gameArea.appendChild(bubble);
        this.bubbles.push({
            element: bubble,
            color: color,
            points: Math.floor(100 / size * 10)
        });
    }

    handleClick(e) {
        if (!this.isPlaying) return;

        const clickX = e.clientX - this.gameArea.getBoundingClientRect().left;
        const clickY = e.clientY - this.gameArea.getBoundingClientRect().top;

        // Create a copy of the bubbles array to avoid modification during iteration
        const bubblesSnapshot = [...this.bubbles];
        
        bubblesSnapshot.forEach((bubble) => {
            const rect = bubble.element.getBoundingClientRect();
            const bubbleX = rect.left - this.gameArea.getBoundingClientRect().left + rect.width / 2;
            const bubbleY = rect.top - this.gameArea.getBoundingClientRect().top + rect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(clickX - bubbleX, 2) + 
                Math.pow(clickY - bubbleY, 2)
            );

            if (distance < rect.width / 2) {
                this.popBubble(bubble);
            }
        });
    }

    popBubble(bubble) {
        const index = this.bubbles.indexOf(bubble);
        if (index === -1) return; // Bubble already popped

        bubble.element.classList.add('pop-animation');
        this.score += bubble.points;
        this.scoreElement.textContent = this.score;
        
        // Remove bubble from array immediately to prevent double-popping
        this.bubbles.splice(index, 1);
        
        setTimeout(() => {
            bubble.element.remove();
        }, 300);

        // Chain reaction for nearby same-colored bubbles
        const nearbyBubbles = this.bubbles.filter(otherBubble => 
            otherBubble.color === bubble.color && 
            this.getDistance(bubble.element, otherBubble.element) < 100
        );

        nearbyBubbles.forEach(nearbyBubble => {
            setTimeout(() => this.popBubble(nearbyBubble), 100);
        });
    }

    getDistance(elem1, elem2) {
        const rect1 = elem1.getBoundingClientRect();
        const rect2 = elem2.getBoundingClientRect();
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;
        
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
        clearInterval(this.spawnInterval);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('highScore', this.highScore);
        }
        
        this.startBtn.textContent = 'Start Game';
        this.gameArea.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <h2>Game Over!</h2>
                <p>Final Score: ${this.score}</p>
            </div>
        `;
    }
}

// Initialize the game
new BubbleShooter();