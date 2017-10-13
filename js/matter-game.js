/* global window, document, self, Matter */

var GameAI = function (options) {
    "use strict";

    if (!options) {
        return;
    }

    var defaultOptions = {
        compute: function () {
            return [0, 0, 0, 0];
        },
        isLearning: false,
        isPlayable: false
    };
    options = Object.assign(defaultOptions, options);

    var keys,
        engine,
        running = true,
        score;

    var boxA, boxB;

    /**
     * Function that is called once at the beginning.
     */
    function create() {
        // set key-listeners
        keys = [];
        if (options.isPlayable) {
            window.onkeyup = function (e) {
                keys[e.keyCode] = false;
            };
            window.onkeydown = function (e) {
                keys[e.keyCode] = true;
            };
        }

        // create physics engine
        engine = Matter.Engine.create();

        // create game world
        boxA = Matter.Bodies.circle(350, 100, 12, {
            friction: 0,
            frictionAir: 0.05
        });
        boxB = Matter.Bodies.circle(350, 600, 12, {
            friction: 0,
            frictionAir: 0.05
        });

        engine.world.gravity.y = 0;
        engine.timing.timeScale = 2;

        Matter.World.add(engine.world, [boxA, boxB]);
        Matter.World.add(engine.world, [
                Matter.Bodies.rectangle(380, 755, 760, 10, {
                isStatic: true
            }),
                Matter.Bodies.rectangle(380, 5, 755, 10, {
                isStatic: true
            }),
        Matter.Bodies.rectangle(5, 380, 10, 760, {
                isStatic: true
            }),
        Matter.Bodies.rectangle(755, 380, 10, 760, {
                isStatic: true
            })
        ]);

        Matter.Events.on(engine, 'collisionStart', collision);

        // create renderer if showing
        if (!options.isLearning) {
            var render = Matter.Render.create({
                element: document.getElementById('game-container'),
                engine: engine,
                options: {
                    width: 760,
                    height: 760,
                    wireframes: false
                }
            });
            Matter.Render.run(render);
        }
    }

    /**
     * Function that is called once at the start/restart of the game
     */
    function start() {
        // reset game values
        running = true;
        score = 0;

        // reset physics engine
        Matter.Engine.clear(engine);

        // set position world objects
        boxA.position.x = 350;
        boxA.position.y = 100;
        boxB.position.x = 350;
        boxB.position.y = 600;


        // setting up the update cycle
        if (options.isLearning) {
            for (var frame = 0; frame < 1000; frame++) {
                if (!running) {
                    break;
                }
                update();
            }
            finish();
            return;
        } else {
            var runner = function () {
                if (running) {
                    window.requestAnimationFrame(function () {
                        update();
                        runner();
                    });
                } else {
                    finish();
                }
            };
            runner();
        }


    }

    /**
     * Function that is called at every update frame
     */
    function update() {
        Matter.Engine.update(engine);

        // update enemy
        if (options.isPlayable) {
            var keyInput = [keys[39], keys[37], keys[40], keys[38]];
            var pushPlayerDirection = Matter.Vector.create((keyInput[0] > 0.5 ? 1 : 0) - (keyInput[1] > 0.5 ? 1 : 0), (keyInput[2] > 0.5 ? 1 : 0) - (keyInput[3] > 0.5 ? 1 : 0));
            Matter.Body.applyForce(boxA, boxA.position, Matter.Vector.mult(pushPlayerDirection, 0.0003));
        } else {
            var forceDirection = Matter.Vector.normalise(Matter.Vector.sub(boxB.position, boxA.position));
            Matter.Body.applyForce(boxA, boxA.position, Matter.Vector.mult(forceDirection, 0.0003));
        }

        // update AI player
        var output = options.compute([
                    boxA.position.x / 760, boxA.position.y / 760,
            (boxA.velocity.x + 4) / 8, (boxA.velocity.y + 4) / 8,
                    boxB.position.x / 760, boxB.position.y / 760,
            (boxB.velocity.x + 4) / 8, (boxB.velocity.y + 4) / 8,
                ]);

        var pushDirection = Matter.Vector.create((output[0] > 0.5 ? 1 : 0) - (output[1] > 0.5 ? 1 : 0), (output[2] > 0.5 ? 1 : 0) - (output[3] > 0.5 ? 1 : 0));
        Matter.Body.applyForce(boxB, boxB.position, Matter.Vector.mult(pushDirection, 0.0003));

        score += Math.floor(Math.abs(boxB.speed));
    }

    /**
     * Called when objects collide in the physics engine
     */
    function collision(event) {
        if (engine.isEnabled) {
            return;
        }
        var pairs = event.pairs;
        pairs.forEach(function (pair) {
            if ((pair.bodyA == boxA && pair.bodyB == boxB) || (pair.bodyB == boxA && pair.bodyB == boxA)) {
                running = false;
                return;
            } else {
                score -= 10;
            }
        });
    }

    /**
     * Function called only once when the game should finish completely
     */
    function finish() {
        if (options.isLearning) {
            self.postMessage(score);
            self.close();
        }
    }


    // starting up the game
    create();
    start();
};

GameAI();
