// socket.io-clientの型定義はグローバルにある前提、もしくはanyで逃げる（簡易構成のため）
declare const io: any;

const socket = io();

// 変数定義
let lastPeakTime: number = 0;
let intervalHistory: number[] = [];
const HISTORY_SIZE: number = 3;

// 設定値
const THRESHOLD: number = 8.0;
const MIN_INTERVAL: number = 200;

// HTML要素の取得（nullチェックが必要）
const bpmDisp = document.getElementById('bpmDisp') as HTMLElement;
const volDisp = document.getElementById('volDisp') as HTMLElement;
const startBtn = document.querySelector('.big-btn') as HTMLButtonElement;

// グローバル関数として定義してHTMLから呼べるようにする
(window as any).start = function() {
    // iOS 13+ の許可リクエスト
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((state: string) => {
            if (state === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            }
        });
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }
    if(startBtn) startBtn.style.display = 'none';
}

function handleMotion(event: DeviceMotionEvent) {
    const acc = event.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    // 3軸の合成ベクトル
    const intensity = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
    const now = Date.now();

    if (intensity > THRESHOLD && (now - lastPeakTime) > MIN_INTERVAL) {
        
        if (lastPeakTime !== 0) {
            const diff = now - lastPeakTime;
            
            intervalHistory.push(diff);
            if(intervalHistory.length > HISTORY_SIZE) intervalHistory.shift();
            
            const avgDiff = intervalHistory.reduce((a,b)=>a+b, 0) / intervalHistory.length;

            // テンポ倍率 (基準 500ms)
            let rate = 500 / avgDiff; 
            rate = Math.max(0.5, Math.min(rate, 2.0));

            // 音量 (-30dB ~ 0dB)
            let volume = (intensity - 8) * 1.5; 
            if (volume > 0) volume = 0;
            if (volume < -30) volume = -30;

            // 画面表示
            if(bpmDisp) bpmDisp.innerText = rate.toFixed(2) + "x";
            if(volDisp) volDisp.innerText = volume.toFixed(1) + "dB";

            // 送信
            socket.emit('conduct-command', { 
                rate: rate, 
                volume: volume 
            });
        }
        lastPeakTime = now;
    }
}