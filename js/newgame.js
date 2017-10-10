// Template: One State

var level1 = {
    onGameOver: undefined,
    onComputeInput: undefined,
    score: 0,
    interval: 0,

    preload: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.load.image('p1ship', 'assets/jan.png');
        game.load.image('p2ship', 'assets/jan.png');
        game.stage.backgroundColor = '#EEEEEE';
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.textScore = new Text(game, 100, 100, 'Score: ' + this.score);
    },

    create: function () {
        var style = {
            font: "bold 32px Arial",
            fill: "#333",
            boundsAlignH: "center",
            boundsAlignV: "middle"
        };

        //  The Text is positioned at 0, 100
        this.text = game.add.text(0, 0, "Score: " + this.score, style);

        // P1: SHIP (BOTTOM)
        this.p1ship = game.add.sprite(350, 600, 'p1ship');
        this.p1ship.scale.setTo(0.25, 0.25);
        game.physics.arcade.enable(this.p1ship);
        this.p1ship.body.collideWorldBounds = true;

        // KEYS
        this.cursors = game.input.keyboard.createCursorKeys();

        // P2: SHIP
        this.p2ship = game.add.sprite(350, 100, 'p2ship');
        this.p2ship.scale.setTo(0.25, 0.25);
        game.physics.arcade.enable(this.p2ship);
        this.p2ship.body.collideWorldBounds = true;

        this.score = 0;

        //  By default the Signal is empty, so we create it here:
        this.p1ship.body.onWorldBounds = new Phaser.Signal();

        //  And then listen for it
        this.p1ship.body.onWorldBounds.add(function (sprite) {
            this.score -= 10;
        }, this);

    },

    /**
     * Restart the game
     */
    start: function () {
        this.p2ship.x = Math.r;
        this.p2ship.y = 100;
        this.p2ship.velocity.x = 0;
        this.p2ship.velocity.y = 0;

        this.p1ship.x = 250;
        this.p1ship.y = 500;
        this.p1ship.velocity.x = 0;
        this.p1ship.velocity.y = 0;

        this.score = 0;
    },

    update: function () {
        this.p1ship.body.velocity.x *= 0.95;
        this.p1ship.body.velocity.y *= 0.95;

        this.p2ship.body.velocity.x *= 0.95;
        this.p2ship.body.velocity.y *= 0.95;

        var output = this.onComputeInput([
            this.p1ship.x / 760, this.p1ship.y / 760,
            (this.p1ship.body.velocity.x + 200) / 400, (this.p1ship.body.velocity.y + 200) / 200,
            this.p2ship.x / 760, this.p2ship.y / 760,
            (this.p2ship.body.velocity.x + 200) / 400, (this.p2ship.body.velocity.y + 200) / 200,
        ]);

        this.p1ship.body.acceleration.x = 0;
        this.p1ship.body.acceleration.y = 0;
        if (output[0] > 0.5) {
            this.p1ship.body.acceleration.x += -600;
        } else if (output[1] > 0.5) {
            this.p1ship.body.acceleration.x += 600;
        }
        if (output[2] > 0.5) {
            this.p1ship.body.acceleration.y += -600;
        } else if (output[3] > 0.5) {
            this.p1ship.body.acceleration.y += 600;
        }

        this.interval++;
        if (this.interval === 10) {
            this.score += Math.floor(Math.abs(this.p1ship.body.velocity.x) + Math.abs(this.p1ship.body.velocity.y)); //Math.floor(1000./game.physics.arcade.distanceBetween(this.p1ship, this.p2ship));
            this.text.text = 'Score: ' + this.score;
            this.interval = 0;
        }

        var gameOver = this.onGameOver,
            score = this.score;
        game.physics.arcade.accelerateToObject(this.p2ship, this.p1ship, 600, 300, 300);
        game.physics.arcade.collide(this.p1ship, this.p2ship, function (p, e) {
            gameOver(score);
        });
    }

}; // end mainstate

// INITIER PHASER

var manager = (function () {
    var gen;
    var boid;
    var generation = 0;

    function start(level) {
        game = new Phaser.Game(760, 760, Phaser.AUTO, 'game');

        level.onGameOver = this.handleEndGame;
        level.onComputeInput = this.handleCompute;

        game.state.add('level1', level);

        Neuvol = new Neuroevolution({
            population: 10,
            lowHistoric: true,
            network: [8, [6], 4],
        });

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
        nextGame();
    }

    function nextGame() {
        Math.seedrandom();
        boid = gen.pop();
        // start a new game for every bird in the population
        if (boid) {
            //            Math.seedrandom('aap');
            game.state.start('level1');
        } else {
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

manager.start(level1);
