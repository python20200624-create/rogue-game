// 設定
const COLS = 15; 
const ROWS = 15;
const WALL = '#';
const FLOOR = '.';
const PLAYER = '@';
const GOAL = 'G';
const ENEMY = 'E'; // 敵の記号

let map = [];
let player = { x: 1, y: 1 };
let enemies = []; // 敵リスト
let level = 1;

function init() {
    createLevel();
    setupControls();
}

function setupControls() {
    // PCキーボード用
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') movePlayer(0, -1);
        if (e.key === 'ArrowDown') movePlayer(0, 1);
        if (e.key === 'ArrowLeft') movePlayer(-1, 0);
        if (e.key === 'ArrowRight') movePlayer(1, 0);
    });

    // スマホボタン用
    document.getElementById('btn-up').addEventListener('click', () => movePlayer(0, -1));
    document.getElementById('btn-down').addEventListener('click', () => movePlayer(0, 1));
    document.getElementById('btn-left').addEventListener('click', () => movePlayer(-1, 0));
    document.getElementById('btn-right').addEventListener('click', () => movePlayer(1, 0));
}

function createLevel() {
    generateMap();
    spawnGoal();
    spawnEnemies(); // 敵を配置
    
    // プレイヤー初期位置
    player.x = 1; player.y = 1;
    map[player.y][player.x] = FLOOR;
    
    document.getElementById('level-display').innerText = level;
    draw();
}

function generateMap() {
    map = [];
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) {
            if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
                row.push(WALL);
            } else {
                row.push(Math.random() < 0.15 ? WALL : FLOOR);
            }
        }
        map.push(row);
    }
}

function spawnGoal() {
    placeObject(GOAL);
}

function spawnEnemies() {
    enemies = [];
    // レベルが上がると敵が増える（基本2体 + レベル数）
    const count = 2 + level; 
    for(let i=0; i<count; i++){
        let pos = placeObject(ENEMY, true); // trueは「マップには書き込まず座標だけ返す」
        if(pos){
            enemies.push({ x: pos.x, y: pos.y });
        }
    }
}

// オブジェクトをランダムな床に置く便利関数
function placeObject(type, returnOnlyPos = false) {
    while (true) {
        let x = Math.floor(Math.random() * (COLS - 2)) + 1;
        let y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        
        // プレイヤーの位置や壁には置かない
        if (map[y][x] === FLOOR && (x !== 1 || y !== 1)) {
            if(returnOnlyPos) return {x, y};
            map[y][x] = type;
            return {x, y};
        }
    }
}

// プレイヤーの移動処理
function movePlayer(dx, dy) {
    const nextX = player.x + dx;
    const nextY = player.y + dy;
    
    if (nextX < 0 || nextX >= COLS || nextY < 0 || nextY >= ROWS) return;
    const target = map[nextY][nextX];
    if (target === WALL) return;

    // 敵にぶつかったかチェック
    let hitEnemy = enemies.find(e => e.x === nextX && e.y === nextY);
    if (hitEnemy) {
        gameOver();
        return;
    }

    if (target === GOAL) {
        alert("Level " + level + " Complete!");
        level++;
        createLevel();
    } else {
        player.x = nextX;
        player.y = nextY;
        // プレイヤーが動いた後に敵も動く
        moveEnemies();
        draw();
    }
}

// 敵の移動処理（AI）
function moveEnemies() {
    enemies.forEach(enemy => {
        let dx = 0;
        let dy = 0;

        // プレイヤーの方へ近づこうとする簡易AI
        if (player.x > enemy.x) dx = 1;
        else if (player.x < enemy.x) dx = -1;
        else if (player.y > enemy.y) dy = 1;
        else if (player.y < enemy.y) dy = -1;

        // 障害物判定（壁、ゴール、他の敵には乗れない）
        const nextX = enemy.x + dx;
        const nextY = enemy.y + dy;

        // 壁やゴールでなければ進む
        if (map[nextY][nextX] !== WALL && map[nextY][nextX] !== GOAL) {
            // 他の敵と重ならないかチェック
            let otherEnemy = enemies.find(e => e.x === nextX && e.y === nextY);
            
            // プレイヤーに追いついたかチェック
            if (nextX === player.x && nextY === player.y) {
                gameOver();
                return; 
            }

            if (!otherEnemy) {
                enemy.x = nextX;
                enemy.y = nextY;
            }
        }
    });
}

function gameOver() {
    alert("やられた！ Game Over... (Lv 1に戻ります)");
    level = 1;
    createLevel();
}

function draw() {
    const screen = document.getElementById('screen');
    let output = '';
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            // 描画の優先順位：プレイヤー > 敵 > マップ
            let charToDraw = map[y][x];
            let color = '';

            // 敵がいるかチェック
            let enemyHere = enemies.find(e => e.x === x && e.y === y);

            if (x === player.x && y === player.y) {
                charToDraw = PLAYER;
                color = 'yellow';
            } else if (enemyHere) {
                charToDraw = ENEMY;
                color = 'red'; // 敵は赤色
            } else if (charToDraw === GOAL) {
                color = 'gold; font-weight:bold';
            } else if (charToDraw === WALL) {
                color = 'gray';
            }

            if (color) {
                output += `<span style="color:${color}">${charToDraw}</span>`;
            } else {
                output += charToDraw;
            }
        }
        output += '\n';
    }
    screen.innerHTML = output;
}

init();
