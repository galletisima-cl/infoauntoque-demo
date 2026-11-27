"""Quita el fondo blanco con "color unmixing": en el borde y en los brillos translúcidos (alas, aura)
se calcula cuánto blanco hay mezclado y se resta, así no quedan halos blancos ni bordes difusos.
Salida: video apilado (arriba color, abajo máscara) recortado al monster."""
import subprocess, numpy as np
from scipy import ndimage
N=['1-bebe-i','2-bebe-ii','3-novato','4-novato-rebelde','5-campeon','6-definitivo']
for n in N:
    src=f'out/vm-{n}.mp4'
    w,h=map(int,subprocess.run(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=width,height','-of','csv=p=0',src],capture_output=True,text=True).stdout.strip().split(','))
    raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    F=np.frombuffer(raw,np.uint8).reshape(-1,h,w,3).astype(np.float32)
    C=[];A=[]
    for fr in F:
        amin=(255-fr.min(2))/255.0                      # alfa mínimo para explicar el color sobre blanco
        # fondo = casi blanco y conectado con el borde (relleno por inundación); lo demás es monster sólido
        claro=amin<0.10
        lab,_=ndimage.label(claro)
        bord=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]));bord=bord[bord>0]
        solido=~np.isin(lab,bord)
        rows=np.where((amin>0.3).any(1))[0];yb=rows.max() if len(rows) else h
        piso=np.zeros_like(claro);piso[max(0,yb-int(h*.1)):]=True
        gris=((fr.max(2)-fr.min(2))<26)
        mancha=piso&((amin<0.16)|gris)
        solido&=~mancha   # mancha blanca del piso entre los pies (y su borde gris)
        solido=ndimage.binary_opening(solido,iterations=1)
        solido=ndimage.binary_erosion(solido,iterations=1)
        a=np.where(solido,1.0,np.clip((amin-0.05)/0.95,0,1))
        a=np.where(mancha&~solido,0,a)
        sat=fr.max(2)-fr.min(2);fondo_bajo=np.zeros_like(claro);rows=np.where((amin>0.3).any(1))[0];yb=rows.max() if len(rows) else h;fondo_bajo[max(0,yb-int(h*.045)):]=True
        a=np.where(fondo_bajo&(sat<45),0,a)   # últimas filas: solo lo claramente anaranjado (patas)
        # mancha blanca/gris del piso entre los pies: fuera
        a[int(h*.86):]*=np.clip((amin[int(h*.86):]-0.10)/0.2,0,1)*(1-0)+0
        a=np.clip(a,0,1)
        col=np.where(a[...,None]>0.02,(fr-255*(1-a[...,None]))/np.maximum(a[...,None],0.02),0)
        col=np.clip(np.where(solido[...,None],fr,col),0,255)
        # donde no hay monster, el color copia el píxel visible más cercano (evita manchas por compresión)
        idx=ndimage.distance_transform_edt(a<0.02,return_distances=False,return_indices=True)
        col=col[idx[0],idx[1]]
        C.append(col.astype(np.uint8));A.append((a*255).astype(np.uint8))
    U=np.max(np.stack(A),0)>12; ys,xs=np.where(U)
    y0=max(0,ys.min()-4);y1=min(h,ys.max()+3);x0=max(0,xs.min()-4);x1=min(w,xs.max()+5)
    if (y1-y0)%2:y1-=1
    if (x1-x0)%2:x1-=1
    hh,ww=y1-y0,x1-x0
    enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{ww}x{hh*2}','-r','24','-i','-',
        '-c:v','libx264','-preset','veryfast','-crf','25','-vf','scale=trunc(iw*0.8/2)*2:trunc(ih*0.8/4)*4:flags=lanczos','-pix_fmt','yuv420p','-movflags','+faststart',f'out/vm-{n}-alfa.mp4'],stdin=subprocess.PIPE)
    for c,a in zip(C,A):
        enc.stdin.write(np.concatenate([c[y0:y1,x0:x1],np.repeat(a[y0:y1,x0:x1,None],3,2)],0).tobytes())
    enc.stdin.close(); enc.wait(); print(n,len(C),ww,hh)
