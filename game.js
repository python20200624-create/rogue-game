// 設定（スマホで見やすいように狭くしました）
const COLS = 15; 
const ROWS = 15;
const WALL = '#';
const FLOOR = '.';
const PLAYER = '@';
const GOAL = 'G';

let map = [];
let player = { x: 1, y: 1 };
let level = 1;

function init() {
    createLevel();
    setupControls(); // ボタン操作の準備
}

// コントローラーの設定
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

// レベル生成
function createLevel() {
    generateMap();
    spawnGoal();
    player.x = 1; player.y = 1;
    map[player.y][player.x] = FLOOR;
    
    document.getElementById('level-display').innerText = level;
    draw();
}

// マップ生成
function generateMap() {
    map = [];
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) {
            if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
                row.push(WALL);
            } else {
                row.push(Math.random() < 0.15 ? WALL : FLOOR); // 壁を少し増やしました
            }
        }
        map.push(row);
    }
}

// ゴール配置
function spawnGoal() {
    let placed = false;
    while (!placed) {
        let x = Math.floor(Math.random() * (COLS - 2)) + 1;
        let y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        if (map[y][x] === FLOOR && (x !== 1 || y !== 1)) {
            map[y][x] = GOAL;
            placed = true;
        }
    }
}

// 移動処理
function movePlayer(dx, dy) {
    const nextX = player.x + dx;
    const nextY = player.y + dy;
    
    // 画面外チェック
    if (nextX < 0 || nextX >= COLS || nextY < 0 || nextY >= ROWS) return;

    const target = map[nextY][nextX];

    if (target === WALL) return;

    if (target === GOAL) {
        alert("Level " + level + " Complete!");
        level++;
        createLevel();
    } else {
        player.x = nextX;
        player.y = nextY;
        draw();
    }
}

// 描画
function draw() {
    const screen = document.getElementById('screen');
    let output = '';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (x === player.x && y === player.y) {
                output += '<span style="color:yellow">' + PLAYER + '</span>';
            } else if (map[y][x] === GOAL) {
                output += '<span style="color:gold; font-weight:bold">' + GOAL + '</span>';
            } else if (map[y][x] === WALL) {
                output += '<span style="color:gray">' + map[y][x] + '</span>';
            } else {
                output += map[y][x];
            }
        }
        output += '\n';
    }
    screen.innerHTML = output;
}

init();
