/* global window, Neuroevolution, document, GameAI */

var manager = (function () {
    var gen;
    var generation = 0;
    var games = [];
//    var renderers = [];
    var storedResults = [];
    var par = 20,
        maxScore = 0,
        lastBestScore = 0,
        isStopped = false,
        neuvol = null;

    function start() {
        isStopped = false;
        if (neuvol) {
            nextGame();
            return;
        }

        neuvol = new Neuroevolution({
            population: 20,
            lowHistoric: true,
            network: [8, [6], 4],
        });

        //        for (var r = 0; r < par; r++) {
        //            var render = Matter.Render.create({
        //                element: document.getElementById('game-container'),
        //                engine: Matter.Engine.create(),
        //                options: {
        //                    width: 760,
        //                    height: 760,
        //                    wireframes: false
        //                }
        //            });
        //            renderers.push(render);
        //            Matter.Render.run(render);
        //        }

        this.generation = 0;
        this.startGeneration();
    }

    function stop() {
        isStopped = true;
    }

    function startGeneration() {
        gen = neuvol.nextGeneration();
        generation++;

        games = gen.map(function (boid) {
            return {
                boid: boid,
                game: null,
                score: undefined
            }
        });

        nextGame();
    }

    function nextGame() {
        if (isStopped) {
            return;
        }
        // spawn number of parallel games
        var parNow = 0;

        games.forEach(function (row) {
            if (!row.game && parNow < par) {
                var boid = row.boid;
                parNow++;

                row.game = new window.Worker('js/game-worker.js');
                row.game.postMessage({
                    name: 'specie',
                    specie: boid
                });
                row.game.onmessage = function (e) {
                    var score = e.data;
                    neuvol.networkScore(boid, score);
                    row.score = score;

                    maxScore = Math.max(maxScore, score);

                    nextGame();
                };
                row.game.onerror = function (e) {
                    window.console.log('error:', e);
                };
            }
        });

        if (games.filter(function (row) {
                return row.score === undefined;
            }).length === 0) {

            var bestScore =
                games.reduce(
                    function(acc, val) {
                        var isMax = (acc[1] == undefined || val.score > acc[1]);
                        acc[0] = isMax ? val.game : acc[0];
                        acc[1] = isMax ? val.score : acc[1];
                        acc[2] = isMax ? val.boid : acc[2];
                        return acc;
                    }, []
                );

            if (bestScore[1] > lastBestScore) {
                lastBestScore = bestScore[1];
                // store best of generation
                var x = document.getElementById("brains");
                var option = document.createElement("option");
                option.text = '' + generation + '. ' + bestScore[1];
                x.add(option);
                storedResults.push(bestScore[2]);
            }

            startGeneration();
        }
    }

    document.getElementById('brains').addEventListener('change', function () {
        document.getElementById('game-container').innerHTML = "";
        new GameAI(storedResults[document.getElementById('brains').selectedIndex], false, false);
        new GameAI(storedResults[document.getElementById('brains').selectedIndex], false, true);
    });

    return {
        start: start,
        stop: stop,
        startGeneration: startGeneration,
        nextGame: nextGame,
    }
})();

document.getElementById('startbutton').addEventListener('click', function () {
    manager.start();
});

document.getElementById('stopbutton').addEventListener('click', function () {
    manager.stop();
});
