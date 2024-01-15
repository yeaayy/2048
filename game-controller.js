
/**
 * @param {EventTarget} pointerTarget
 * @param {EventTarget} keyTarget
 * @returns {Bot2048}
 */
function gameController(pointerTarget, keyTarget) {
    var resolve = null;
    var reject = function() {};
    const queue = [];

    function move(dir) {
        if(resolve == null) {
            queue.push(dir);
        } else if(resolve(dir)) {
            resolve = null;
        }
    }

    var _sx, _sy;
    function pointerStart(x, y) {
        _sx = x;
        _sy = y;
    }

    function pointerEnd(x, y) {
        const dx = x - _sx;
        const dy = y - _sy;
        if(Math.hypot(dx, dy) < 30) return;
        if(Math.abs(dx) > Math.abs(dy)) {
            if(dx > 0) move(DIRECTION_RIGHT);
            else move(DIRECTION_LEFT);
        } else {
            if(dy > 0) move(DIRECTION_DOWN);
            else move(DIRECTION_UP);
        }
    }

    function ontouchstart(ev) {
        pointerStart(ev.touches[0].screenX, ev.touches[0].screenY)
    }

    function ontouchend(ev) {
        pointerEnd(ev.changedTouches[0].screenX, ev.changedTouches[0].screenY);
    }

    function onpointerdown(ev) {
        pointerStart(ev.screenX, ev.screenY);
    }

    function onpointerup(ev) {
        pointerEnd(ev.screenX, ev.screenY)
    }

    function onkeydown(e) {
        switch(e.key) {
            case 'ArrowLeft':
                move(DIRECTION_LEFT);
                break;
            case 'ArrowUp':
                move(DIRECTION_UP);
                break;
            case 'ArrowDown':
                move(DIRECTION_DOWN);
                break;
            case 'ArrowRight':
                move(DIRECTION_RIGHT);
                break;
            }
    }

    return {
        getAction: function(s) {
            return new Promise(function(_resolve, _reject) {
                reject = _reject;
                while(queue.length > 0) {
                    var action = queue.shift()
                    if(s.isValid(action)) {
                        _resolve(action);
                        return;
                    }
                }
                resolve = function(dir) {
                    if(s.isValid(dir)) {
                        _resolve(dir);
                        return true;
                    }
                    return false;
                };
            });
        },
        cancel: function() {
            reject("canceled");
            queue.splice(0, queue.length);
        },
        attach: function() {
            if(keyTarget) {
                keyTarget.addEventListener('keydown', onkeydown);
            }
            if(pointerTarget) {
                // pointerTarget.addEventListener('touchstart', ontouchstart);
                // pointerTarget.addEventListener('touchend', ontouchend);
                pointerTarget.addEventListener('pointerdown', onpointerdown);
                pointerTarget.addEventListener('pointerup', onpointerup);
            }
        },
        detach: function() {
            if(keyTarget) {
                keyTarget.removeEventListener('keydown', onkeydown);
            }
            if(pointerTarget) {
                // pointerTarget.removeEventListener('touchstart', ontouchstart);
                // pointerTarget.removeEventListener('touchend', ontouchend);
                pointerTarget.removeEventListener('pointerdown', onpointerdown);
                pointerTarget.removeEventListener('pointerup', onpointerup);
            }
            queue.splice(0, queue.length);
        }
    }
}
