"""Corta cuadrículas de Grok en celdas, busca punto de loop, crossfade, chroma key (verde) o negro (efectos)."""
import subprocess, sys, numpy as np
from scipy import ndimage
def leer(src,fps,w,h,t0=0,t1=None):
    vf=f'fps={fps},scale={w}:{h}:flags=lanczos'
    a=['ffmpeg','-v','error','-ss',str(t0),'-i',src]+(['-t',str(t1-t0)] if t1 else [])+['-vf',vf,'-f','rawvideo','-pix_fmt','rgb24','-']
    r=subprocess.run(a,capture_output=True).stdout
    return np.frombuffer(r,np.uint8).reshape(-1,h,w,3)
def loop(S,fps,minL,maxL):
    best=None
    for s in range(0,int(1.5*fps)):
        for e in range(s+int(minL*fps),min(len(S),s+int(maxL*fps))):
            d=np.abs(S[s]-S[e]).mean()
            if best is None or d<best[0]:best=(d,s,e)
    return best
def enc(frames,out,fps,crf):
    h,w=frames[0].shape[:2]
    p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-',
      '-c:v','libx264','-preset','veryfast','-crf',str(crf),'-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE)
    for f in frames:p.stdin.write(np.ascontiguousarray(f).tobytes())
    p.stdin.close();p.wait()
def key(fr):
    fr=fr.astype(np.float32);R,G,B=fr[...,0],fr[...,1],fr[...,2]
    v=G-np.maximum(R,B);a=1-np.clip((v-35)/(120-35),0,1);a=ndimage.gaussian_filter(a,0.6)
    G2=np.minimum(G,np.maximum(R,B)*1.02+4);col=np.stack([R,G2,B],-1)
    return col,a
def proc(src,cols,rows,nombres,modo,altura,fps=24,minL=2.5,maxL=4.5,X=0.4,crf=30):
    W0,H0=map(int,subprocess.run(['ffprobe','-v','error','-show_entries','stream=width,height','-select_streams','v:0','-of','csv=p=0',src],capture_output=True,text=True).stdout.split(',')[:2])
    full=leer(src,fps,W0,H0).astype(np.float32)
    cw,ch=W0//cols,H0//rows
    for k,nom in enumerate(nombres):
        if not nom:continue
        c,r=k%cols,k//cols
        F=full[:,r*ch:(r+1)*ch,c*cw:(c+1)*cw]
        small=F[:,::8,::8].mean(3)
        d,s,e=loop(small,fps,minL,maxL);n=e-s;x=int(X*fps)
        # crossfade: el final se funde con el inicio
        seq=F[s+x:e].copy();L=len(seq)
        for i in range(x):
            t=(i+1)/(x+1);seq[L-x+i]=F[e-x+i]*(1-t)+F[s+i]*t
        if modo=='verde':
            C=[];A=[]
            for fr in seq:
                col,a=key(fr)
                # quitar islas que tocan el borde de la celda (restos de vecinos)
                lab,nl=ndimage.label(a>0.1)
                if nl>1:
                    sizes=ndimage.sum(a>0.1,lab,range(1,nl+1));keep=np.zeros(nl+1,bool)
                    big=sizes.max()
                    for j in range(nl):
                        sl=lab==j+1;ys,xs=np.where(sl)
                        borde=ys.min()==0 or xs.min()==0 or ys.max()==ch-1 or xs.max()==cw-1
                        keep[j+1]=sizes[j]>big*0.02 and not(borde and sizes[j]<big*0.5)
                    a=a*keep[lab]
                idx=ndimage.distance_transform_edt(a<0.03,return_distances=False,return_indices=True)
                C.append(np.clip(col[idx[0],idx[1]],0,255));A.append(np.clip(a,0,1))
            U=np.max(np.stack(A),0)>0.08;ys,xs=np.where(U)
            y0=max(0,ys.min()-3);y1=min(ch,ys.max()+3);x0=max(0,xs.min()-3);x1=min(cw,xs.max()+3)
            sc=altura/(y1-y0);ww=int((x1-x0)*sc)//2*2;hh=altura//2*2
            out=[]
            from PIL import Image
            for col,a in zip(C,A):
                ci=Image.fromarray(col[y0:y1,x0:x1].astype(np.uint8)).resize((ww,hh),Image.LANCZOS)
                ai=Image.fromarray((a[y0:y1,x0:x1]*255).astype(np.uint8)).resize((ww,hh),Image.LANCZOS)
                out.append(np.concatenate([np.array(ci),np.repeat(np.array(ai)[...,None],3,2)],0))
            enc(out,f'out/{nom}.mp4',fps,crf)
            Image.fromarray(out[0][:hh]).save(f'out/{nom}.png')
            print(nom,'loop',round(s/fps,2),round(e/fps,2),'d',round(d,2),ww,hh)
        else:
            from PIL import Image
            yy,xx=np.mgrid[0:ch,0:cw];r=np.hypot((xx-cw/2)/(cw/2),(yy-ch/2)/(ch/2));vig=np.clip((1-r)/0.25,0,1)[...,None]
            out=[np.array(Image.fromarray(np.clip((fr-18)*1.08*vig,0,255).astype(np.uint8)).resize((altura,altura),Image.LANCZOS)) for fr in seq]
            enc(out,f'out/{nom}.mp4',fps,crf);print(nom,'loop',round(s/fps,2),round(e/fps,2))
