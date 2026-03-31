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
console.log("I am fully aware there is a duck stuck on the screen, deal with it. No but like, literally deal with it.")

const game = new Phaser.Game(config);

let throwCooldown = 100;
let lastThrowTime = 0;
let duckabilityCounter = 0;
let totalDucksSpawned = 0;
let grapesPurchasedCount = 0;
let watermelonsPurchasedCount = 0;
let blueberriesPurchasedCount = 0;
let shopOpen = false;
let arsenalOpen = false;
let hasOrangeSkin = false;

let currentAmmo = 0;
let maxAmmo = 10;

const duckPrices = {
    'sharpducky': 1000,
    'quacksilver': 3000,
    'dvduck': 2000
};

let ownedDucks = ['rubberDuck'];
let arsenalDucks = [];

function getGrapesPrice() {
    return Math.round(50 * Math.pow(1.25, grapesPurchasedCount));
}

function getWatermelonPrice() {
    return Math.round(50 * Math.pow(1.25, watermelonsPurchasedCount));
}

function getBlueberryPrice() {
    const priceSequence = [30, 60, 120, 240, 480];
    if (blueberriesPurchasedCount < priceSequence.length) {
        return priceSequence[blueberriesPurchasedCount];
    }
    return 999999;
}

function preload() {
    this.load.image('duck', 'Sandwich/duck.png');
    this.load.image('rubberDuck', 'Sandwich/rubber_duck.png');
    this.load.image('sharpduckySprite', 'Sandwich/sharpducky.png');
    this.load.image('quacksilverSprite', 'Sandwich/quacksilver.png');
    this.load.image('orangeDuck', 'Sandwich/orangeduck.png');
    this.load.image('dvduckSprite', 'Sandwich/dvduck.png');
    this.load.image('feathernorth', 'Sandwich/feathernorth.png');
    this.load.image('feathernortheast', 'Sandwich/feathernortheast.png');
    this.load.image('feathereast', 'Sandwich/feathereast.png');
    this.load.image('feathersoutheast', 'Sandwich/feathersoutheast.png');
    this.load.image('feathersouth', 'Sandwich/feathersouth.png');
    this.load.image('feathersouthwest', 'Sandwich/feathersouthwest.png');    
    this.load.image('featherwest', 'Sandwich/featherwest.png');
    this.load.image('feathernorthwest', 'Sandwich/feathernorthwest.png');
    this.load.image('grapesSprite', 'Sandwich/grape.png');
    this.load.image('watermelonSprite', 'Sandwich/watermelon.png');
    this.load.image('blueberrySprite', 'Sandwich/blueberry.png');
    this.load.audio('squeak', 'Sandwich/squeak.mp3');
    this.load.audio('quack', 'Sandwich/quack.mp3');
    this.load.audio('backgroundTrack1', 'Sandwich/Background.mp3');
}

function getTextureForDuck(type) {
    if (type === 'rubberDuck') {
        return hasOrangeSkin ? 'orangeDuck' : 'rubberDuck';
    }
    if (type === 'sharpducky') return 'sharpduckySprite';
    if (type === 'quacksilver') return 'quacksilverSprite';
    if (type === 'dvduck') return 'dvduckSprite';
    return 'rubberDuck';
}

function create() {
    this.duck = this.physics.add.sprite(760, 356, 'duck');
    this.duck.setCollideWorldBounds(true);

    this.player = { x: 760, y: 600 };
    this.rubberDucks = this.physics.add.group();
    this.enemyDucks = this.physics.add.group();
    this.featherProjectiles = this.physics.add.group();

    this.squeakSound = this.sound.add('squeak');
    this.quackSound = this.sound.add('quack');

    this.scoreText = this.add.text(16, 16, 'Duckability Counter: 0', { fontSize: '32px', fill: '#ff0000' });
    this.ammoText = this.add.text(16, 60, `Ammo: ${currentAmmo}/${maxAmmo}`, { fontSize: '32px', fill: '#00ff00' });

    this.tracker = this.add.image(760, 600, 'rubberDuck');
    this.tracker.setOrigin(0.5, 0.5);
    this.physics.world.enable(this.tracker);
    this.tracker.body.setCollideWorldBounds(true);

    this.cameras.main.setBackgroundColor(0x87CEEB);

    this.input.on('pointerdown', (pointer) => {
        const currentTime = this.time.now;
        if (currentTime - lastThrowTime >= throwCooldown && !shopOpen && !arsenalOpen && currentAmmo > 0) {
            lastThrowTime = currentTime;
            currentAmmo--;
            this.ammoText.setText(`Ammo: ${currentAmmo}/${maxAmmo}`);
            shootRubberDuck.call(this, pointer.x, pointer.y);
        }
    });

    this.physics.add.collider(this.rubberDucks, this.enemyDucks, hitDuck, null, this);
    this.physics.add.collider(this.featherProjectiles, this.enemyDucks, hitFeather, null, this);

    this.activeDuckType = 'rubberDuck';

    createShop.call(this);

    this.input.keyboard.on('keydown-G', () => toggleShop.call(this));
    this.input.keyboard.on('keydown-F', () => toggleArsenal.call(this));
    this.input.keyboard.on('keydown-P', () => playEndingMessage.call(this));

    this.input.keyboard.on('keydown-ONE', () => selectDuckByKey.call(this, 'rubberDuck'));
    this.input.keyboard.on('keydown-TWO', () => selectDuckByKey.call(this, 'sharpducky'));
    this.input.keyboard.on('keydown-THREE', () => selectDuckByKey.call(this, 'quacksilver'));
    this.input.keyboard.on('keydown-FOUR', () => selectDuckByKey.call(this, 'dvduck'));

    this.backgroundTrack = this.sound.add('backgroundTrack1');
    this.backgroundTrack.play({ loop: true });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');

    this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (currentAmmo < maxAmmo) {
                currentAmmo++;
                this.ammoText.setText(`Ammo: ${currentAmmo}/${maxAmmo}`);
            }
        },
        loop: true
    });

    for (let i = 0; i < 4; i++) {
        spawnDuck.call(this);
    }
}

function createShop() {
    this.shopBg = this.add.rectangle(1200, 356, 450, 712, 0x000000, 0.5).setDepth(10).setOrigin(0.5);
    this.shopTitle = this.add.text(1050, 30, 'Shop (sorted by price)', { fontSize: '32px', fill: '#ffffff' }).setDepth(11);

    this.sharpduckyButton = this.add.text(1050, 150, '', { fontSize: '32px', fill: '#ffffff' }).setDepth(11).setInteractive();
    this.quacksilverButton = this.add.text(1050, 150, '', { fontSize: '32px', fill: '#ffffff' }).setDepth(11).setInteractive();
    this.dvduckButton = this.add.text(1050, 150, '', { fontSize: '32px', fill: '#ffffff' }).setDepth(11).setInteractive();
    this.grapesButton = this.add.text(1050, 150, '', { fontSize: '32px', fill: '#ffffff' }).setDepth(11).setInteractive();
    this.watermelonButton = this.add.text(1050, 150, '', { fontSize: '32px', fill: '#ffffff' }).setDepth(11).setInteractive();
    this.blueberryButton = this.add.text(1050, 150, '', { fontSize: '32px', fill: '#ffffff' }).setDepth(11).setInteractive();

    this.sharpduckyPreview = this.add.image(1020, 165, 'sharpduckySprite').setDepth(11).setScale(0.5);
    this.quacksilverPreview = this.add.image(1020, 165, 'quacksilverSprite').setDepth(11).setScale(0.5);
    this.dvduckPreview = this.add.image(1020, 165, 'dvduckSprite').setDepth(11).setScale(0.5);
    this.grapesPreview = this.add.image(1020, 165, 'grapesSprite').setDepth(11).setScale(0.5);
    this.watermelonPreview = this.add.image(1020, 165, 'watermelonSprite').setDepth(11).setScale(0.5);
    this.blueberryPreview = this.add.image(1020, 165, 'blueberrySprite').setDepth(11).setScale(0.5);

    this.shopItemList = [
        {type: 'grapes', button: this.grapesButton, preview: this.grapesPreview, priceFunc: getGrapesPrice},
        {type: 'watermelon', button: this.watermelonButton, preview: this.watermelonPreview, priceFunc: getWatermelonPrice},
        {type: 'blueberry', button: this.blueberryButton, preview: this.blueberryPreview, priceFunc: getBlueberryPrice},
        {type: 'dvduck', button: this.dvduckButton, preview: this.dvduckPreview, priceFunc: () => duckPrices.dvduck},
        {type: 'sharpducky', button: this.sharpduckyButton, preview: this.sharpduckyPreview, priceFunc: () => duckPrices.sharpducky},
        {type: 'quacksilver', button: this.quacksilverButton, preview: this.quacksilverPreview, priceFunc: () => duckPrices.quacksilver}
    ];

    const hideList = [this.shopBg, this.shopTitle];
    this.shopItemList.forEach(item => {
        hideList.push(item.button);
        hideList.push(item.preview);
    });
    hideList.forEach(obj => obj.setVisible(false));

    this.shopItemList.forEach(item => {
        item.button.on('pointerdown', () => confirmPurchase.call(this, item.type));
    });
}

function toggleShop() {
    shopOpen = !shopOpen;
    const visible = shopOpen;

    [this.shopBg, this.shopTitle].forEach(obj => obj.setVisible(visible));
    this.shopItemList.forEach(item => {
        item.button.setVisible(visible);
        item.preview.setVisible(visible);
    });

    if (shopOpen) {
        const sorted = [...this.shopItemList].sort((a, b) => a.priceFunc() - b.priceFunc());
        let y = 150;
        sorted.forEach(item => {
            item.button.setText(`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} - ${item.priceFunc()}`);
            item.button.y = y;
            item.preview.y = y + 15;
            y += 100;
        });
    }
}

function confirmPurchase(type) {
    let price;
    if (type === 'grapes') price = getGrapesPrice();
    else if (type === 'watermelon') price = getWatermelonPrice();
    else if (type === 'blueberry') price = getBlueberryPrice();
    else price = duckPrices[type];

    if (duckabilityCounter < price) return;
    if (type === 'grapes' && grapesPurchasedCount >= 5) return;
    if (type === 'blueberry' && blueberriesPurchasedCount >= 5) return;

    const confirmBg = this.add.rectangle(760, 356, 500, 150, 0x000000, 0.85).setDepth(20);
    const confirmText = this.add.text(760, 320, `Buy ${type} for ${price}? (Y/N)`, { fontSize: '28px', fill: '#ffffff' }).setDepth(21).setOrigin(0.5);

    this.input.keyboard.once('keydown-Y', () => {
        duckabilityCounter -= price;
        this.scoreText.setText('Duckability Counter: ' + duckabilityCounter);

        if (type === 'grapes') grapesPurchasedCount++;
        else if (type === 'watermelon') {
            watermelonsPurchasedCount++;
            throwCooldown = Math.max(40, throwCooldown * 0.85);
        }
        else if (type === 'blueberry') {
            blueberriesPurchasedCount++;
            maxAmmo += 10;
            this.ammoText.setText(`Ammo: ${currentAmmo}/${maxAmmo}`);
        }
        else {
            if (!ownedDucks.includes(type)) ownedDucks.push(type);
            this.activeDuckType = type;
            this.tracker.setTexture(getTextureForDuck(type));
        }

        confirmBg.destroy();
        confirmText.destroy();
        toggleShop.call(this);
    });

    this.input.keyboard.once('keydown-N', () => {
        confirmBg.destroy();
        confirmText.destroy();
    });
}

function toggleArsenal() {
    arsenalOpen = !arsenalOpen;
    if (arsenalOpen) {
        this.arsenalBg = this.add.rectangle(400, 356, 600, 500, 0x000000, 0.7).setDepth(15);
        this.arsenalTitle = this.add.text(250, 120, 'Arsenal (1-4 to equip)', { fontSize: '28px', fill: '#ffffff' }).setDepth(16);

        arsenalDucks = [];
        let y = 200;
        ownedDucks.forEach(duckType => {
            const tex = getTextureForDuck(duckType);
            const btn = this.add.image(400, y, tex).setScale(0.6).setDepth(16);
            arsenalDucks.push(btn);
            y += 90;
        });
    } else {
        if (this.arsenalBg) this.arsenalBg.destroy();
        if (this.arsenalTitle) this.arsenalTitle.destroy();
        arsenalDucks.forEach(sprite => sprite.destroy());
        arsenalDucks = [];
    }
}

function selectDuckByKey(type) {
    if (ownedDucks.includes(type) || type === 'rubberDuck') {
        this.activeDuckType = type;
        this.tracker.setTexture(getTextureForDuck(type));
    }
}

function shootRubberDuck(targetX, targetY) {
    let speed = 500;
    if (grapesPurchasedCount > 0) speed *= Math.pow(1.10, grapesPurchasedCount);
    if (this.activeDuckType === 'sharpducky') speed *= 1.6;
    if (this.activeDuckType === 'quacksilver') speed *= 0.7;

    const texture = getTextureForDuck(this.activeDuckType);
    const rubberDuck = this.rubberDucks.create(this.tracker.x, this.tracker.y, texture);
    this.squeakSound.play();

    this.tracker.setVisible(false);
    this.time.delayedCall(400, () => this.tracker.setVisible(true));

    const angle = Phaser.Math.Angle.Between(rubberDuck.x, rubberDuck.y, targetX, targetY);
    rubberDuck.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    rubberDuck.setData('pierceCount', 0);

    if (this.activeDuckType === 'dvduck') {
        rubberDuck.setAngularVelocity(800);
    }

    if (this.activeDuckType === 'dvduck') {
        rubberDuck.setBounce(1, 1);
        rubberDuck.setCollideWorldBounds(true);
    }

    if (this.activeDuckType !== 'dvduck') {
        this.time.delayedCall(3000, () => { if (rubberDuck) rubberDuck.destroy(); });
    }
}

function hitDuck(rubberDuck, targetDuck) {
    this.quackSound.play();
    duckabilityCounter += 1;
    this.scoreText.setText('Duckability Counter: ' + duckabilityCounter);

    const type = this.activeDuckType;

    if (type === 'sharpducky') {
        let pierce = (rubberDuck.getData('pierceCount') || 0) + 1;
        rubberDuck.setData('pierceCount', pierce);
        if (pierce < 2) {
            targetDuck.destroy();
            spawnFeathers.call(this, targetDuck.x, targetDuck.y);
            rubberDuck.setVelocity(rubberDuck.body.velocity.x * 0.6, rubberDuck.body.velocity.y * 0.6);
            return;
        }
    } else if (type === 'quacksilver') {
        spawnQuackFeathers.call(this, targetDuck.x, targetDuck.y);
    }

    rubberDuck.destroy();
    targetDuck.destroy();
    spawnFeathers.call(this, targetDuck.x, targetDuck.y);
    totalDucksSpawned++;

    if (totalDucksSpawned >= 5000 && !hasOrangeSkin) {
        hasOrangeSkin = true;
        if (this.activeDuckType === 'rubberDuck') this.tracker.setTexture('orangeDuck');
    }

    if (totalDucksSpawned % 5 === 0 && Math.random() < 0.15) {
        spawnHorde.call(this);
    } else {
        this.time.delayedCall(1500, () => spawnDuck.call(this));
    }
}

function spawnQuackFeathers(x, y) {
    const featherDirs = ['feathernorth','feathernortheast','feathereast','feathersoutheast','feathersouth','feathersouthwest','featherwest','feathernorthwest'];
    for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const tex = featherDirs[Math.floor(Math.random() * featherDirs.length)];
        const feather = this.featherProjectiles.create(x, y, tex);
        feather.setVelocity(Math.cos(angle) * 420, Math.sin(angle) * 420);
        feather.setAngularVelocity(Phaser.Math.Between(-300, 300));
        this.time.delayedCall(1400, () => { if (feather) feather.destroy(); });
    }
}

function hitFeather(feather, enemyDuck) {
    feather.destroy();
    enemyDuck.destroy();
    spawnFeathers.call(this, enemyDuck.x, enemyDuck.y);
}

function spawnDuck() {
    const x = Phaser.Math.Between(80, 1440);
    const y = Phaser.Math.Between(80, 520);
    const newDuck = this.physics.add.sprite(x, y, 'duck');
    newDuck.setCollideWorldBounds(true);
    this.enemyDucks.add(newDuck);
    newDuck.lastMoveTime = this.time.now;
    return newDuck;
}

function spawnHorde() {
    for (let i = 0; i < 4; i++) spawnDuck.call(this);
}

function spawnFeathers(x, y) {
    const directions = ['feathernorth','feathernortheast','feathereast','feathersoutheast','feathersouth','feathersouthwest','featherwest','feathernorthwest'];
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dir = directions[i % directions.length];
        const feather = this.physics.add.sprite(x, y, dir);
        feather.setVelocity(Math.cos(angle) * 70, Math.sin(angle) * 70);
        feather.setAngularVelocity(Phaser.Math.Between(-200, 200));
        this.tweens.add({
            targets: feather,
            alpha: 0,
            duration: 700,
            delay: 400,
            onComplete: () => feather.destroy()
        });
    }
}

function update() {
    const speed = 380;
    const delta = this.game.loop.delta / 1000;

    if (this.cursors.left.isDown || this.keys.A.isDown) this.tracker.x -= speed * delta;
    if (this.cursors.right.isDown || this.keys.D.isDown) this.tracker.x += speed * delta;
    if (this.cursors.up.isDown || this.keys.W.isDown) this.tracker.y -= speed * delta;
    if (this.cursors.down.isDown || this.keys.S.isDown) this.tracker.y += speed * delta;

    this.player.x = this.tracker.x;
    this.player.y = this.tracker.y;

    const now = this.time.now;
    this.enemyDucks.getChildren().forEach(duck => {
        if (now - (duck.lastMoveTime || 0) > 5000) {
            if (Math.random() < 1/20) {
                const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
                const randAngle = angles[Math.floor(Math.random() * 8)];
                const tx = Phaser.Math.Clamp(duck.x + Math.cos(randAngle) * 50, 80, 1440);
                const ty = Phaser.Math.Clamp(duck.y + Math.sin(randAngle) * 50, 80, 520);

                this.tweens.add({
                    targets: duck,
                    x: tx,
                    y: ty,
                    duration: 800,
                    ease: 'Sine.easeInOut'
                });
            }
            duck.lastMoveTime = now;
        }

        if (duck.x < -50 || duck.x > 1570 || duck.y < -50 || duck.y > 762) duck.destroy();
    });

    this.rubberDucks.getChildren().forEach(p => {
        if (p.x < -50 || p.x > 1570 || p.y < -50 || p.y > 762) p.destroy();
    });
}

function playEndingMessage() {
    const text = this.add.text(200, 200, "Congrats! This is the end of the current content.\nYou can keep playing forever though!", { fontSize: '20px', fill: '#ffa500', align: 'center' });
    this.tweens.add({
        targets: text,
        alpha: 0,
        duration: 6000,
        onComplete: () => text.destroy()
    });
}
