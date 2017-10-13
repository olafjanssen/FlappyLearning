/* globals importScripts, self, GameAI, Neuroevolution */

/**
 * Web Worker wrapper script to start a game in learning mode.
 * It requires a message containing the specie/neural network of the computer player.
 **/

importScripts('../node_modules/matter-js/build/matter-dev.js');
importScripts('matter-game.js');
importScripts('Neuroevolution.js');

self.onmessage = function (event) {
    "use strict";
    var message = event.data;

    var gen = new Neuroevolution().nextGeneration();
    var specie = gen[0];
    specie.setSave(message.specie);
    specie.compute = specie.compute.bind(specie);

    if (message.name === 'specie') {
        new GameAI({
            compute: specie.compute,
            isLearning: true,
            isPlayable: false,
            onEnd: function (score) {
                self.postMessage(score);
                self.close();
            }
        });
    } else {
        self.console.log('unsupported message');
    }
};

// mocks for window/DOM properties that are used in the included scripts
function HTMLElement() {}
HTMLElement();
