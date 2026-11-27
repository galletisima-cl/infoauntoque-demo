from motor import render
from criaturas import LINEAS
from PIL import Image
import sys
N=int(sys.argv[1]);est=sys.argv[2];K=int(sys.argv[3])
im=Image.new('RGB',(3*N*K+40,3*N*K+40),(40,36,60))
for r,(t,c,fs) in enumerate(LINEAS):
  for k,(n,niv,fn) in enumerate(fs):
    s=render(fn(),N,est).resize((N*K,N*K),Image.NEAREST);im.paste(s,(10+k*(N*K+10),10+r*(N*K+10)),s)
im.save(f'p_{est}.png')
