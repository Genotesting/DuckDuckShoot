// INSPIRED BY BRYANT ODEN - DUCK SONG
const config = {
    type: Phaser.AUTO,
    width: 1520,
    height: 712,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    }
};

const game = new Phaser.Game(config);

let throwCooldown = false;
let duckabilityCounter = 0;
let totalDucksSpawned = 0;
let grapesPurchasedCount = 0; 
let shopOpen = false;
let arsenalOpen = false;
const duckPrices = {
    'sharpducky': 1000,
    'quacksilver': 3000,
    'grapes' : 750
};
let ownedDucks = ['rubberDuck'];

let grapesPurchased = false; // Track if grapes are purchased

function applyGrapesEffect() {
    if (!grapesPurchased) {
        grapesPurchased = true;
        console.log("Grapes effect applied: +5% throwing speed");
    }
}

function getGrapesPrice() {
    let basePrice = 750;
    return Math.round(basePrice * Math.pow(1.5, grapesPurchasedCount));
}


function preload() {
    // Get ready for some serious assets loading
    this.load.image('duck', 'Sandwich/duck.png');
    this.load.image('rubberDuck', 'Sandwich/rubber_duck.png');
    this.load.image('sharpduckySprite', 'Sandwich/sharpducky.png');
    this.load.image('quacksilverSprite', 'Sandwich/quacksilver.png');
    this.load.audio('squeak', 'Sandwich/squeak.mp3');
    this.load.audio('quack', 'Sandwich/quack.mp3');
    this.load.audio('backgroundTrack1', 'Sandwich/Background.mp3');
    this.load.image('orangeDuck', 'Sandwich/orangeduck.png');

    // The real game starts here, those feathers aren't going to spawn themselves
    this.load.image('feathernorth', 'Sandwich/feathernorth.png');
    this.load.image('feathernortheast', 'Sandwich/feathernortheast.png');
    this.load.image('feathereast', 'Sandwich/feathereast.png');
    this.load.image('feathersoutheast', 'Sandwich/feathersoutheast.png');
    this.load.image('feathersouth', 'Sandwich/feathersouth.png');
    this.load.image('feathersouthwest', 'Sandwich/feathersouthwest.png');    
    this.load.image('featherwest', 'Sandwich/featherwest.png');
    this.load.image('feathernorthwest', 'Sandwich/feathernorthwest.png');

    this.load.image('grapesSprite', 'Sandwich/grape.png');

}

function playEndingMessage() {
    let unlockText = this.add.text(150, 250, "Congrats! This is the end of the content for now. You can continue; the game doesn't end, but this is where the content stops.", {
        fontSize: '16px', fill: '#ffa500' 
    });

    this.tweens.add({
        targets: unlockText,
        alpha: { from: 1, to: 0 },
        duration: 5000,
        onComplete: () => {
            unlockText.destroy();
        }
    });
}

function playNextTrack() {
    this.backgroundTrack.play({
        loop: true
    });
}

function create() {
    // This duck is here to kick some serious tail, treat it with respect
    this.duck = this.physics.add.sprite(760, 356, 'duck');
    this.duck.setCollideWorldBounds(true);

    this.player = { x: 760, y: 600 };

    this.rubberDucks = this.physics.add.group();

    // Getting the sounds ready to blow your mind
    this.squeakSound = this.sound.add('squeak');
    this.quackSound = this.sound.add('quack');

    // Display your current status, because you’re about to change the game
    this.scoreText = this.add.text(16, 16, 'Duckability Counter: 0', {
        fontSize: '32px',
        fill: '#ff0000'
    });

    this.tracker = this.add.image(760, 600, 'rubberDuck');
    this.tracker.setOrigin(0.5, 0.5);
    this.physics.world.enable(this.tracker);
    this.tracker.body.setCollideWorldBounds(true); // Set borders for the tracker

    // Let’s give this background some serious color, yeah?
    this.cameras.main.setBackgroundColor(0x87CEEB);

    // I Listen for player clicks
    this.input.on('pointerdown', (pointer) => {
        if (!throwCooldown && !shopOpen && !arsenalOpen) {
            throwCooldown = true;
            shootRubberDuck.call(this, pointer.x, pointer.y);
            this.time.delayedCall(150, () => throwCooldown = false);
        }
    });

    // Collisions? Duck, please. We're bringing the hurt
    this.physics.add.collider(this.rubberDucks, this.duck, hitDuck, null, this);

    this.activeDuckType = 'rubberDuck';

    createShop.call(this);

    this.input.keyboard.on('keydown-G', () => {
        toggleShop.call(this);
    });

    this.input.keyboard.on('keydown-F', () => {
        toggleArsenal.call(this);
    });

    this.input.keyboard.on('keydown-P', () => {
        playEndingMessage.call(this);
    });

    this.backgroundTrack = this.sound.add('backgroundTrack1');

    playNextTrack.call(this);

    // Initialize cursor keys and custom keys
    this.cursors = this.input.keyboard.createCursorKeys(); // Arrow keys
    this.keys = this.input.keyboard.addKeys({
        A: Phaser.Input.Keyboard.KeyCodes.A,
        D: Phaser.Input.Keyboard.KeyCodes.D
    });
}

function createShop() {
    // This shop's got everything you need and then it doesn't
    this.shopBg = this.add.rectangle(1200, 356, 450, 712, 0x000000, 0.5).setDepth(10);
    this.shopBg.setOrigin(0.5, 0.5);

    this.shopTitle = this.add.text(1050, 50, 'Shop', { fontSize: '48px', fill: '#ffffff' }).setDepth(11);

    this.sharpduckyButton = this.add.text(1050, 150, 'Sharpducky - 1000', { fontSize: '32px', fill: '#ffffff' }).setDepth(11);
    this.sharpduckyButton.setInteractive();
    this.sharpduckyButton.on('pointerdown', () => {
        confirmPurchase.call(this, 'sharpducky');
    });

    this.quacksilverButton = this.add.text(1050, 250, 'Quacksilver - 3000', { fontSize: '32px', fill: '#ffffff' }).setDepth(11);
    this.quacksilverButton.setInteractive();
    this.quacksilverButton.on('pointerdown', () => {
        confirmPurchase.call(this, 'quacksilver');
    });

    this.grapesButton = this.add.text(1050, 350, `Up-grapes - 750`, { fontSize: '32px', fill: '#ffffff' }).setDepth(11);
    this.grapesButton.setInteractive();
    this.grapesButton.on('pointerdown', () => {
        confirmPurchase.call(this, 'grapes');
    });

    this.grapesPreview = this.add.image(1020, 365, 'grapesSprite').setDepth(11).setScale(0.5);

    this.sharpduckyPreview = this.add.image(1020, 165, 'sharpduckySprite').setDepth(11).setScale(0.5);
    this.quacksilverPreview = this.add.image(1020, 265, 'quacksilverSprite').setDepth(11).setScale(0.5);

    this.shopBg.setVisible(false);
    this.shopTitle.setVisible(false);
    this.sharpduckyButton.setVisible(false);
    this.quacksilverButton.setVisible(false);
    this.grapesButton.setVisible(false);
    this.sharpduckyPreview.setVisible(false);
    this.quacksilverPreview.setVisible(false);
    this.grapesPreview.setVisible(false);
}

function toggleShop() {
    shopOpen = !shopOpen;

    this.shopBg.setVisible(shopOpen);
    this.shopTitle.setVisible(shopOpen);
    this.sharpduckyButton.setVisible(shopOpen);
    this.quacksilverButton.setVisible(shopOpen);
    this.grapesButton.setVisible(shopOpen);
    this.sharpduckyPreview.setVisible(shopOpen);
    this.quacksilverPreview.setVisible(shopOpen);
    this.grapesPreview.setVisible(shopOpen);

    this.sharpduckyButton.setInteractive(shopOpen);
    this.quacksilverButton.setInteractive(shopOpen);
    this.grapesButton.setInteractive(shopOpen);

    if (shopOpen) {
        this.grapesButton.setText(`Up-grapes - ${getGrapesPrice()}`);
    }
}

function confirmPurchase(type) {
    let price = (type === 'grapes') ? getGrapesPrice() : duckPrices[type]; // Get current grapes price

    console.log(`Attempting to purchase ${type} for ${price}. Current duckabilityCounter: ${duckabilityCounter}`);

    if (duckabilityCounter >= price && (type !== 'grapes' || grapesPurchasedCount < 5)) {
        let confirmBg = this.add.rectangle(400, 300, 500, 100, 0x000000, 0.5).setDepth(11);
        confirmBg.setOrigin(0.5, 0.5);

        let confirmText = this.add.text(400, 300, `Buy ${type} for ${price}? (Y/N)`, {
            fontSize: '24px', fill: '#ffffff'
        }).setDepth(12).setOrigin(0.5, 0.5);

        console.log(`You're about to buy ${type}, make up your mind!`);

        this.input.keyboard.removeAllListeners('keydown-Y');
        this.input.keyboard.removeAllListeners('keydown-N');

        if (duckabilityCounter >= price && (type !== 'grapes' || grapesPurchasedCount < 5)) {
            // Handle purchase confirmation
            this.input.keyboard.once('keydown-Y', () => {
                console.log(`You've bought ${type}, prepare for some epicness!`);
                if (type === 'grapes') {
                    applyGrapesEffect.call(this); // Apply the grapes effect
                    grapesPurchasedCount++; // Increase grapes purchased count
                    this.grapesButton.setText(`Up-grapes - ${getGrapesPrice()}`); // Update the grapes button text
                } else {
                    duckabilityCounter -= price; // Deduct the price only if it's not grapes
                }
                selectDuck.call(this, type);
                console.log(`Purchased ${type} for ${price}. New duckabilityCounter: ${duckabilityCounter}`);
                this.scoreText.setText('Duckability Counter: ' + duckabilityCounter);
                updateShop.call(this);
                confirmText.destroy();
                confirmBg.destroy();
            });
        }        

        this.input.keyboard.once('keydown-N', () => {
            console.log(`You backed out of buying ${type}? Better luck next time!`);
            confirmText.destroy();
            confirmBg.destroy();
        });
    } else {
        console.log(`Not enough duckability to purchase ${type}. Required: ${price}, Available: ${duckabilityCounter}`);
    }
}

function selectDuck(type) {
    if (duckabilityCounter >= duckPrices[type]) {
        duckabilityCounter -= duckPrices[type];
        this.scoreText.setText('Duckability Counter: ' + duckabilityCounter);
        this.activeDuckType = type;
        ownedDucks.push(type);
        this.tracker.setTexture(type === 'sharpducky' ? 'sharpduckySprite' : type === 'quacksilver' ? 'quacksilverSprite' : 'rubberDuck');
    }
}

function updateShop() {
    if (ownedDucks.includes('sharpducky')) {
        this.sharpduckyButton.setVisible(false);
        this.sharpduckyPreview.setVisible(false);
    }
    if (ownedDucks.includes('quacksilver')) {
        this.quacksilverButton.setVisible(false);
        this.quacksilverPreview.setVisible(false);
    }
}

function toggleArsenal() {
    arsenalOpen = !arsenalOpen;

    if (arsenalOpen) {
        this.arsenalBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5).setDepth(10);
        this.arsenalTitle = this.add.text(300, 50, 'Arsenal', { fontSize: '32px', fill: '#ffffff' }).setDepth(11);

        let yPosition = 100;
        this.arsenalDucks = [];
        ownedDucks.forEach((duck) => {
            let duckSprite = this.add.image(400, yPosition, duck === 'sharpducky' ? 'sharpduckySprite' : duck === 'quacksilver' ? 'quacksilverSprite' : 'rubberDuck').setDepth(11).setScale(0.5);
            duckSprite.setInteractive();
            duckSprite.on('pointerdown', () => {
                this.activeDuckType = duck;
                this.tracker.setTexture(duck === 'sharpducky' ? 'sharpduckySprite' : duck === 'quacksilver' ? 'quacksilverSprite' : 'rubberDuck');
                toggleArsenal.call(this);
            });
            this.arsenalDucks.push(duckSprite);
            yPosition += 100;
        });
    } else {
        this.arsenalBg.destroy();
        this.arsenalTitle.destroy();
        this.arsenalDucks.forEach((duckSprite) => duckSprite.destroy());
    }
}

function shootRubberDuck(targetX, targetY) {
    let speed = 500;

    // increase speed by 5% for each grapes purchase
    if (grapesPurchasedCount > 0) {
        speed *= Math.pow(1.05, grapesPurchasedCount); // increase speed by 5% each time grapes are bought
    }

    if (this.activeDuckType === 'sharpducky') {
        speed *= 1.5;
    } else if (this.activeDuckType === 'quacksilver') {
        speed *= 0.75;
    }

    let rubberDuck = this.rubberDucks.create(this.player.x, this.player.y, 
        this.activeDuckType === 'sharpducky' ? 'sharpduckySprite' : 
        this.activeDuckType === 'quacksilver' ? 'quacksilverSprite' : 'rubberDuck'
    );

    this.squeakSound.play();

    this.tracker.setVisible(false);

    const angle = Phaser.Math.Angle.Between(rubberDuck.x, rubberDuck.y, targetX, targetY);
    
    rubberDuck.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.time.delayedCall(2000, () => rubberDuck.destroy());

    this.time.delayedCall(500, () => this.tracker.setVisible(true));
}

function hitDuck(rubberDuck, duck) {
    this.quackSound.play();

    duckabilityCounter += 1;
    this.scoreText.setText('Duckability Counter: ' + duckabilityCounter);

    if (this.activeDuckType === 'sharpducky') {
        rubberDuck.setData('pierceCount', (rubberDuck.getData('pierceCount') || 0) + 1);
        if (rubberDuck.getData('pierceCount') < 2) {
            duck.destroy();
            spawnFeathers.call(this, duck.x, duck.y);
            return;
        }
    } else if (this.activeDuckType === 'quacksilver') {
        let ducksInRange = this.physics.overlapCirc(duck.x, duck.y, 100, true, true);
        let destroyedCount = 0;
        ducksInRange.forEach((d) => {
            if (d !== duck && destroyedCount < 5) {
                d.destroy();
                destroyedCount++;
            }
        });
    }

    rubberDuck.destroy();
    duck.destroy();
    spawnFeathers.call(this, duck.x, duck.y);
    totalDucksSpawned++;

    // Look at you now, you're getting orange!
    if (totalDucksSpawned === 5000 && !this.hasOrangeSkin) {
        this.hasOrangeSkin = true;
        this.duckTexture = 'orangeDuck';
        let unlockText = this.add.text(200, 300, "Press P after reloading the game", {
            fontSize: '8px', fill: '#ffa500' 
        });

        this.tweens.add({
            targets: unlockText,
            alpha: { from: 1, to: 0 },
            duration: 5000,
            onComplete: () => {
                unlockText.destroy();
            }
        });
    }

    // Time for a horde of ducks? No problem.
    if (totalDucksSpawned <= 5000 && totalDucksSpawned % 5 === 0 && Math.random() < 0.3) {
        spawnHorde.call(this, duck);
    } else {
        this.time.delayedCall(1000, () => spawnDuck.call(this));
    }
}

function spawnDuck() {
    let randomX = Phaser.Math.Between(50, 1470);
    let randomY = Phaser.Math.Between(85, 500);

    let newDuck = this.physics.add.sprite(randomX, randomY, 
        this.hasOrangeSkin ? 'orangeDuck' : 'duck'
    );
    newDuck.setCollideWorldBounds(true);

    this.physics.add.collider(this.rubberDucks, newDuck, hitDuck, null, this);

    return newDuck;
}

function spawnHorde(triggerDuck) {
    // A horde? Why not... let’s wreck the place
    for (let i = 0; i < 2; i++) {
        let hordeDuck = spawnDuck.call(this);
        hordeDuck.setData('isHordeDuck', true);
    }

    triggerDuck.setData('isHordeDuck', false);
}

function hitHordeDuck(rubberDuck, hordeDuck) {
    // Horde ducks aren’t going to know what hit them
    if (hordeDuck.getData('isHordeDuck')) {
        hordeDuck.destroy();
        rubberDuck.destroy();
    } else {
        hitDuck.call(this, rubberDuck, hordeDuck);
    }
}

function update() {
    // You're dominating this game. Keep going.
    const speed = 300; // Adjust as needed

    if (this.cursors.left.isDown || this.keys.A.isDown) {
        this.tracker.x -= speed * this.game.loop.delta / 1000;
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
        this.tracker.x += speed * this.game.loop.delta / 1000;
    }

    // Update the player's position based on the tracker's position
    this.player.x = this.tracker.x;
    this.player.y = this.tracker.y;
}

function spawnFeathers(x, y) {
    const numFeathers = 5;
    const featherDirections = [
        'feathernorth', 'feathernortheast', 'feathereast', 'feathersoutheast',
        'feathersouth', 'feathersouthwest', 'featherwest', 'feathernorthwest'
    ];

    const selectedDirections = [];
    while (selectedDirections.length < numFeathers) {
        const randomIndex = Math.floor(Math.random() * featherDirections.length);
        const direction = featherDirections[randomIndex];
        if (!selectedDirections.includes(direction)) {
            selectedDirections.push(direction);
        }
    }

    const angleStep = Math.PI * 2 / numFeathers;

    for (let i = 0; i < numFeathers; i++) {
        const angle = i * angleStep;
        const featherX = x + Math.cos(angle) * 10;
        const featherY = y + Math.sin(angle) * 10;

        const featherDirection = selectedDirections[i];
        let feather = this.physics.add.sprite(featherX, featherY, featherDirection);
        feather.setAlpha(1);

        feather.setVelocity(Math.cos(angle) * 50, Math.sin(angle) * 50);

        if (i < numFeathers / 2) {
            feather.setAngularVelocity(100);
        } else {
            feather.setAngularVelocity(-100);
        }

        this.tweens.add({
            targets: feather,
            alpha: 0,
            duration: 500,
            delay: 300,
            onComplete: () => feather.destroy(),
        });
    }
}
