
/**
 * @typedef Bot2048
 * @property {(g: i2048)=>Promise<number>} getAction
 * @property {()=>void} cancel
 * @property {()=>void} attach
 * @property {()=>void} detach
 */

class Bot2048Runner extends EventTarget {
    /**
     * @param {Bot2048} bot
     */
    constructor(bot) {
        super();
        this.bot = bot;
        /** @type {()=>void} */
        this.event = null;
        this.playing = false;
        this.once = false;
        const legalAction = {};
        legalAction[DIRECTION_LEFT] = true;
        legalAction[DIRECTION_UP] = true;
        legalAction[DIRECTION_RIGHT] = true;
        legalAction[DIRECTION_DOWN] = true;
        this.legalAction = legalAction;
        Object.preventExtensions(legalAction);
        Object.preventExtensions(this);
    }

    /** @param {i2048} board */
    doAction(board) {
        if(!this.playing) return;
        if(this.once) {
            this.playing = false;
            this.once = false;
        }
        if(!board.check()) {
            this.pause();
            return;
        }
        var _action ;
        this.bot.getAction(board).then(function(action) {
            _action = action;
            if(!(action in this.legalAction)) {
                return false;
            }
            return board.move(action);
        }.bind(this)).then(function(result) {
            if(result) return;
            alert('Invalid action: ' + result);
            this.pause();
        }.bind(this)).catch(function(cause) {
            if(this.playing) this.pause();
        }.bind(this));
    }

    /** @param {i2048} board */
    attach(board) {
        this.event = function() {
            this.doAction(board);
        }.bind(this);
        board.addEventListener('tilepop', this.event);
        this.bot.attach();
        return this;
    }

    /** @param {i2048} board */
    detach(board) {
        board.removeEventListener('tilepop', this.event);
        this.bot.cancel();
        this.bot.detach();
    }

    async play() {
        this.playing = true;
        this.event();
        this.dispatchEvent(new Event('play'));
    }

    step() {
        if(this.playing) this.pause();
        this.playing = true;
        this.once = true;
        this.event();
    }

    pause() {
        this.playing = false;
        if(this.bot) {
            this.bot.cancel();
        }
        this.dispatchEvent(new Event('pause'));
    }
}
