import React, { useEffect, useRef } from 'react';
import { detectPitch } from '../service/PitchDetection';

export default function Bar() {
    const pitchRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        // 音程バーの初期化や更新のロジックをここに記述
        let ignore = false;  // ← フラグ追加
        let stream: MediaStream | null = null;
        let request: number;
        
        const audioContext = new AudioContext();
        

         async function getMedia() {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            if (!ignore) {          // ← 古いリクエストなら無視
                return stream;
            } else {
              // コンポーネントがすでにアンマウントされているので
              stream.getTracks().forEach(track => track.stop()); // ← ストリームを停止！
                return null;
            }
          } catch (err) {
            return null;
          }
        }

        getMedia().then(stream => {
          if (stream) {
            
            // 音声ストリームを処理するコードをここに記述
            
            
            const source = audioContext.createMediaStreamSource(stream);

            // …

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(dataArray);

            // Connect the source to be analysed
            source.connect(analyser);

            // Get a canvas defined with ID "canvas" in the HTML
            const canvas = document.getElementById("canvas") as HTMLCanvasElement;
            const canvasCtx = canvas.getContext("2d")!;

            function draw() {
              request = requestAnimationFrame(draw);
            
              analyser.getFloatTimeDomainData(dataArray);
            
              canvasCtx.fillStyle = "rgb(200, 200, 200)";
              canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
              canvasCtx.lineWidth = 2;
              canvasCtx.strokeStyle = "rgb(0, 0, 0)";
            
              canvasCtx.beginPath();
            
              const sliceWidth = (canvas.width * 1.0) / bufferLength;
              let x = 0;
            
              for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] + 1.0; // [-1, 1] の範囲を [0, 2] に変換
                const y = (v * canvas.height) / 2;
            
                if (i === 0) {
                  canvasCtx.moveTo(x, y);
                } else {
                  canvasCtx.lineTo(x, y);
                }
            
                x += sliceWidth;
              }
          
              canvasCtx.lineTo(canvas.width, canvas.height / 2);
              canvasCtx.stroke();
              const hz = detectPitch(dataArray, audioContext.sampleRate);
              if (pitchRef.current && hz > 0) {
                pitchRef.current.textContent = hz.toFixed(1) + " Hz";
              } else {
                pitchRef.current!.textContent = "音程: -- Hz";
              }
            }
            draw();
          }
        });

        

        return () => {
          ignore = true;   // ← クリーンアップ
          stream?.getTracks().forEach(track => track.stop()); // ← マイクを解放！
          cancelAnimationFrame(request);
          audioContext.close(); // ← オーディオコンテキストもクローズ！
        };
        

        // draw an oscilloscope of the current audio source

        
    }, []); // 空の依存配列を渡すことで、コンポーネントのマウント時に一度だけ実行される



    return (
        <div className="bar">
            ここで音程バーを表示する予定
            <canvas id="canvas" width="400" height="100"></canvas>
            <span ref={pitchRef}>音程: -- Hz</span>
        </div>
    )
}