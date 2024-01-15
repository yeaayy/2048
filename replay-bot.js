/** @returns {Bot2048} */
function replayBot(data){
    var i = 0;
    return {
        getAction: function(s) {
            return new Promise(function(resolve, reject) {
                if(i < data.length) {
                    resolve(parseInt(data.charAt(i++)));
                } else {
                    reject('out of action');
                }
            });
        },
        cancel: function() {},
        attach: function() {},
        detach: function() {}
    };
}
