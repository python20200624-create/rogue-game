// 設定
const COLS = 30; // 横の広さ
const ROWS = 15; // 縦の広さ
const WALL = '#';
const FLOOR = '.';
const PLAYER = '@';

let map = [];
let player = { x: 1, y: 1, hp: 100 };

// 初期化処理
function init() {
    generateMap();
    draw();
    
    // キーボード操作の受付
    window.addEventListener('keydown', (e) => {
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowUp') dy = -1;
        if (e.key === 'ArrowDown') dy = 1;
        if (e.key === 'ArrowLeft') dx = -1;
        if (e.key === 'ArrowRight') dx = 1;

        if (dx !== 0 || dy !== 0) {
            movePlayer(dx, dy);
        }
    });
}

// マップ生成（ランダムに壁を置く簡易版）
function generateMap() {
    map = [];
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        for (let x = 0; x < COLS; x++) {
            // 外周は必ず壁にする
            if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
                row.push(WALL);
            } else {
                // 10%の確率で壁、それ以外は床
                row.push(Math.random() < 0.1 ? WALL : FLOOR);
            }
        }
        map.push(row);
    }
    // プレイヤーの初期位置は必ず床にする
    map[player.y][player.x] = FLOOR; 
}

// プレイヤーの移動処理
function movePlayer(dx, dy) {
    const nextX = player.x + dx;
    const nextY = player.y + dy;

    // 壁でなければ進む
    if (map[nextY][nextX] !== WALL) {
        player.x = nextX;
        player.y = nextY;
        draw();
    }
}

// 画面描画
function draw() {
    const screen = document.getElementById('screen');
    let output = '';

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (x === player.x && y === player.y) {
                output += '<span style="color:yellow">' + PLAYER + '</span>';
            } else {
                // 壁の色を変えるなどの装飾もここで可能
                if (map[y][x] === WALL) {
                    output += '<span style="color:gray">' + map[y][x] + '</span>';
                } else {
                    output += map[y][x];
                }
            }
        }
        output += '\n'; // 改行
    }
    screen.innerHTML = output;
}

// ゲーム開始
init();