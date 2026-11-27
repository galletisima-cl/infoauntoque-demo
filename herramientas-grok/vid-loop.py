import subprocess, numpy as np, sys, json
SRC='/mnt/user-data/uploads/Downloads/'
def frames(f, fps=12, w=64, h=72):
    raw=subprocess.run(['ffmpeg','-v','error','-i',SRC+f,'-vf',f'fps={fps},scale={w}:{h},format=gray','-f','rawvideo','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,h,w).astype(float)
res={}
for n in ['1-bebe-i','2-bebe-ii','3-novato','4-novato-rebelde','5-campeon','6-definitivo']:
    F=frames(f'vm-{n}.mp4'); fps=12
    best=None
    for s in range(0, int(2*fps)):            # inicio en los primeros 2 s
        for e in range(s+int(3.5*fps), min(len(F), s+int(7*fps))):  # loop de 3,5 a 7 s
            d=np.abs(F[s]-F[e]).mean()
            if best is None or d<best[0]: best=(d,s/fps,e/fps)
    res[n]=best; print(n, 'dif %.2f  de %.2fs a %.2fs'%best)
json.dump(res,open('loops.json','w'))
