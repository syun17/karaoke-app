const rmsGate = 0.010;
export function detectPitch(b:Float32Array, sr:number){
    const SIZE = b.length;
    let rms = 0;
    for (let i=0;i<SIZE;i++) rms += b[i]*b[i];
    rms = Math.sqrt(rms/SIZE);
    if (rms < rmsGate) return -1;

    const minLag = Math.floor(sr/1000); // up to 1000 Hz
    const maxLag = Math.min(SIZE-2, Math.floor(sr/75)); // down to 75 Hz

    let lag = minLag, bestLag = -1, bestCorr = 0;
    // skip the initial descent of the autocorrelation
    let prev = correlate(b, SIZE, minLag);
    let cur: number;
    for (lag = minLag+1; lag <= maxLag; lag++){
      cur = correlate(b, SIZE, lag);
      if (cur < prev){ break; } // reached first trough -> start hunting peak from here
      prev = cur;
    }
    for (; lag <= maxLag; lag++){
      cur = correlate(b, SIZE, lag);
      if (cur > bestCorr){ bestCorr = cur; bestLag = lag; }
    }
    if (bestLag < 0) return -1;

    // clarity gate (1.0 == perfectly periodic)
    const clarity = bestCorr / (rms*rms*(SIZE-bestLag));
    if (clarity < 0.5) return -1;

    // parabolic interpolation
    const y1 = correlate(b, SIZE, bestLag-1);
    const y2 = bestCorr;
    const y3 = correlate(b, SIZE, bestLag+1);
    const denom = (y1 - 2*y2 + y3);
    const shift = denom !== 0 ? 0.5*(y1 - y3)/denom : 0;
    const trueLag = bestLag + shift;
    return sr/trueLag;
  }
  function correlate(b:Float32Array, SIZE:number, lag:number){
    let sum = 0;
    for (let i=0;i<SIZE-lag;i++) sum += b[i]*b[i+lag];
    return sum;
  }