"""Per-segment level and band analysis of scripts/engine-render.mjs output.

Usage: .sample-analysis-venv/bin/python scripts/analyse-engine-render.py output/engine-render
Band columns are absolute levels in dBFS; the segments follow the default route.
"""
import sys, glob, os, wave, numpy as np
d = sys.argv[1]
segments = [("idle",0.8,2.9),("launch",3.2,6),("accel",6,13),("cruise100",14,19),("decel",19.5,25.5),("cruise30",26.3,28.7)]
bands = [("sub<60",20,60),("60-200",60,200),("200-1k",200,1000),("1-4k",1000,4000),("4-8k",4000,8000),(">8k",8000,20000)]
def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64).reshape(-1,2)/32768; return x
def row(x):
    m = x.mean(axis=1); n = len(m)
    rms = 20*np.log10(np.sqrt(np.mean(m**2))+1e-12); peak = 20*np.log10(np.abs(x).max()+1e-12)
    win = np.hanning(n); spec = np.abs(np.fft.rfft(m*win))**2; f = np.fft.rfftfreq(n, 1/48000); tot = spec.sum()
    b = [10*np.log10(spec[(f>=lo)&(f<hi)].sum()/tot+1e-12)+rms for _,lo,hi in bands]  # absolute band level (dBFS)
    cent = (spec*f).sum()/tot
    hot = np.mean(np.abs(x) > 0.89)*100
    return rms, peak, b, cent, hot
files = sorted(glob.glob(os.path.join(d, "*.wav")))
print(f"{'file':22s} {'seg':9s} {'rms':>6s} {'peak':>6s} " + " ".join(f"{n:>7s}" for n,_,_ in bands) + f" {'centr':>6s} {'>-1dB%':>6s}")
for p in files:
    x = load(p); name = os.path.basename(p)[:-4]
    for seg, a, b in segments:
        rms, peak, bb, cent, hot = row(x[int(a*48000):int(b*48000)])
        print(f"{name:22s} {seg:9s} {rms:6.1f} {peak:6.1f} " + " ".join(f"{v:7.1f}" for v in bb) + f" {cent:6.0f} {hot:6.2f}")
