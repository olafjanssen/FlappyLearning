/* global window, Neuroevolution, document, GameAI */

var manager = (function () {
    "use strict";

    var generation = 0,
        useWorkers = true,
        lastBestScore = 0,
        storedResults = [],
        isStopped = false,
        neuvol = null,
        games = [],
        par = 20;

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

        this.generation = 0;
        this.startGeneration();
    }

    function stop() {
        isStopped = true;
    }

    function startGeneration() {
        var gen = neuvol.nextGeneration();
        generation++;

        games = gen.map(function (specie) {
            return {
                specie: specie,
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
                var specie = row.specie;
                parNow++;

                specie.compute = specie.compute.bind(specie);

                if (!useWorkers) {
                    row.game = new GameAI({
                        compute: specie.compute,
                        isRendered: true,
                        isPlayable: false,
                        onEnd: function (score) {
                            neuvol.networkScore(specie, score);
                            row.score = score;
                            nextGame();
                        }
                    });
                } else {
                    row.game = new window.Worker('js/game-worker.js');
                    row.game.postMessage({
                        name: 'specie',
                        specie: specie.getSave() // send serialized form of network
                    });
                    row.game.onmessage = function (e) {
                        var score = e.data;
                        neuvol.networkScore(specie, score);
                        row.score = score;

                        nextGame();
                    };
                    row.game.onerror = function (e) {
                        window.console.log('error:', e);
                    };
                }
            }
        });

        if (games.filter(function (row) {
                return row.score === undefined;
            }).length === 0) {

            var bestScore =
                games.reduce(
                    function (acc, val) {
                        var isMax = (acc.score == undefined || val.score > acc.score);
                        acc.game = isMax ? val.game : acc.game;
                        acc.score = isMax ? val.score : acc.score;
                        acc.specie = isMax ? val.specie : acc.specie;
                        return acc;
                    }, []
                );

            if (bestScore.score > lastBestScore) {
                lastBestScore = bestScore.score;

                // store best of generation
                var x = document.getElementById("brains");
                var option = document.createElement("option");
                option.text = '' + generation + '. ' + bestScore.score;
                x.add(option);
                storedResults.push(bestScore.specie);
            }

            // destroy all games
            games.forEach(function (item) {
                if(!useWorkers){
                    item.game.destroy();
                } else {
                    item.game.terminate();
                }
            });

            startGeneration();
        }
    }

    document.getElementById('brains').addEventListener('change', function () {
        document.getElementById('game-container').innerHTML = "";
        var specie = storedResults[document.getElementById('brains').selectedIndex];
        specie.compute = specie.compute.bind(specie);

        new GameAI({
            compute: specie.compute,
            isRendered: true,
            isPlayable: false
        });
        new GameAI({
            compute: specie.compute,
            isRendered: true,
            isPlayable: true
        });
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
