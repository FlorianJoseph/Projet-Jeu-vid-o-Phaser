var config = {
  type: Phaser.AUTO,
  width: 1400,
  height: 855,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var player;
var items;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var ring;

var game = new Phaser.Game(config);

function preload() {
  this.load.image("sky", "./assets/img/sky.png");
  this.load.image("ground", "./assets/img/platform.png");
  this.load.image("ground2", "./assets/img/platform2.png");
  this.load.spritesheet("item", "./assets/img/ring-sprite.png", {
    frameWidth: 115,
    frameHeight: 115,
  });
  this.load.image("bomb", "./assets/img/bomb.png");
  this.load.spritesheet("dude", "./assets/img/sonic.png", {
    frameWidth: 102,
    frameHeight: 122,
  });
  this.load.spritesheet("dude2", "./assets/img/sonic2.png", {
    frameWidth: 102,
    frameHeight: 122,
  });

  // this.load.audio("dropItem", ["../sound/soundRing.mp3"]);
}

function create() {
  //  A simple background for our game
  this.add.image(400, 300, "sky");

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();
  platforms2 = this.physics.add.staticGroup();

  //  crée le sol
  platforms.create(700, 1100, "ground").setScale(2.5).refreshBody();
  platforms2.create(700, 550, "ground2").setScale(3);

// nouvelle plateforme
  // platforms.create(1080, 800, "ground");
  // platforms2.create(1080, 590, "ground2");

  // The player and its settings
  player = this.physics.add.sprite(100, 450, "dude").setScale(1.2);

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude2", { start: 0, end: 9 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 0 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 13 }),
    frameRate: 10,
    repeat: -1,
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys();

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis

  items = this.physics.add.group({
    key: "item",
    repeat: 8,
    bounceX: Phaser.Math.FloatBetween(0.4, 0.8),
    bounceY: Phaser.Math.FloatBetween(0.4, 0.8),
    velocityX: 50,
    velocityY: 120,
  });

  Phaser.Actions.RandomRectangle(items.getChildren(), this.cameras.main);

  this.anims.create({
    key: "itemAnim",
    frames: this.anims.generateFrameNumbers("item", { start: 0, end: 9 }),
    repeat: -1,
  });

  bombs = this.physics.add.group();

  //  Affiche le scoore
  scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  this.physics.add.collider(player, platforms);
  this.physics.add.collider(items, platforms);
  this.physics.add.collider(bombs, platforms);
  this.physics.add.overlap(player, items, collectItems, null, this);
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  item = this.add.sprite(195, 30, "item").setScale(0.3);
}

function update() {
  if (gameOver) {
    return;
  }
  // anime le personnage avec les déplacements vers le bas
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    // anime le personnage avec les déplacements vers la gauche
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    // anime le personnage avec les déplacements vers la droite
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);
    // image du personnage qui ne bouge pas
    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }

  // Anime les rings
  items.children.iterate(function (child) {
    child.anims.play("itemAnim", true);
  });

  item.anims.play("itemAnim", true);
}

// fonctionne qui collecte les rings

function collectItems(player, item) {
  item.disableBody(true, true);

  // monte le score et l'affiche

  score += 1;
  scoreText.setText("Score: " + score);

  if (items.countActive(true) === 0) {
    // faire disparaitre les rings au ramassage
    items.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    // fait apparaitre aléatoirement une bombe si il reste 0 rings
    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    // définit les propriétés de la bombre
    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;
  }
}

// fonction qui fait perdre quand on touche une bombe
function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  gameOver = true;
}
