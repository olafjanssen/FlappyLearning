/* globals importScripts, self, GameAI */

importScripts('../node_modules/matter-js/build/matter-dev.js');
importScripts('matter-game.js');

self.onmessage = function (event) {
    "use strict";

    var message = event.data;
    if (message.name === 'specie') {
        new GameAI({
            specie: message.specie,
            isLearning: true,
            isPlayable: false
        });
    } else {
        self.console.log('unsupported message');
    }
};

// mocks for window/DOM properties that are used in the included scripts
function HTMLElement() {}
HTMLElement();
