declare const io: any; // Socket.ioの型エラー回避
declare const DeviceMotionEvent: any; // iOS用の型定義

const socket = io();

let lastPeakTime: number = 0;
let intervalHistory: number[] = [];
const HISTORY_SIZE: number = 3;
const THRESHOLD: number = 8.0;
const MIN_INTERVAL: number = 200;

// HTML要素の取得
const bpmDisp = document.getElementById('bpmDisp');
const volDisp = document.getElementById('volDisp');
const startBtn = document.querySelector('.big-btn') as HTMLElement;

// グローバル関数として登録
(window as any).start = function() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then((state: string) => {
            if (state === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            }
        });
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }
    if(startBtn) startBtn.style.display = 'none';
}

function handleMotion(event: any) {
    const acc = event.acceleration;
    if (!acc || acc.x === null) return;

    const intensity = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
    const now = Date.now();

    if (intensity > THRESHOLD && (now - lastPeakTime) > MIN_INTERVAL) {
        if (lastPeakTime !== 0) {
            const diff = now - lastPeakTime;
            intervalHistory.push(diff);
            if(intervalHistory.length > HISTORY_SIZE) intervalHistory.shift();
            const avgDiff = intervalHistory.reduce((a,b)=>a+b, 0) / intervalHistory.length;

            let rate = 500 / avgDiff; 
            rate = Math.max(0.5, Math.min(rate, 2.0));

            let volume = (intensity - 8) * 1.5; 
            if (volume > 0) volume = 0;
            if (volume < -30) volume = -30;

            if(bpmDisp) bpmDisp.innerText = rate.toFixed(2) + "x";
            if(volDisp) volDisp.innerText = volume.toFixed(1) + "dB";

            socket.emit('conduct-command', { rate: rate, volume: volume });
        }
        lastPeakTime = now;
    }
}