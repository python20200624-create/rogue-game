// ■ 設定とアイコン定義
// ※CSS側もこの数に合わせて repeat(13, ...) としています
const COLS = 13; 
const ROWS = 13;

const CH = {
    wall: '🧱',
    // 床は空白のままですが、マス目に入れるのでズレません
    floor: '', 
    player: '🧙',
    goal: '🪜',
    chest: '🎁'
};

// 敵データ
const MONSTERS = [
    { icon: '🦇', name: 'コウモリ', hp: 15, atk: 3, xp: 5 },
    { icon: '👻', name: 'ゴースト', hp: 30, atk: 8, xp: 12 },
    { icon: '👹', name: 'オーガ',   hp: 60, atk: 15, xp: 25 }
];

// ■ 変数管理
let map = [];
let enemies = [];
let items = [];
let player = { 
    x: 1, y: 1, 
    hp: 100, maxHp: 100, 
    atk: 10, 
    xp: 0, nextXp: 50, level: 1 
};
let level = 1;
let isGamePaused = false;

// ■ 初期化
function init() {
    setupControls();
    startNewLevel();
}

// ■ コントローラー設定
function setupControls() {
    const move = (dx, dy) => { if(!isGamePaused) movePlayer(dx, dy); };
    document.getElementById('btn-up').onclick = () => move(0, -1);
    document.getElementById('btn-down').onclick = () => move(0, 1);
    document.getElementById('btn-left').onclick = () => move(-1, 0);
    document.getElementById('btn-right').onclick = () => move(1, 0);

    window.onkeydown = (e) => {
        if(isGamePaused) return;
        if(e.key === 'ArrowUp') move(0, -1);
        if(e.key === 'ArrowDown') move(0, 1);
        if(e.key === 'ArrowLeft') move(-1, 0);
        if(e.key === 'ArrowRight') move(1, 0);
    };

    document.getElementById('btn-power').onclick = () => chooseUpgrade('atk');
    document.getElementById('btn-health').onclick = () => chooseUpgrade('hp');
}

// ■ 新しい階層を作る
function startNewLevel() {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 100) {
        attempts++;
        generateMap();
        player.x = 1; player.y = 1;
        map[player.y][player.x] = CH.floor;
        let goalPos = placeObject(CH.goal, true);
        if (goalPos && checkReachability(player.x, player.y, goalPos.x, goalPos.y)) {
            map[goalPos.y][goalPos.x] = CH.goal;
            success = true;
        }
    }
    spawnEnemies();
    spawnItems();
    log(`地下 ${level} 階 (生成:${attempts}回)`);
    updateStatus();
    draw();
}

// ■ マップ生成
function generateMap() {
    map = [];
    for (let y=0; y<ROWS; y++) {
        let row = [];
        for (let x=0; x<COLS; x++) {
            if (y===0 || y===ROWS-1 || x===0 || x===COLS-1) {
                row.push(CH.wall);
            } else {
                row.push(Math.random() < 0.2 ? CH.wall : CH.floor);
            }
        }
        map.push(row);
    }
}

// ■ 到達可能かチェック
function checkReachability(startX, startY, goalX, goalY) {
    let queue = [{x: startX, y: startY}];
    let visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        let p = queue.shift();
        if (p.x === goalX && p.y === goalY) return true;
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(d => {
            let nx = p.x + d[0], ny = p.y + d[1];
            if (map[ny][nx] !== CH.wall && !visited.has(`${nx},${ny}`)) {
                visited.add(`${nx},${ny}`);
                queue.push({x: nx, y: ny});
            }
        });
    }
    return false;
}

// ■ 敵の配置
function spawnEnemies() {
    enemies = [];
    const count = 2 + Math.floor(level / 2);
    let availableTypes = [];
    if (level >= 1) availableTypes.push(MONSTERS[0]);
    if (level >= 3) availableTypes.push(MONSTERS[1]);
    if (level >= 6) availableTypes.push(MONSTERS[2]);

    for(let i=0; i<count; i++){
        let pos = placeObject(null, true);
        if(pos) {
            let type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            enemies.push({ 
                x: pos.x, y: pos.y, 
                ...type, 
                hp: type.hp + (level * 2)
            });
        }
    }
}

// ■ 宝箱の配置
function spawnItems() {
    items = [];
    const count = Math.floor(Math.random() * 2) + 1;
    for(let i=0; i<count; i++){
        let pos = placeObject(CH.chest);
        if(pos) items.push({ x: pos.x, y: pos.y });
    }
}

// ■ オブジェクトを置く
function placeObject(icon, returnOnlyPos=false) {
    for(let i=0; i<100; i++) {
        let x = Math.floor(Math.random()*(COLS-2))+1;
        let y = Math.floor(Math.random()*(ROWS-2))+1;
        if(map[y][x] === CH.floor && (x!==1 || y!==1)) {
            if(returnOnlyPos) return {x,y};
            map[y][x] = icon;
            return {x,y};
        }
    }
    return null;
}

// ■ プレイヤー移動
function movePlayer(dx, dy) {
    const nx = player.x + dx, ny = player.y + dy;
    const target = map[ny][nx];
    if (target === CH.wall) return;

    let enemy = enemies.find(e => e.x === nx && e.y === ny);
    if (enemy) {
        attackEnemy(enemy);
        moveEnemies();
        draw();
        return;
    }

    let itemIndex = items.findIndex(i => i.x === nx && i.y === ny);
    if (itemIndex !== -1) {
        openChest(itemIndex);
        map[ny][nx] = CH.floor;
        items.splice(itemIndex, 1);
        draw();
        return; 
    }

    if (target === CH.goal) {
        level++;
        player.hp = Math.min(player.hp + 20, player.maxHp);
        log("階段を降りた... (HP20回復)");
        startNewLevel();
    } else {
        player.x = nx; player.y = ny;
        moveEnemies();
        draw();
    }
}

// ■ 宝箱処理
function openChest(index) {
    if (Math.random() < 0.7) {
        let heal = 30;
        player.hp = Math.min(player.hp + heal, player.maxHp);
        log(`宝箱だ！薬を見つけた(HP+${heal})`);
    } else {
        let dmg = 15;
        player.hp -= dmg;
        log(`罠だ！爆発した！(HP-${dmg})`);
        checkGameOver();
    }
    updateStatus();
}

// ■ 戦闘処理
function attackEnemy(enemy) {
    enemy.hp -= player.atk;
    log(`${enemy.name}に${player.atk}のダメージ！`);
    if (enemy.hp <= 0) {
        log(`${enemy.name}を倒した！(XP+${enemy.xp})`);
        enemies = enemies.filter(e => e !== enemy);
        gainXp(enemy.xp);
    }
}

function moveEnemies() {
    enemies.forEach(e => {
        let dx = 0, dy = 0;
        if (player.x > e.x) dx = 1; else if (player.x < e.x) dx = -1;
        else if (player.y > e.y) dy = 1; else if (player.y < e.y) dy = -1;
        const nx = e.x + dx, ny = e.y + dy;
        
        if (nx === player.x && ny === player.y) {
            player.hp -= e.atk;
            log(`${e.name}の攻撃！(${e.atk}ダメ)`);
            checkGameOver();
            return;
        }

        let hitObj = map[ny][nx] !== CH.floor;
        let hitEnemy = enemies.find(en => en.x === nx && en.y === ny);
        let hitItem = items.find(i => i.x === nx && i.y === ny);

        if (!hitObj && !hitEnemy && !hitItem) {
            e.x = nx; e.y = ny;
        }
    });
    updateStatus();
}

function checkGameOver() {
    if (player.hp <= 0) {
        player.hp = 0;
        updateStatus();
        alert(`💀 GAME OVER 💀\n到達階層: ${level}`);
        location.reload();
    }
}

// ■ 経験値とレベルアップ
function gainXp(amount) {
    player.xp += amount;
    if (player.xp >= player.nextXp) {
        player.level++;
        player.xp -= player.nextXp;
        player.nextXp = Math.floor(player.nextXp * 1.5);
        isGamePaused = true;
        document.getElementById('levelup-modal').classList.remove('hidden');
    }
    updateStatus();
}

function chooseUpgrade(type) {
    if (type === 'atk') {
        player.atk += 3;
        log("力がみなぎってきた！(攻+3)");
    } else if (type === 'hp') {
        player.maxHp += 30;
        player.hp += 30;
        log("体力が溢れてくる！(HP+30)");
    }
    document.getElementById('levelup-modal').classList.add('hidden');
    isGamePaused = false;
    updateStatus();
    draw();
}

// ■ ステータス更新
function updateStatus() {
    document.getElementById('level').innerText = level;
    document.getElementById('hp').innerText = player.hp;
    document.getElementById('max-hp').innerText = player.maxHp;
    document.getElementById('xp').innerText = player.xp;
    document.getElementById('atk').innerText = player.atk;
}

function log(text) {
    document.getElementById('msg').innerText = text;
}

// ▼▼▼ ここが変更された描画関数 ▼▼▼
function draw() {
    const screen = document.getElementById('screen');
    // 一度画面を空っぽにする
    screen.innerHTML = '';

    // マス目を一個ずつ作って並べていく
    for (let y=0; y<ROWS; y++) {
        for (let x=0; x<COLS; x++) {
            // 1. マス目の入れ物（div）を作る
            const cell = document.createElement('div');
            cell.className = 'cell'; // CSSで定義したスタイルを適用

            // 2. そのマスに入れる絵文字を決める
            let char = map[y][x];
            let enemy = enemies.find(e => e.x === x && e.y === y);
            let item = items.find(i => i.x === x && i.y === y);

            if (x === player.x && y === player.y) {
                char = CH.player;
            } else if (enemy) {
                char = enemy.icon;
            } else if (item) {
                char = CH.chest;
            }

            // 3. マス目に絵文字を入れる
            cell.innerText = char;

            // 4. 画面に追加する
            screen.appendChild(cell);
        }
    }
}
// ▲▲▲ ここまで ▲▲▲

init();
