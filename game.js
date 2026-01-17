// 設定
const COLS = 30; // 横
const ROWS = 15; // 縦
const WALL = '#';
const FLOOR = '.';
const PLAYER = '@';
const GOAL = 'G';

let map = [];
let player = { x: 1, y: 1 };
let level = 1;

// 初期化
function init() {
    createLevel();
    
    window.addEventListener('keydown', (e) => {
        let dx = 0; let dy = 0;
        if (e.key === 'ArrowUp') dy = -1;
        if (e.key === 'ArrowDown') dy = 1;
        if (e.key === 'ArrowLeft') dx = -1;
        if (e.key === 'ArrowRight') dx = 1;
        if (dx !== 0 || dy !== 0) movePlayer(dx, dy);
    });
}

// レベル生成（マップとゴールの配置）
function createLevel() {
    generateMap();
    spawnGoal();
    // プレイヤー位置のリセット
    player.x = 1; player.y = 1;
    map[player.y][player.x] = FLOOR;
    
    // 画面の更新
    document.getElementById('hp').innerText = level; // HPの代わりにレベル表示
    document.querySelector('#stats').innerHTML = 'Level: ' + level;
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
                row.push(Math.random() < 0.1 ? WALL : FLOOR);
            }
        }
        map.push(row);
    }
}

// ゴールをランダムな床に配置
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
    const target = map[nextY][nextX];

    if (target === WALL) return; // 壁なら進まない

    if (target === GOAL) {
        alert("レベル " + level + " クリア！");
        level++;
        createLevel(); // 次のレベルへ
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
