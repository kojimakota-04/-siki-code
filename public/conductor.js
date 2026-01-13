// ★ここに DeviceMotionEvent の定義を書かないのが正解です！
const socket = io();
// HTML要素
const bpmDisp = document.getElementById('bpmDisp');
const volDisp = document.getElementById('volDisp');
const startBtn = document.querySelector('.big-btn');
// --- 物理演算・指揮判定用の変数 ---
let velocityY = 0;
let positionY = 0;
let lastTime = 0;
let lastZeroTime = 0;
let zeroCrossCount = 0;
let currentBpm = 60;
let targetBpm = 60;
let currentVol = -30;
let targetVol = -30;
const SMOOTHING = 0.2;
const FRICTION = 0.90;
// 開始処理
window.start = function () {
    if (startBtn)
        startBtn.style.display = 'none';
    if (bpmDisp)
        bpmDisp.innerText = "準備中...";
    // ★修正ポイント： (DeviceMotionEvent as any) をつけて強制的に実行させる
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then((state) => {
            if (state === 'granted') {
                startSensor();
            }
            else {
                alert("許可されませんでした");
                if (startBtn)
                    startBtn.style.display = 'block';
            }
        });
    }
    else {
        startSensor();
    }
};
function startSensor() {
    window.addEventListener('devicemotion', handleMotion);
    lastTime = Date.now();
    requestAnimationFrame(updateLoop);
}
function handleMotion(event) {
    const acc = event.acceleration;
    if (!acc)
        return;
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    let ay = acc.y || 0;
    if (Math.abs(ay) < 0.5)
        ay = 0;
    const prevVelocity = velocityY;
    velocityY = (velocityY + ay * dt) * FRICTION;
    positionY = (positionY + velocityY * dt) * FRICTION;
    // --- ゼロ交差検知 ---
    if ((prevVelocity > 0 && velocityY <= 0) || (prevVelocity < 0 && velocityY >= 0)) {
        zeroCrossCount++;
        if (zeroCrossCount >= 2) {
            const beatDuration = (now - lastZeroTime) / 1000;
            if (beatDuration > 0.3 && beatDuration < 3.0) {
                targetBpm = 60 / beatDuration;
                let rawRate = targetBpm / 100;
                targetBpm = Math.max(0.5, Math.min(rawRate, 2.5));
            }
            zeroCrossCount = 0;
            lastZeroTime = now;
        }
    }
    // --- 音量 ---
    const amplitude = Math.abs(positionY);
    let rawVol = -30 + (amplitude * 80);
    targetVol = Math.max(-30, Math.min(rawVol, 0));
}
function updateLoop() {
    currentBpm += (targetBpm - currentBpm) * SMOOTHING;
    currentVol += (targetVol - currentVol) * SMOOTHING;
    if (bpmDisp)
        bpmDisp.innerText = currentBpm.toFixed(2) + "x";
    if (volDisp)
        volDisp.innerText = currentVol.toFixed(1) + "dB";
    // 即時送信
    socket.emit('conduct-command', { rate: targetBpm, volume: targetVol });
    requestAnimationFrame(updateLoop);
}
