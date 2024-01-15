
class BotController {
    /**  @param {Web2048} board */
    constructor(board) {
        this.board = board;
        this.root = document.querySelector('.panel .controls');
        this.playButton = this.root.querySelector('.play');
        this.stepButton = this.root.querySelector('.step');
        this.pauseButton = this.root.querySelector('.pause');
        this.botRunner = new Bot2048Runner(null);
        this.playing = false;
        Object.preventExtensions(this);
        this.playButton.addEventListener('click', this.play.bind(this));
        this.pauseButton.addEventListener('click', this.pause.bind(this));
        this.stepButton.addEventListener('click', this.step.bind(this));
        this.botRunner.addEventListener('play', this.disablePlay.bind(this));
        this.botRunner.addEventListener('pause', this.enablePlay.bind(this));
        this.disableAll();
    }

    disablePlay() {
        this.playButton.disabled = true;
        this.pauseButton.disabled = false;
        this.stepButton.disabled = true;
    }

    disableAll() {
        this.playButton.disabled = true;
        this.pauseButton.disabled = true;
        this.stepButton.disabled = true;
    }

    enablePlay() {
        this.playButton.disabled = false;
        this.pauseButton.disabled = true;
        this.stepButton.disabled = false;
    }

    /** @param {Bot2048} bot */
    setBot(bot) {
        if(this.botRunner.bot !== null) {
            this.pause();
            this.botRunner.detach(this.board);
        }
        this.botRunner.bot = bot;
        if(bot === null) {
            this.disableAll();
            return;
        } else {
            this.enablePlay();
        }
        this.botRunner.attach(this.board);
    }

    play() {
        if(this.playing) return;
        if(!this.botRunner.bot) return;
        this.playing = true;
        this.botRunner.play();
    }

    pause() {
        if(!this.playing) return;
        if(!this.botRunner.bot) return;
        this.playing = false;
        this.botRunner.pause();
    }

    step() {
        if(!this.botRunner.bot) return;
        this.botRunner.step();
    }

    hide() {
        this.root.style.display = 'none';
    }

    show() {
        this.root.style.display = 'block';
    }
}

class UIMode {
    /**
     * @param {Web2048} board
     * @param {(number)=>void} seedSetter
     * @param {BotController} botController
     * @param {HTMLElement} root
     */
    constructor(board, seedSetter, botController, root) {
        this.board = board;
        this.root = root;
        this.seedSetter = seedSetter;
        this.botController = botController;
    }
    enable() {
        this.root.style.display = 'block';
    }
    disable() {
        this.root.style.display = 'none';
    }
    reset() {}
}

class NormalMode extends UIMode {
    /**
     * @param {Web2048} board
     * @param {(number)=>void} seedSetter
     * @param {HTMLElement} container
     */
    constructor(board, seedSetter, botController, container) {
        super(board, seedSetter, botController, document.querySelector('.mode-normal'));
        /** @type {HTMLInputElement} */
        this.seedField = this.root.querySelector('#seed');
        this.useSeed = null;
        this.inputController = gameController(container, window);
        Object.preventExtensions(this);

        const useSeedCheckbox = this.root.querySelector('#use-seed');
        useSeedCheckbox.addEventListener('input', function(e) {
            this.seedField.disabled = !e.target.checked;
            this.useSeed = e.target.checked;
        }.bind(this));
        useSeedCheckbox.dispatchEvent(new Event('input'));
    }

    enable() {
        super.enable();
        this.botController.hide();
        this.botController.setBot(this.inputController);
        this.botController.play();
    }

    disable() {
        super.disable();
        this.botController.pause();
    }

    async reset() {
        this.botController.pause();
        var seed;
        if(this.useSeed) {
            seed = this.seedField.value;
        } else {
            this.seedField.value = seed = randomSeed();
        }
        this.seedSetter(seed);
        this.board._storage = localStorage;
        this.board.reset(sfc32(seed));
        this.board.start();
        await this.board.running;
        this.botController.play();
    }
}

class ReplayMode extends UIMode {
    constructor(board, seedSetter, botController) {
        super(board, seedSetter, botController, document.querySelector('.mode-replay'));
        this.historyEl = this.root.querySelector('.history');
        this.saveHighscoreEl = this.root.querySelector('.save-highscore');
        this.bot = null;
        Object.preventExtensions(this);
    }
    enable() {
        super.enable();
        this.botController.setBot(this.bot);
        this.botController.show();
    }
    disable() {
        super.disable();
        this.botController.pause();
    }
    reset() {
        const historyRaw = this.historyEl.value;
        if(historyRaw.length === 0) return;
        const history = historyRaw.split(';');
        if(history.length != 2) {
            alert('Invalid format');
            return;
        }
        const [seed, data] = history;
        const legalAction = this.botController.botRunner.legalAction;
        for(var i = 0; i < data.length; i++) {
            if(!data[i] in legalAction) {
                alert(`Invalid character ${JSON.stringify(data[i])}, index: ${i}`);
                return;
            }
        }
        this.seedSetter(seed);
        this.board._storage = this.saveHighscoreEl.checked ? localStorage : null;
        this.board.reset(sfc32(seed));
        this.board.start();
        this.bot = replayBot(data);
        this.botController.setBot(this.bot);
    }
}

class RandomMode extends UIMode {
    constructor(board, seedSetter, botController) {
        super(board, seedSetter, botController, document.querySelector('.mode-random'));
        this.useGameSeed = this.root.querySelector('.use-game-seed');
        this.useBotSeed = this.root.querySelector('.use-bot-seed');
        this.gameSeed = this.root.querySelector('.game-seed');
        this.botSeed = this.root.querySelector('.bot-seed');
        this.saveHighscore = this.root.querySelector('.save-highscore');
        this.bot = null;
        Object.preventExtensions(this);

        this.useGameSeed.addEventListener('input', function() {
            this.gameSeed.disabled = !this.useGameSeed.checked;
        }.bind(this));
        this.useBotSeed.addEventListener('input', function() {
            this.botSeed.disabled = !this.useBotSeed.checked;
        }.bind(this));
        this.useGameSeed.dispatchEvent(new Event('input'));
        this.useBotSeed.dispatchEvent(new Event('input'));
    }
    enable() {
        super.enable();
        this.botController.setBot(this.bot);
        this.botController.show();
    }
    disable() {
        super.disable();
        this.botController.pause();
    }
    reset() {
        this.botController.pause();
        var gameSeed;
        var botSeed;
        if(this.useGameSeed.checked) {
            gameSeed = this.gameSeed.value;
        } else {
            this.gameSeed.value = gameSeed = randomSeed();
        }
        if(this.useBotSeed.checked) {
            botSeed = this.botSeed.value;
        } else {
            this.botSeed.value = botSeed = randomSeed();
        }
        this.seedSetter(gameSeed);
        this.board._storage = this.saveHighscore.checked ? localStorage : null;
        this.board.reset(sfc32(gameSeed));
        this.board.start();
        this.bot = randomBot(sfc32(botSeed));
        this.botController.setBot(this.bot);
    }
}

(function() {
    const tileContainer = document.querySelector('.container');
    const historyEl = document.querySelector('.panel > .history');
    Web2048.fitText(tileContainer);

    var seed = null;
    var lastMode = null;
    const animationDuration = document.querySelector('.animation-duration');
    const modeEl = document.querySelector('#mode');
    const resetButton = document.querySelector('.panel .reset');
    const board = new Web2048(
        null,
        tileContainer,
        document.querySelector('.score-box > .score'),
        document.querySelector('.highscore-box > .score'),
        localStorage
    );
    const botController = new BotController(board);
    const modes = [
        new NormalMode(board, setSeed, botController, tileContainer),
        new ReplayMode(board, setSeed, botController),
        new RandomMode(board, setSeed, botController)
    ];

    function setSeed(newSeed) {
        seed = newSeed;
    }
    function updateHistory() {
        historyEl.textContent = `${seed};${board.history.join('')}`;
    }

    board.addEventListener('animationend', updateHistory);
    board.addEventListener('start', updateHistory);
    board.addEventListener('reach2048', function() {
        alert('Congratulation you reach 2048!');
    })
    board.addEventListener('gameover', function() {
        alert(`Game over!\nYour score is: ${this.score}`);
    });

    modeEl.addEventListener('input', function() {
        if(lastMode) lastMode.disable();
        lastMode = modes[this.selectedIndex];
        lastMode.enable();
    });
    resetButton.addEventListener('click', function() {
        lastMode.reset();
    });
    historyEl.addEventListener('click', function() {
        const tmp = document.getElementById('tmp');
        const text = historyEl.textContent;
        tmp.style.display = 'block';
        tmp.value = text;
        tmp.select();
        tmp.setSelectionRange(0, text.length);
        navigator.clipboard.writeText(text);
        tmp.style.display = 'none';
    });
    animationDuration.addEventListener('input', function() {
        var duration = parseInt(animationDuration.value);
        if(!(duration > 0)) duration = 150;
        document.firstElementChild.style.setProperty('--animation-duration', duration + 'ms');
    })

    modeEl.dispatchEvent(new Event('input'));
    resetButton.dispatchEvent(new Event('click'));
    animationDuration.dispatchEvent(new Event('input'));
})();
