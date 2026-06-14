import React, { useEffect } from 'react';

export default function Bar() {

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
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            // Connect the source to be analysed
            source.connect(analyser);

            // Get a canvas defined with ID "canvas" in the HTML
            const canvas = document.getElementById("canvas") as HTMLCanvasElement;
            const canvasCtx = canvas.getContext("2d")!;

            function draw() {
              request = requestAnimationFrame(draw);
            
              analyser.getByteTimeDomainData(dataArray);
            
              canvasCtx.fillStyle = "rgb(200, 200, 200)";
              canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
              canvasCtx.lineWidth = 2;
              canvasCtx.strokeStyle = "rgb(0, 0, 0)";
            
              canvasCtx.beginPath();
            
              const sliceWidth = (canvas.width * 1.0) / bufferLength;
              let x = 0;
            
              for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
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
        </div>
    )
}