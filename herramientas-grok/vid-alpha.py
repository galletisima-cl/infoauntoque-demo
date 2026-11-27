"""Video "apilado": arriba el color, abajo la máscara (blanco = monster, negro = fondo).
El fondo se calcula por cuadro: píxeles casi blancos conectados con el borde (relleno por inundación)."""
import subprocess, numpy as np
from scipy import ndimage
N=['1-bebe-i','2-bebe-ii','3-novato','4-novato-rebelde','5-campeon','6-definitivo']
for n in N:
    src=f'out/vm-{n}.mp4'
    w,h=map(int,subprocess.run(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=width,height','-of','csv=p=0',src],capture_output=True,text=True).stdout.strip().split(','))
    raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    F=np.frombuffer(raw,np.uint8).reshape(-1,h,w,3)
    M=[]
    for fr in F:
        f=fr.astype(int); mn=f.min(2); mx=f.max(2)
        blanco=(mn>226)&(mx-mn<20)
        lab,_=ndimage.label(blanco)
        borde=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])); borde=borde[borde>0]
        a=(~np.isin(lab,borde))
        # mancha blanca del piso entre los pies (venía en la imagen original): fuera
        piso=np.zeros_like(blanco);piso[int(h*.8):]=True
        a&=~(blanco&piso)
        a=ndimage.binary_opening(a,iterations=1)
        core=ndimage.binary_erosion(a,iterations=1)
        m=ndimage.gaussian_filter(core.astype(float)*0.75+a*0.25,0.8)
        M.append((np.clip(m,0,1)*255).astype(np.uint8))
    U=np.max(np.stack(M),0)>40; ys,xs=np.where(U)
    y0=max(0,ys.min()-4);y1=min(h,ys.max()+3);x0=max(0,xs.min()-4);x1=min(w,xs.max()+5)
    if (y1-y0)%2:y1-=1
    if (x1-x0)%2:x1-=1
    F=F[:,y0:y1,x0:x1];M=[m[y0:y1,x0:x1] for m in M];h,w=y1-y0,x1-x0
    enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h*2}','-r','24','-i','-',
        '-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',f'out/vm-{n}-alfa.mp4'],stdin=subprocess.PIPE)
    for fr,m in zip(F,M):
        enc.stdin.write(np.concatenate([fr,np.repeat(m[...,None],3,2)],0).tobytes())
    enc.stdin.close(); enc.wait(); print(n,len(F),w,h)
