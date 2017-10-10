var GameAI = function (render, handleCompute, onEnd) {

    var Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Events = Matter.Events,
        Bodies = Matter.Bodies,
        running = true,
        score = 0;

    var engine = Engine.create();

    //    var render = Render.create({
    //        element: document.getElementById('game-container'),
    //        //        canvas: document.getElementById('game'),
    //        engine: engine,
    //        options: {
    //            width: 760,
    //            height: 760,
    //            wireframes: false
    //        }
    //    });

    var boxA = Bodies.circle(350, 100, 12);
    var boxB = Bodies.circle(350, 600, 12);

    engine.world.gravity.y = 0;
    engine.timing.timeScale = 2;
    //    engine.positionIterations = 16;
    boxA.friction = 0;
    boxB.friction = 0;
    boxA.frictionAir = 0.05;
    boxB.frictionAir = 0.05;
    World.add(engine.world, [boxA, boxB]);

    World.add(engine.world, [
                Bodies.rectangle(380, 755, 760, 10, {
            isStatic: true
        }),
                Bodies.rectangle(380, 5, 755, 10, {
            isStatic: true
        }),
        Bodies.rectangle(5, 380, 10, 760, {
            isStatic: true
        }),
        Bodies.rectangle(755, 380, 10, 760, {
            isStatic: true
        })
        ]);

    Events.on(engine, "beforeUpdate", function () {
        // update enemy
        var forceDirection = Matter.Vector.normalise(Matter.Vector.sub(boxB.position, boxA.position));
        Matter.Body.applyForce(boxA, boxA.position, Matter.Vector.mult(forceDirection, 0.0003));

        // update AI player
        var output = handleCompute([
            boxA.position.x / 760, boxA.position.y / 760,
            (boxA.velocity.x + 4) / 8, (boxA.velocity.y + 4) / 8,
            boxB.position.x / 760, boxB.position.y / 760,
            (boxB.velocity.x + 4) / 8, (boxB.velocity.y + 4) / 8,
        ]);

        var pushDirection = Matter.Vector.create((output[0] > 0.5 ? 1 : 0) - (output[1] > 0.5 ? 1 : 0), (output[2] > 0.5 ? 1 : 0) - (output[3] > 0.5 ? 1 : 0));
        Matter.Body.applyForce(boxB, boxB.position, Matter.Vector.mult(pushDirection, 0.0003));

        score += Math.floor(Math.abs(boxB.speed));
    });

    Matter.Events.on(engine, 'collisionStart', function (event) {
        if (engine.isEnabled) {
            return;
        }
        var pairs = event.pairs;
        pairs.forEach(function (pair) {
            if ((pair.bodyA == boxA && pair.bodyB == boxB) || (pair.bodyB == boxA && pair.bodyB == boxA)) {
                running = false;
                console.log(engine.timing.timestamp);
                onEnd(score);
                return;
            } else {
                score -= 10;
            }
        });
    });

    function upd() {
        if (engine.timestamp > 30000) {
            running = false;
            onEnd(score);
            return;
        }

        Matter.Engine.update(engine);
        //        Matter.Render.world(render);
        if (running) {
            requestAnimationFrame(function () {
                upd();
            });
        }
    }

    render.engine = engine;
    upd();

}


// INITIER PHASER

var manager = (function () {
    var gen;
    var generation = 0;
    var games = [];
    var renderers = [];
    var par = 20;

    function start() {
        Neuvol = new Neuroevolution({
            population: 20,
            lowHistoric: true,
            network: [8, [6], 4],
        });

        for (var r = 0; r < par; r++) {
            var render = Matter.Render.create({
                element: document.getElementById('game-container'),
                //        canvas: document.getElementById('game'),
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

    function handleCompute(input) {
        return boid.compute(input);
    }

    function handleEndGame(score) {
        Neuvol.networkScore(boid, score);
        console.log(gen.length, score);
        nextGame();
    }

    function startGeneration() {
        gen = Neuvol.nextGeneration();
        generation++;
        console.log(generation, gen);

        games = gen.map(function (boid) {
            return {
                boid: boid,
                game: null,
                score: null
            }
        });

        nextGame();
    }

    function nextGame() {
        // spawn number of parallel games
        var parNow = 0;

        games.forEach(function (row, index) {
            if (!row.game && parNow < par) {
                parNow++;
                var boid = row.boid;
                console.log(index, renderers[index]);
                row.game = new GameAI(renderers[index], function (input) {
                    return boid.compute(input);
                }, function (score) {
                    Neuvol.networkScore(boid, score);
                    row.score = score;
                    games = games.filter(function (r) {
                        return r.boid !== boid;
                    });
                    console.log(games.length, score);
                    nextGame();
                });
            }
        });

        if (games.filter(function (row) {
                return !row.score;
            }).length === 0) {
            startGeneration();
        }
    }

    return {
        start: start,
        startGeneration: startGeneration,
        nextGame: nextGame,
        handleEndGame: handleEndGame,
        handleCompute: handleCompute
    }
})();

manager.start();
