import subprocess,numpy as np,sys
from PIL import Image
out=[]
for n in sys.argv[1:]:
    f=f'out/vm-{n}-alfa.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-ss','1.5','-i',f,'-frames:v','1','fr.png'])
    im=np.array(Image.open('fr.png').convert('RGB')).astype(float);h=im.shape[0]//2
    c,a=im[:h],im[h:,:,:1]/255
    bg=np.zeros_like(c);bg[...]=(170,40,90)
    out.append(Image.fromarray((c*a+bg*(1-a)).astype(np.uint8)))
W=sum(i.width for i in out);H=max(i.height for i in out)
o=Image.new('RGB',(W,H),(170,40,90));x=0
for i in out:o.paste(i,(x,H-i.height));x+=i.width
o.save('comp.png');print(o.size)
