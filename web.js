
const DATA_NAME = '2048';

class WebTile {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} value
     */
    constructor(x, y, value) {
        this._id = Math.floor(Math.random() * 999999).toString(34);
        this._x = x;
        this._y = y;
        this._value = value;
        this._newX = null;
        this._newY = null;
        this._newValue = null;
        /** @type {WebTile} */
        this.mergeFrom = null;

        this.element = document.createElement('div');
        this.element.appendChild(document.createElement('div'));
        this.element.classList.add('tile', '_' + this._id);
        this.element.classList.add(`x${x + 1}`);
        this.element.classList.add(`y${y + 1}`);
        this.element.classList.add('v' + value);
        Object.preventExtensions(this);
    }

    get x() {
        return this._x;
    }

    set x(newX) {
        if(newX == this._x) return;
        this._newX = newX;
    }

    get y() {
        return this._y;
    }

    set y(newY) {
        if(newY == this._y) return;
        this._newY = newY;
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._newValue = newValue;
    }

    update(resolve) {
        if(this._newX !== null) this.replace(`x${this._x + 1}`, `x${this._newX + 1}`)
        if(this._newY !== null) this.replace(`y${this._y + 1}`, `y${this._newY + 1}`)
        const x = this._newX ?? this._x;
        const y = this._newY ?? this._y;
        this._newX = null;
        this._newY = null;
        if(this.mergeFrom) {
            this.mergeFrom.element.addEventListener('transitionend', function() {
                this.detach();
                resolve();
            }.bind(this), {once: true});
        } else if(this._newValue !== null) {
            this.element.addEventListener('transitionend', function() {
                this.replace('v' + this._value, 'v' + this._newValue);
                this._value = this._newValue;
                this._newValue = null;
                this.pop(resolve);
            }.bind(this), {once: true});
        } else {
            this.element.addEventListener('transitionend', function() {
                resolve();
            }.bind(this), {once: true});
        }
        this._x = x;
        this._y = y;
    }

    replace(old, _new) {
        this.element.classList.remove(old);
        this.element.classList.add(_new);
    }

    attach(container) {
        const el = this.element;
        container.appendChild(el);
        el.classList.add('pop-show');
        return new Promise(function(resolve) {
            el.addEventListener('animationend', function() {
                el.classList.remove('pop-show');
                resolve();
            }, {once: true});
        });
    }

    detach() {
        if(!this.element.parentElement) return;
        this.element.parentElement.removeChild(this.element);
    }

    pop(resolve) {
        if(this.element.classList.contains('pop-merge')) return;
        this.element.addEventListener('animationend', function(){
            this.element.classList.remove('pop-merge');
            resolve();
        }.bind(this), {once: true});
        this.element.classList.add('pop-merge');
    }
}

class Web2048 extends i2048 {
    /**
     * @param {()=>number} rng
     * @param {HTMLElement} containerEl
     * @param {HTMLElement?} scoreEl
     * @param {HTMLElement?} highscoreEl
     * @param {Storage?} storage
     */
    constructor(rng, containerEl, scoreEl, highscoreEl, storage) {
        super(rng);
        this._containerEl = containerEl;
        this._highscoreEl = highscoreEl;
        this._scoreEl = scoreEl;
        this._storage = storage;
        /** @type {WebTile[][]} */
        this._tile = [new Array(4), new Array(4), new Array(4), new Array(4)];
        /** @type {WebTile[]} */
        this._tiles = [];
        /** @type {{{highScore: number}}} */
        this._data = null;
        this.addEventListener('animationend', this._onanimationend.bind(this));
        if(storage) {
            this._data = JSON.parse(storage.getItem(DATA_NAME));
        }
        this._data ??= {highScore: 0};
        this.reset(null);
        Object.preventExtensions(this);
    }

    reset(rng) {
        this.rng = rng ?? this.rng;
        this.win = false;
        this.maxTile = 0;
        this.score = 0;
        this.history = [];
        for(var y = 0; y < 4; y++) {
            for(var x = 0; x < 4; x++) {
                const tile = this._tile[y][x];
                if(tile) tile.detach();
                this._tile[y][x] = null;
            }
        }
        this._updateScore();
    }

    debugTile(container) {
        var value = 1;
        for(var y = 0; y < 4; y++) {
            for(var x = 0; x < 4; x++) {
                new WebTile(x, y, value *= 2, null).attach(container);
            }
        }
    }

    _getValue(x, y) {
        if(!this._tile[y][x]) return 0;
        return this._tile[y][x].value;
    }

    _tileMove(srcX, srcY, dstX, dstY) {
        const src = this._tile[srcY][srcX];
        src.x = dstX;
        src.y = dstY;
        this._tile[srcY][srcX] = null;
        this._tile[dstY][dstX] = src;
        this._tiles.push(src);
    }

    _tileMerge(srcX, srcY, dstX, dstY, newValue) {
        const src = this._tile[srcY][srcX];
        const dst = this._tile[dstY][dstX];
        src.value = newValue;
        dst.value = 0;
        src.x = dstX;
        src.y = dstY;
        this._tile[srcY][srcX] = null;
        this._tile[dstY][dstX] = src;
        dst.mergeFrom = src;
        this._tiles.push(src);
        if(this._tiles.indexOf(dst) == -1) {
            this._tiles.push(dst);
        }
    }

    _putTile(x, y, value) {
        const tile = new WebTile(x, y, value);
        this._tile[y][x] = tile;
        return tile.attach(this._containerEl);
    }

    _save() {
        if(!this._storage) return;
        this._storage.setItem(DATA_NAME, JSON.stringify(this._data));
    }

    _updateScore() {
        if(this.score > this._data.highScore && this._storage) {
            this._data.highScore = this.score;
            this._storage.setItem(DATA_NAME, JSON.stringify(this._data));
        }
        if(this._scoreEl) this._scoreEl.textContent = this.score;
        if(this._highscoreEl) this._highscoreEl.textContent = this._data.highScore;
    }

    _onanimationend() {
        this._updateScore();
        this.putRandomTile().then(function() {
            this.dispatchEvent(new Event('tilepop'));
            if(!this.check()) {
                this.dispatchEvent(new Event('gameover'));
            }
        }.bind(this));
    }

    async move(dir) {
        await this.running;
        this._tiles.splice(0, this._tiles.length);
        if(!await super.move(dir)) return false;
        this.history.push(dir);
        const promises = [];
        for(var i in this._tiles) {
            const t = this._tiles[i];
            promises.push(new Promise(function(resolve) {
                t.update(resolve);
            }));
            if(t._newValue > this.maxTile) {
                this.maxTile = t._newValue;
            }
        }
        await (this.running = Promise.all(promises));
        this.dispatchEvent(new Event('animationend'));
        if(this.maxTile == 2048 && !this.win) {
            this.win = true;
            this.dispatchEvent(new Event('reach2048'));
        }
        return true;
    }

    static fitText(container, startSize = 15, sizeIncrement = 0.1, preserveSpace = 8) {
        startSize += sizeIncrement;
        const check = [64, 512, 8192, 65536];
        const outer = document.createElement('div');
        const inner = document.createElement('div');
        const rootStyle = document.firstElementChild.style;
        outer.appendChild(inner);
        outer.classList.add('tile', 'x1', 'y1');
        container.appendChild(outer);
        for(var i = 0; i < 4; i++) {
            outer.classList.add('v' + check[i]);
            do {
                startSize -= sizeIncrement;
                rootStyle.setProperty('--size' + i, startSize + 'vmin');
            } while(outer.clientWidth - preserveSpace < inner.clientWidth);
            outer.classList.remove ('v' + check[i]);
        }
        container.removeChild(outer);
    }
}
