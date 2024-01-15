
const DIRECTION_LEFT = 1;
const DIRECTION_UP = 2;
const DIRECTION_RIGHT = 3;
const DIRECTION_DOWN = 4;

class i2048 extends EventTarget {
    /**
     * @param {()=>number} rng
     */
    constructor(rng) {
        super();
        this.rng = rng;
        this.score = 0;
        this._maxValue = 0;
        this.running = new Promise((x)=>x());
    }

    _translate(dir) {
        switch(dir) {
            case DIRECTION_LEFT: return [1, 0, 0, 0, 0, 1];
            case DIRECTION_UP: return [0, 1, 0, 0, 1, 0];
            case DIRECTION_RIGHT: return [-1, 0, 3, 0, 0, 1];
            case DIRECTION_DOWN: return [0, -1, 0, 3, 1, 0];
        }
    }

    /** @returns {Promise<boolean>} */
    move(dir) {
        const [dirX, dirY, startX, startY, runX, runY] = this._translate(dir);
        var result = false;
        var scoreGain = 0;
        for(var i = 0, aX = startX, aY = startY; i < 4; i++, aX += runX, aY += runY) {
            var destX = aX, destY = aY;
            var iX = aX + dirX, iY = aY + dirY;
            for(var j = 0; j < 3; j++, iX += dirX, iY += dirY) {
                const current = this._getValue(iX, iY);
                if(current === 0) continue;
                const dest = this._getValue(destX, destY);
                if(dest === 0) {
                    this._tileMove(iX, iY, destX, destY);
                    result = true;
                } else if(current === dest) {
                    this._tileMerge(iX, iY, destX, destY, current * 2);
                    scoreGain += current * 2;
                    destX += dirX;
                    destY += dirY;
                    result = true;
                } else if(current.x == (destX + dirX) && current.y == (destY + dirY)) {
                    destX += dirX;
                    destY += dirY;
                    continue;
                } else {
                    // move tile and ceret
                    destX += dirX;
                    destY += dirY;
                    if(iX != destX || iY != destY) {
                        this._tileMove(iX, iY, destX, destY);
                        result = true;
                    }
                }
            }
        }
        if(scoreGain > 0) {
            this.score += scoreGain;
            this.dispatchEvent(new Event('scorechange'));
        }
        return new Promise(function(resolve) {
            resolve(result);
        });
    }

    isValid(dir) {
        // This is just simplified move function
        const [dirX, dirY, startX, startY, runX, runY] = this._translate(dir);
        for(var i = 0, aX = startX, aY = startY; i < 4; i++, aX += runX, aY += runY) {
            var destX = aX, destY = aY;
            var iX = aX + dirX, iY = aY + dirY;
            for(var j = 0; j < 3; j++, iX += dirX, iY += dirY) {
                const current = this._getValue(iX, iY);
                if(current === 0) continue;
                const dest = this._getValue(destX, destY);
                if(dest === 0) {
                    return true;
                } else if(current === dest) {
                    return true;
                } else if(current.x == (destX + dirX) && current.y == (destY + dirY)) {
                    destX += dirX;
                    destY += dirY;
                    continue;
                } else {
                    destX += dirX;
                    destY += dirY;
                    if(iX != destX || iY != destY) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    async start() {
        this.running = Promise.all([
            this.putRandomTile(),
            this.putRandomTile()
        ]);
        await this.running;
        this.dispatchEvent(new Event('start'));
    }

    putRandomTile() {
        var x, y;
        do {
            x = Math.floor(this.rng() * 4);
            y = Math.floor(this.rng() * 4);
        } while(this._getValue(x, y) !== 0);
        const value = this.rng() < 0.1 ? 4 : 2;
        return this._putTile(x, y, value);
    }

    check() {
        for(var y = 0; y < 4; y++) {
            for(var x = 0; x < 4; x++) {
                if(this._getValue(x, y) == 0) {
                    return true;
                }
            }
        }
        for(var y = 0; y < 4; y++) {
            for(var x = 0; x < 3; x++) {
                const a = this._getValue(x, y);
                const b = this._getValue(x + 1, y);
                if(a === b) return true;
            }
            for(var x = 0; x < 3; x++) {
                const a = this._getValue(y, x);
                const b = this._getValue(y, x + 1);
                if(a === b) return true;
            }
        }
        return false;
    }

    _getValue(x, y) { return 0; }
    _tileMove(srcX, srcY, dstX, dstY) {}
    _tileMerge(srcX, srcY, dstX, dstY, newValue) {}
    /** @abstract @returns {Promise<void>} */
    _putTile(x, y, value) {}
}
