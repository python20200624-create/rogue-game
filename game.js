// ■ 設定とアイコン定義
const COLS = 13; 
const ROWS = 13;
const CH = { wall: '🧱', floor: '', player: '🧙', goal: '🪜', chest: '🎁' };
const MONSTERS = [
    { icon: '🦇', name: 'コウモリ', hp: 15, atk: 3, xp: 5 },
    { icon: '👻', name: 'ゴースト', hp: 30, atk: 8, xp: 12 },
    { icon: '👹', name: 'オーガ',   hp: 60, atk: 15, xp: 25 }
];

// ■ サウンド設定（ここが追加部分！）
// ファイル名が間違っていると鳴らないので注意してください
const SOUNDS = {
    bgm: new Audio('bgm.mp3'),
    attack: new Audio('attack.mp3'),
    levelup: new Audio('levelup.mp3'),
    dead: new Audio('dead.mp3')
};
// BGMはループ再生する
SOUNDS.bgm.loop = true;
SOUNDS.bgm.volume = 0.5; // 音量調整（0.0〜1.0）

// SEを鳴らす関数
function playSe(name) {
    const se = SOUNDS[name];
    if(se) {
        se.currentTime = 0; // 連続再生できるように巻き戻す
        se.play().catch(e => console.log("再生エラー:", e)); // エラーが出ても止まらないようにする
    }
}

// BGMを開始する関数（最初の操作時に呼ぶ）
let bgmStarted = false;
function startBgm() {
    if (!bgmStarted) {
        SOUNDS.bgm.play().catch(e => console.log("BGM再生制限:", e));
        bgmStarted = true;
    }
}

// ■ 変数管理
let map = [];
let enemies = [];
let items = [];
let player = { x: 1, y: 1, hp: 100, maxHp: 100, atk: 10, xp: 0, nextXp: 50, level: 1 };
let level = 1;
let isGamePaused = false;

function init() {
    setupControls();
    startNewLevel();
}

function setupControls() {
    // 操作時にBGM開始を試みる
    const move = (dx, dy) => { 
        startBgm(); // ★ここでBGMスタート
        if(!isGamePaused) movePlayer(dx, dy); 
    };
    
    document.getElementById('btn-up').onclick = () => move(0, -1);
    document.getElementById('btn-down').onclick = () => move(0, 1);
    document.getElementById('btn-left').onclick = () => move(-1, 0);
    document.getElementById('btn-right').onclick = () => move(1, 0);

    window.onkeydown = (e) => {
        if(isGamePaused) return;
        // キー操作でもBGMスタート
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) startBgm();

        if(e.key === 'ArrowUp') move(0, -1);
        if(e.key === 'ArrowDown') move(0, 1);
        if(e.key === 'ArrowLeft') move(-1, 0);
        if(e.key === 'ArrowRight') move(1, 0);
    };

    document.getElementById('btn-power').onclick = () => chooseUpgrade('atk');
    document.getElementById('btn-health').onclick = () => chooseUpgrade('hp');
}

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
    log(`地下 ${level} 階`);
    updateStatus();
    draw();
}

function generateMap() {
    map = [];
    for (let y=0; y<ROWS; y++) {
        let row = [];
        for (let x=0; x<COLS; x++) {
            if (y===0 || y===ROWS-1 || x===0 || x===COLS-1) row.push(CH.wall);
            else row.push(Math.random() < 0.2 ? CH.wall : CH.floor);
        }
        map.push(row);
    }
}

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
            enemies.push({ x: pos.x, y: pos.y, ...type, hp: type.hp + (level * 2) });
        }
    }
}

function spawnItems() {
    items = [];
    const count = Math.floor(Math.random() * 2) + 1;
    for(let i=0; i<count; i++){
        let pos = placeObject(CH.chest);
        if(pos) items.push({ x: pos.x, y: pos.y });
    }
}

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

function openChest(index) {
    if (Math.random() < 0.7) {
        playSe('levelup'); // ★アイテムゲット音（仮）
        let heal = 30;
        player.hp = Math.min(player.hp + heal, player.maxHp);
        log(`宝箱だ！薬を見つけた(HP+${heal})`);
    } else {
        playSe('attack'); // ★罠の爆発音
        let dmg = 15;
        player.hp -= dmg;
        log(`罠だ！爆発した！(HP-${dmg})`);
        checkGameOver();
    }
    updateStatus();
}

function attackEnemy(enemy) {
    playSe('attack'); // ★攻撃音
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
            playSe('attack'); // ★敵の攻撃音
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
        SOUNDS.bgm.pause(); // BGM止める
        playSe('dead');     // ★死亡音
        player.hp = 0;
        updateStatus();
        alert(`💀 GAME OVER 💀\n到達階層: ${level}`);
        location.reload();
    }
}

function gainXp(amount) {
    player.xp += amount;
    if (player.xp >= player.nextXp) {
        playSe('levelup'); // ★レベルアップ音
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

function draw() {
    const screen = document.getElementById('screen');
    screen.innerHTML = '';
    for (let y=0; y<ROWS; y++) {
        for (let x=0; x<COLS; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            let char = map[y][x];
            let enemy = enemies.find(e => e.x === x && e.y === y);
            let item = items.find(i => i.x === x && i.y === y);
            if (x === player.x && y === player.y) char = CH.player;
            else if (enemy) char = enemy.icon;
            else if (item) char = CH.chest;
            cell.innerText = char;
            screen.appendChild(cell);
        }
    }
}

init();
