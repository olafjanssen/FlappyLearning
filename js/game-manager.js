var manager = (function () {
    var gen;
    var generation = 0;
    var games = [];
    var renderers = [];
    var par = 20,
        maxScore = 0;

    function start() {
        Neuvol = new Neuroevolution({
            population: 20,
            lowHistoric: true,
            network: [8, [6], 4],
        });

        for (var r = 0; r < par; r++) {
            var render = Matter.Render.create({
                element: document.getElementById('game-container'),
                engine: Matter.Engine.create(),
                options: {
                    width: 760,
                    height: 760,
                    wireframes: false
                }
            });
            renderers.push(render);
            Matter.Render.run(render);
        }

        this.generation = 0;
        this.startGeneration();
    }

    function startGeneration() {
        gen = Neuvol.nextGeneration();
        generation++;
        console.log(generation, maxScore, gen);

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
        // spawn number of parallel games
        var parNow = 0;

        games.forEach(function (row, index) {
            if (!row.game && parNow < par) {
                var boid = row.boid;
                parNow++;

                row.game = new Worker('js/game-worker.js');
                row.game.postMessage(boid);
                row.game.onmessage = function (e) {
                    var score = e.data;
                    Neuvol.networkScore(boid, score);
                    row.score = score;

                    maxScore = Math.max(maxScore, score);

                    nextGame();
                };
                row.game.onerror = function(e) {
                    console.log('error:', e);
                };
            }
        });

        if (games.filter(function (row) {
                return row.score === undefined;
            }).length === 0) {
            startGeneration();
        }
    }

    return {
        start: start,
        startGeneration: startGeneration,
        nextGame: nextGame,
    }
})();

manager.start();
