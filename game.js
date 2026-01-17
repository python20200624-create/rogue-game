// ■ 設定とアイコン定義
const COLS = 13; // スマホで見やすいよう少し幅を調整
const ROWS = 13;
// 絵文字を使うと見た目が豪華になります
const CH = {
    wall: '🧱',
    floor: '　', // 全角スペースのほうがズレにくい場合があるが、ここでは見やすさ重視
    player: '🧙',
    goal: '🪜',
    chest: '🎁'
};

// 敵データ（アイコン、強さ）
const MONSTERS = [
    { icon: '🦇', name: 'コウモリ', hp: 15, atk: 3, xp: 5 },  // レベル1〜
    { icon: '👻', name: 'ゴースト', hp: 30, atk: 8, xp: 12 }, // レベル3〜
    { icon: '👹', name: 'オーガ',   hp: 60, atk: 15, xp: 25 } // レベル6〜
];

// ■ 変数管理
let map = [];
let enemies = [];
let items = []; // 宝箱リスト
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
    
    // スマホボタン
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

    // レベルアップ選択
    document.getElementById('btn-power').onclick = () => chooseUpgrade('atk');
    document.getElementById('btn-health').onclick = () => chooseUpgrade('hp');
}

// ■ 新しい階層を作る（クリア不可能なマップは作り直す）
function startNewLevel() {
    let success = false;
    let attempts = 0;

    // ゴールに辿り着けるマップができるまで繰り返す（最大100回）
    while (!success && attempts < 100) {
        attempts++;
        generateMap(); // 壁と床を作る
        
        // プレイヤー配置
        player.x = 1; player.y = 1;
        map[player.y][player.x] = CH.floor;

        // ゴール配置（仮）
        let goalPos = placeObject(CH.goal, true); // 場所だけ決める

        // ★ここで「到達確認」を行う
        if (goalPos && checkReachability(player.x, player.y, goalPos.x, goalPos.y)) {
            // 到達可能なら正式に配置して採用
            map[goalPos.y][goalPos.x] = CH.goal;
            success = true;
        }
    }
    
    // 敵と宝箱を配置
    spawnEnemies();
    spawnItems();

    log(`地下 ${level} 階 (生成:${attempts}回)`);
    updateStatus();
    draw();
}

// ■ マップ生成（ランダム）
function generateMap() {
    map = [];
    for (let y=0; y<ROWS; y++) {
        let row = [];
        for (let x=0; x<COLS; x++) {
            // 外周は壁
            if (y===0 || y===ROWS-1 || x===0 || x===COLS-1) {
                row.push(CH.wall);
            } else {
                // 壁の密度: 20%
                row.push(Math.random() < 0.2 ? CH.wall : CH.floor);
            }
        }
        map.push(row);
    }
}

// ■ 到達可能かチェックする関数（幅優先探索）
function checkReachability(startX, startY, goalX, goalY) {
    let queue = [{x: startX, y: startY}];
    let visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        let p = queue.shift();
        if (p.x === goalX && p.y === goalY) return true; // ゴールに着けた！

        // 上下左右をチェック
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(d => {
            let nx = p.x + d[0], ny = p.y + d[1];
            // 壁でなく、まだチェックしてない場所なら進む
            if (map[ny][nx] !== CH.wall && !visited.has(`${nx},${ny}`)) {
                visited.add(`${nx},${ny}`);
                queue.push({x: nx, y: ny});
            }
        });
    }
    return false; // どうやっても着けない
}

// ■ 敵の配置
function spawnEnemies() {
    enemies = [];
    const count = 2 + Math.floor(level / 2); // 階層ごとに敵が増える
    
    // 現在のレベルに合わせて出現する敵を決める
    let availableTypes = [];
    if (level >= 1) availableTypes.push(MONSTERS[0]); // コウモリ
    if (level >= 3) availableTypes.push(MONSTERS[1]); // ゴースト
    if (level >= 6) availableTypes.push(MONSTERS[2]); // オーガ

    for(let i=0; i<count; i++){
        let pos = placeObject(null, true); // 空き地を探す
        if(pos) {
            // ランダムに敵タイプを選ぶ
            let type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            enemies.push({ 
                x: pos.x, y: pos.y, 
                ...type, // 敵データをコピー
                hp: type.hp + (level * 2) // 階層補正
            });
        }
    }
}

// ■ 宝箱の配置
function spawnItems() {
    items = [];
    const count = Math.floor(Math.random() * 2) + 1; // 1〜2個
    for(let i=0; i<count; i++){
        let pos = placeObject(CH.chest);
        if(pos) items.push({ x: pos.x, y: pos.y });
    }
}

// ■ オブジェクトを空き地に置く
function placeObject(icon, returnOnlyPos=false) {
    for(let i=0; i<100; i++) { // 無限ループ防止のため100回上限
        let x = Math.floor(Math.random()*(COLS-2))+1;
        let y = Math.floor(Math.random()*(ROWS-2))+1;
        // 壁でもゴールでも初期位置でもない場所
        if(map[y][x] === CH.floor && (x!==1 || y!==1)) {
            if(returnOnlyPos) return {x,y};
            map[y][x] = icon;
            return {x,y};
        }
    }
    return null;
}

// ■ プレイヤー移動処理
function movePlayer(dx, dy) {
    const nx = player.x + dx, ny = player.y + dy;
    const target = map[ny][nx];

    if (target === CH.wall) return;

    // 敵への攻撃
    let enemy = enemies.find(e => e.x === nx && e.y === ny);
    if (enemy) {
        attackEnemy(enemy);
        moveEnemies();
        draw();
        return;
    }

    // 宝箱を開ける
    let itemIndex = items.findIndex(i => i.x === nx && i.y === ny);
    if (itemIndex !== -1) {
        openChest(itemIndex);
        map[ny][nx] = CH.floor; // 宝箱を消す
        items.splice(itemIndex, 1);
        // 宝箱は移動せずにその場で開けることにする（移動してもよい）
        draw();
        return; 
    }

    // 移動
    if (target === CH.goal) {
        level++;
        player.hp = Math.min(player.hp + 20, player.maxHp); // クリア回復
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
    // 70%で回復、30%で罠
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
        
        // プレイヤーへの攻撃
        if (nx === player.x && ny === player.y) {
            player.hp -= e.atk;
            log(`${e.name}の攻撃！(${e.atk}ダメ)`);
            checkGameOver();
            return;
        }

        // 敵の移動（壁、ゴール、宝箱、他の敵には乗らない）
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
        
        // モーダル表示
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

// ■ 描画
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
    let output = '';
    
    // マップ全体を描画
    // 毎回すべて文字を作ると重いかもしれないが、この規模ならOK
    for (let y=0; y<ROWS; y++) {
        let line = "";
        for (let x=0; x<COLS; x++) {
            let char = map[y][x]; // 壁か床かゴール
            
            // 上書き表示の優先順位： プレイヤー > 敵 > 宝箱 > マップ
            let enemy = enemies.find(e => e.x === x && e.y === y);
            let item = items.find(i => i.x === x && i.y === y);

            if (x === player.x && y === player.y) {
                char = CH.player;
            } else if (enemy) {
                char = enemy.icon;
            } else if (item) {
                char = CH.chest;
            }
            
            line += char;
        }
        output += line + '\n';
    }
    screen.innerText = output;
}

init();
