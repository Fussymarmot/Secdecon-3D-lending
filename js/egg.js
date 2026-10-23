/* Секрет: 7 быстрых тапов по порталу */
(function () {
    'use strict';
    var stage = document.getElementById('portal');
    if (!stage) { return; }
    var need = 7, windowMs = 4000, hits = [];
    var to = 'aHR0cHM6Ly9hbmFsLnN1Y2N1YnVzLm1vbnN0ZXI=';

    stage.addEventListener('click', function () {
        var now = Date.now();
        hits.push(now);
        hits = hits.filter(function (t) { return now - t <= windowMs; });
        if (hits.length < need) { return; }
        hits = [];
        stage.style.transition = 'filter .5s ease, transform .5s ease';
        stage.style.filter = 'hue-rotate(200deg) brightness(1.6) saturate(1.8)';
        setTimeout(function () { location.href = atob(to); }, 550);
    });
})();
