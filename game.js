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
        this.maxBubbles = 12;
        this.processingClick = false;
        
        this.init();
        this.createBackgroundBubbles();
    }

    init() {
        this.highScoreElement.textContent = this.highScore;
        this.startBtn.addEventListener('click', () => this.toggleGame());
        this.gameArea.addEventListener('click', (e) => {
            if (!this.processingClick) {
                this.handleClick(e);
            }
        });
        this.updateTimer();
    }

    createBackgroundBubbles() {
        const bgContainer = document.getElementById('backgroundBubbles');
        for (let i = 0; i < 20; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bg-bubble';
            bubble.style.width = Math.random() * 100 + 50 + 'px';
            bubble.style.height = bubble.style.width;
            bubble.style.left = Math.random() * 100 + 'vw';
            bubble.style.top = Math.random() * 100 + 'vh';
            bubble.style.animationDuration = (Math.random() * 10 + 5) + 's';
            bubble.style.animationDelay = (Math.random() * 5) + 's';
            bgContainer.appendChild(bubble);
        }
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
        this.processingClick = false;
        
        this.startBtn.textContent = 'Stop Game';
        this.startBtn.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
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
            points: Math.floor(100 / size * 10),
            isPopping: false
        });
    }

    createChainEffect(x, y, color) {
        const effect = document.createElement('div');
        effect.className = 'chain-reaction';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        effect.style.backgroundColor = color;
        effect.style.width = '10px';
        effect.style.height = '10px';
        
        this.gameArea.appendChild(effect);
        setTimeout(() => effect.remove(), 500);
    }

    showScorePopup(x, y, points) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        this.gameArea.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    async handleClick(e) {
        if (!this.isPlaying) return;

        this.processingClick = true;
        const rect = this.gameArea.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const bubblesSnapshot = [...this.bubbles];
        
        for (const bubble of bubblesSnapshot) {
            if (bubble.isPopping) continue;

            const bubbleRect = bubble.element.getBoundingClientRect();
            const bubbleX = bubbleRect.left - rect.left + bubbleRect.width / 2;
            const bubbleY = bubbleRect.top - rect.top + bubbleRect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(clickX - bubbleX, 2) + 
                Math.pow(clickY - bubbleY, 2)
            );

            if (distance < bubbleRect.width / 2) {
                await this.popBubble(bubble, bubbleX, bubbleY);
                break;
            }
        }

        this.processingClick = false;
    }

    async popBubble(bubble, x, y) {
        const index = this.bubbles.indexOf(bubble);
        if (index === -1 || bubble.isPopping) return;

        bubble.isPopping = true;
        bubble.element.classList.add('popping');
        bubble.element.classList.add('pop-animation');
        this.score += bubble.points;
        this.scoreElement.textContent = this.score;
        this.showScorePopup(x, y, bubble.points);
        
        this.bubbles.splice(index, 1);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        bubble.element.remove();

        const nearbyBubbles = this.bubbles.filter(otherBubble => {
            if (otherBubble.isPopping || otherBubble.color !== bubble.color) return false;
            
            const distance = this.getDistance(bubble.element, otherBubble.element);
            return distance < 100;
        });

        if (nearbyBubbles.length > 0) {
            this.createChainEffect(x, y, bubble.color);
        }

        for (let i = 0; i < nearbyBubbles.length; i++) {
            const nearbyBubble = nearbyBubbles[i];
            const rect = nearbyBubble.element.getBoundingClientRect();
            const gameRect = this.gameArea.getBoundingClientRect();
            const bubbleX = rect.left - gameRect.left + rect.width / 2;
            const bubbleY = rect.top - gameRect.top + rect.height / 2;
            
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.popBubble(nearbyBubble, bubbleX, bubbleY);
        }
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
        this.startBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        
        this.gameArea.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <h2 style="font-size: 2em; margin-bottom: 15px;">Game Over!</h2>
                <p style="font-size: 1.5em;">Final Score: ${this.score}</p>
                ${this.score > this.highScore ? '<p style="color: #FFD700; margin-top: 10px;">🏆 New High Score! 🏆</p>' : ''}
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BubbleShooter();
});