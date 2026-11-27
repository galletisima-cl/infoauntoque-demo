from PIL import Image
import numpy as np
from scipy import ndimage
t=np.array(Image.open('top2.png'))
a=t[:,:,3];core=ndimage.binary_erosion(a>128,iterations=1);t[:,:,3]=np.where(core,a,(a*0.35).astype('uint8'))
def limpiar(arr,i):
  a=arr[:,:,3];R,G,B=[arr[:,:,k].astype(int) for k in range(3)]
  m=a>40;lab,n=ndimage.label(m,structure=np.ones((3,3)))
  sz=ndimage.sum(m,lab,range(1,n+1));keep=lab==1+int(np.argmax(sz))
  if i==6: keep|=np.isin(lab,[k+1 for k,s in enumerate(sz) if s>150])
  hole=ndimage.binary_fill_holes(keep)&~keep
  warm=(R-B>10)
  a=np.where(hole&warm,255,np.where(keep,a,0))
  # fondo neutro (gris/lavanda) que quedó semiopaco dentro de huecos: transparente
  neutro=(np.abs(R-B)<8)&(R>170)&(a<230)
  a=np.where(neutro,0,a)
  arr[:,:,3]=a;return arr
def save(arr,name,i):
  arr=limpiar(arr,i);ys,xs=np.where(arr[:,:,3]>20);arr=arr[ys.min():ys.max()+1,xs.min():xs.max()+1]
  Image.fromarray(arr,'RGBA').save(name)
for i,(x0,x1) in enumerate([(40,142),(178,288),(312,444),(450,590),(580,752)]):
  save(t[:,x0:x1].copy(),f'f{i+1}.png',i+1)
c=828;x0=c-130;x1=c+128;six=t[:,x0:x1].copy();cut=752-x0;mir=six[:,::-1].copy()
six[:,:cut]=0;six[:,:cut]=np.where(mir[:,:cut,3:4]>0,mir[:,:cut],six[:,:cut]);save(six,'f6.png',6)
ims=[Image.open(f'f{i}.png') for i in range(1,7)]
W=sum(i.width for i in ims)+70;H=max(i.height for i in ims)+20
bg=Image.new('RGBA',(W,H),(40,40,60,255));x=10
for im in ims:bg.alpha_composite(im,(x,H-10-im.height));x+=im.width+10
bg.save('chk.png')
