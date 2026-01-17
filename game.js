// 設定
const COLS = 15; ROWS = 15;
const WALL='#', FLOOR='.', PLAYER='@', GOAL='G', ENEMY='E';

// ステータス管理
let player = { 
    x: 1, y: 1, 
    hp: 100, maxHp: 100, 
    atk: 10, 
    xp: 0, nextXp: 50, level: 1 
};
let map = [];
let enemies = [];
let level = 1; // 階層
let isGamePaused = false; // レベルアップ画面中は操作不能にする

function init() {
    createLevel();
    setupControls();
    updateStatus();
}

function setupControls() {
    // 移動ボタン
    const move = (dx, dy) => { if(!isGamePaused) movePlayer(dx, dy); };
    
    document.getElementById('btn-up').onclick = () => move(0, -1);
    document.getElementById('btn-down').onclick = () => move(0, 1);
    document.getElementById('btn-left').onclick = () => move(-1, 0);
    document.getElementById('btn-right').onclick = () => move(1, 0);

    // PCキーボード
    window.onkeydown = (e) => {
        if(isGamePaused) return;
        if(e.key === 'ArrowUp') move(0, -1);
        if(e.key === 'ArrowDown') move(0, 1);
        if(e.key === 'ArrowLeft') move(-1, 0);
        if(e.key === 'ArrowRight') move(1, 0);
    };

    // レベルアップボタンの処理
    document.getElementById('btn-power').onclick = () => chooseUpgrade('atk');
    document.getElementById('btn-health').onclick = () => chooseUpgrade('hp');
}

function createLevel() {
    generateMap();
    placeObject(GOAL);
    spawnEnemies();
    
    // プレイヤー配置（HPなどは引き継ぐのでリセットしない）
    player.x = 1; player.y = 1;
    map[player.y][player.x] = FLOOR;
    
    log("地下 " + level + " 階に到達した");
    draw();
}

function generateMap() {
    map = [];
    for (let y=0; y<ROWS; y++) {
        let row = [];
        for (let x=0; x<COLS; x++) {
            if (y===0 || y===ROWS-1 || x===0 || x===COLS-1) row.push(WALL);
            else row.push(Math.random()<0.15 ? WALL : FLOOR);
        }
        map.push(row);
    }
}

function spawnEnemies() {
    enemies = [];
    // 階層が進むほど敵が強く、多くなる
    const count = 2 + Math.floor(level / 2); 
    for(let i=0; i<count; i++){
        let pos = placeObject(ENEMY, true);
        if(pos) {
            enemies.push({ 
                x: pos.x, y: pos.y, 
                hp: 20 + (level * 5), // 敵もだんだんタフになる
                atk: 5 + level 
            });
        }
    }
}

function placeObject(type, retPos=false) {
    while(true) {
        let x = Math.floor(Math.random()*(COLS-2))+1;
        let y = Math.floor(Math.random()*(ROWS-2))+1;
        if(map[y][x] === FLOOR && (x!==1 || y!==1)) {
            if(retPos) return {x,y};
            map[y][x] = type;
            return {x,y};
        }
    }
}

function movePlayer(dx, dy) {
    const nx = player.x + dx, ny = player.y + dy;
    if (map[ny][nx] === WALL) return;

    // 敵への攻撃判定
    let targetEnemy = enemies.find(e => e.x === nx && e.y === ny);
    if (targetEnemy) {
        attackEnemy(targetEnemy);
        // 攻撃したターンも敵は動く（反撃）
        moveEnemies();
        draw();
        return;
    }

    if (map[ny][nx] === GOAL) {
        level++;
        createLevel();
    } else {
        player.x = nx; player.y = ny;
        moveEnemies();
        draw();
    }
}

function attackEnemy(enemy) {
    // プレイヤーの攻撃
    enemy.hp -= player.atk;
    log(`敵に ${player.atk} ダメージ！(敵HP:${enemy.hp})`);
    
    if (enemy.hp <= 0) {
        log("敵を倒した！ XP+20");
        enemies = enemies.filter(e => e !== enemy); // リストから削除
        gainXp(20);
    }
}

function moveEnemies() {
    enemies.forEach(e => {
        // プレイヤーとの距離
        let dx = 0, dy = 0;
        if (player.x > e.x) dx = 1; else if (player.x < e.x) dx = -1;
        else if (player.y > e.y) dy = 1; else if (player.y < e.y) dy = -1;

        const nx = e.x + dx, ny = e.y + dy;

        // プレイヤーに隣接していたら攻撃（移動しない）
        if (nx === player.x && ny === player.y) {
            player.hp -= e.atk;
            log(`痛っ！ ${e.atk} ダメージ受けた`);
            updateStatus();
            if (player.hp <= 0) {
                alert("Game Over...");
                location.reload(); // 最初から
            }
            return; 
        }

        // 移動（他の敵や壁がない場合）
        if (map[ny][nx] !== WALL && map[ny][nx] !== GOAL && !enemies.find(en => en.x === nx && en.y === ny)) {
            e.x = nx; e.y = ny;
        }
    });
}

// 経験値とレベルアップ処理
function gainXp(amount) {
    player.xp += amount;
    if (player.xp >= player.nextXp) {
        // レベルアップ発生！
        player.level++;
        player.xp -= player.nextXp;
        player.nextXp = Math.floor(player.nextXp * 1.5); // 必要経験値アップ
        
        // 選択画面を表示
        isGamePaused = true;
        document.getElementById('levelup-modal').classList.remove('hidden');
    }
    updateStatus();
}

// 強化の選択
function chooseUpgrade(type) {
    if (type === 'atk') {
        player.atk += 3;
        log("攻撃力が上がった！");
    } else if (type === 'hp') {
        player.maxHp += 30;
        player.hp += 30; // 現在HPも回復
        log("最大HPが増えた！");
    }
    // 画面を閉じて再開
    document.getElementById('levelup-modal').classList.add('hidden');
    isGamePaused = false;
    updateStatus();
    draw();
}

function updateStatus() {
    document.getElementById('level').innerText = player.level;
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
    let output = '';
    for (let y=0; y<ROWS; y++) {
        for (let x=0; x<COLS; x++) {
            let ch = map[y][x];
            let color = '';
            
            // 敵
            let enemy = enemies.find(e => e.x === x && e.y === y);
            
            if (x===player.x && y===player.y) { ch=PLAYER; color='yellow'; }
            else if (enemy) { ch=ENEMY; color='red'; }
            else if (ch===GOAL) { color='gold; font-weight:bold'; }
            else if (ch===WALL) { color='gray'; }

            output += color ? `<span style="color:${color}">${ch}</span>` : ch;
        }
        output += '\n';
    }
    screen.innerHTML = output;
}

init();
