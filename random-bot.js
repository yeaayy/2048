
/** @returns {Bot2048} */
function randomBot(rng) {
    const dir = [
        DIRECTION_LEFT,
        DIRECTION_UP,
        DIRECTION_RIGHT,
        DIRECTION_DOWN,
    ];
    return {
        getAction: function(g) {
            return new Promise(function(resolve, reject) {
                if(!g.check()) {
                    reject('No valid move available');
                    return;
                }
                var action;
                do {
                    action = dir[Math.floor(rng() * dir.length)];
                } while(!g.isValid(action));
                resolve(action);
            });
        },
        attach: function() {},
        detach: function() {},
        cancel: function() {}
    };
}
