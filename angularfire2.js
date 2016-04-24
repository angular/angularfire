System.register(['./angularfire2/angularfire2'], function(exports_1) {
    function exportStar_1(m) {
        var exports = {};
        for(var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters:[
            function (angularfire2_1_1) {
                exportStar_1(angularfire2_1_1);
            }],
        execute: function() {
        }
    }
});
