function HTMLElement() {};

importScripts('../node_modules/matter-js/build/matter-dev.js');

var activation = function (a) {
    ap = (-a) / 1;
    return (1 / (1 + Math.exp(ap)))
};

/**
 * Compute the output of an input.
 *
 * @param {inputs} Set of inputs.
 * @return Network output.
 */
var compute = function (net, inputs) {
    // Set the value of each Neuron in the input layer.
    for (var i in inputs) {
        if (net.layers[0] && net.layers[0].neurons[i]) {
            net.layers[0].neurons[i].value = inputs[i];
        }
    }

    var prevLayer = net.layers[0]; // Previous layer is input layer.
    for (var i = 1; i < net.layers.length; i++) {
        for (var j in net.layers[i].neurons) {
            // For each Neuron in each layer.
            var sum = 0;
            for (var k in prevLayer.neurons) {
                // Every Neuron in the previous layer is an input to each Neuron in
                // the next layer.
                sum += prevLayer.neurons[k].value *
                    net.layers[i].neurons[j].weights[k];
            }

            // Compute the activation of the Neuron.
            net.layers[i].neurons[j].value = activation(sum);
        }
        prevLayer = net.layers[i];
    }

    // All outputs of the Network.
    var out = [];
    var lastLayer = net.layers[net.layers.length - 1];
    for (var i in lastLayer.neurons) {
        out.push(lastLayer.neurons[i].value);
    }
    return out;
}



var GameAI = function (boid) {

    var running = true,
        score = 0;

    var engine = Matter.Engine.create();

    var boxA = Matter.Bodies.circle(350, 100, 12);
    var boxB = Matter.Bodies.circle(350, 600, 12);

    engine.world.gravity.y = 0;
    engine.timing.timeScale = 2;

    boxA.friction = 0;
    boxB.friction = 0;
    boxA.frictionAir = 0.05;
    boxB.frictionAir = 0.05;

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

    Matter.Events.on(engine, "beforeUpdate", function () {
        // update enemy
        var forceDirection = Matter.Vector.normalise(Matter.Vector.sub(boxB.position, boxA.position));
        Matter.Body.applyForce(boxA, boxA.position, Matter.Vector.mult(forceDirection, 0.0003));

        // update AI player
        var output = compute(boid, [
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
                return;
            } else {
                score -= 10;
            }
        });
    });


    //    render.engine = engine;
    for (var frame = 0; frame < 1000; frame++) {
        if (!running) {
            break;
        }
        Matter.Engine.update(engine);
    }

    postMessage(score);
    close();
}


onmessage = function (e) {
    var game = new GameAI(e.data);
}
