var config = {
  type: Phaser.AUTO,
  width: 1195,
  height: 900,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
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
var plate;
var cursors;
var ring;
var score = 0;
var scoreText;
var dropItem;
var lossItem;
var gameOver = false;

var game = new Phaser.Game(config);

// précharge les éléments
function preload() {
  this.load.image("sky", "./assets/img/sky.png");
  this.load.image("plateforme", "./assets/img/plateforme.png");
  this.load.image("plateforme-sol", "./assets/img/plateforme-invisible.png");
  this.load.spritesheet("item", "./assets/img/ring-sprite.png", {
    frameWidth: 115,
    frameHeight: 115,
  });
  this.load.image("bomb", "./assets/img/bomb.png");
  this.load.spritesheet("perso", "./assets/img/perso.png", {
    frameWidth: 95,
    frameHeight: 95,
  });
  this.load.audio("dropItem", "./assets/sound/soundRing.mp3");
  this.load.audio("lossItem", "./assets/sound/lossRing.mp3");
}

// crée les les éléments à afficher
function create() {
  //  ajoute le fond
  this.add.image(600, 450, "sky");

  //  crée le sol
  plateforme = this.physics.add.staticGroup();
  plateforme.create(600, 1160, "plateforme-sol").setScale(1.8).refreshBody();

  // crée les plateformes
  // plate = this.physics.add.staticGroup();
  // plate.create(1000, 900, "plateforme");

  // ajoute le joueur et ses propriétés
  player = this.physics.add.sprite(100, 450, "perso").setScale(1.5);
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // animations du personnage avec le sprite
  // animation vers la gauche
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("perso", { start: 25, end: 30 }),
    frameRate: 10,
    repeat: -1,
  });

  // animation à l'arrêt
  this.anims.create({
    key: "turn",
    frames: [{ key: "perso", frame: 0 }],
    frameRate: 20,
  });

  // animation vers la droite
  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("perso", { start: 17, end: 22 }),
    frameRate: 10,
    repeat: -1,
  });

  // animation de la mort
  this.anims.create({
    key: "dead",
    frames: [{ key: "perso", frame: 7 }],
    frameRate: 20,
  });

  //  evemement clavier
  cursors = this.input.keyboard.createCursorKeys();

  //  crée les items et ses propriétés
  items = this.physics.add.group({
    key: "item",
    repeat: 8,
    bounceX: Phaser.Math.FloatBetween(0.2, 0.4),
    bounceY: Phaser.Math.FloatBetween(0.2, 0.8),
    velocityX: Phaser.Math.Between(-50, 50),
    velocityY: 50,
  });

  // crée le retangle d'apparition des items
  const rect = new Phaser.Geom.Rectangle(0, 0, 1500, 200);

  // apparition des items dans le rectangle
  Phaser.Actions.RandomRectangle(items.getChildren(), rect);

  items.children.iterate(function (child) {
    child.setCollideWorldBounds(true);
    child.setScale(0.5);
  });

  // crée l'animation des items
  this.anims.create({
    key: "itemAnim",
    frames: this.anims.generateFrameNumbers("item", { start: 0, end: 9 }),
    repeat: -1,
  });

  // crée la physique des bombes
  bombs = this.physics.add.group();

  //  Affiche le score avec un item au bout
  scoreText = this.add.text(16, 16, "Score:0", {
    fontSize: "40px",
    fill: "aliceblue",
  });

  item = this.add.sprite(260, 33, "item").setScale(0.3);

  // crée les collisions
  this.physics.add.collider(items, plateforme);
  this.physics.add.collider(items, plate);
  this.physics.add.collider(player, plateforme);
  this.physics.add.collider(player, plate);
  this.physics.add.collider(bombs, plateforme);
  this.physics.add.collider(bombs, plate);
  this.physics.add.collider(player, bombs, hitBomb, null, this);
  this.physics.add.overlap(player, items, collectItems, null, this);

  // crée la musique au ramassage
  dropItem = this.sound.add("dropItem");
  lossItem = this.sound.add("lossItem");
}

// crée les événements
function update() {
  if (gameOver) {
    return;
  }

  // anime le personnage avec les déplacements vers le bas
  if (cursors.left.isDown) {
    player.setVelocityX(-300);

    // anime le personnage avec les déplacements vers la gauche
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(300);

    // anime le personnage avec les déplacements vers la droite
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);

    // image du personnage qui ne bouge pas
    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-500);
  }

  // Anime les items
  items.children.iterate(function (child) {
    child.anims.play("itemAnim", true);
  });

  // Anime l'item après le score
  item.anims.play("itemAnim", true);
}

// fonction qui collecte les items
function collectItems(player, item) {
  item.disableBody(true, true);
  // joue la musique de ramassage
  dropItem.play();

  // monte le score et l'affiche
  score += 1;
  scoreText.setText("Score:" + score);

  if (items.countActive(true) === 0) {
    // faire disparaitre les items au ramassage
    items.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    // fait apparaitre aléatoirement une bombe si il reste 0 items
    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    // définit les propriétés de la bombe
    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-100, 100), 20);
    bomb.setScale(0.05);
    bomb.allowGravity = false;
  }
}
// fonction qui fait perdre quand on touche une bombe
function hitBomb(player, bomb) {
  bomb.disableBody(true, true);
  score -= 10;
  if (score > 0 ) {
    lossItem.play();
    scoreText.setText("Score:" + score);
    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    // définit les propriétés de la bombe
    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-100, 100), 20);
    bomb.setScale(0.05);
    bomb.allowGravity = false;
  } 

  else if(score<=0){
    score = 0
    lossItem.play();
    scoreText.setText("Score:" + score);

    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play("dead");

    gameOverText = this.add.text(320, 400, "Game Over", {
      fontSize: "100px",
      fill: "aliceblue",
    });

    gameOver = true;
  }
}
