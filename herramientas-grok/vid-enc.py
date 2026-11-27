import json, subprocess
L=json.load(open('loops.json')); X=0.4
for n,(d,s,e) in L.items():
    src=f'/mnt/user-data/uploads/Downloads/vm-{n}.mp4'; T=e-s
    pre=f"scale=-2:600:flags=lanczos,fps=24,format=yuv420p"
    fc=(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS,{pre},split[a][b];"
        f"[a]trim={X}:{T},setpts=PTS-STARTPTS[main];[b]trim=0:{X},setpts=PTS-STARTPTS[head];"
        f"[main][head]xfade=transition=fade:duration={X}:offset={T-2*X:.3f},format=yuv420p[v]")
    out=f'out/vm-{n}.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-filter_complex',fc,'-map','[v]','-an','-c:v','libx264','-preset','veryfast','-crf','10','-movflags','+faststart',out],check=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',out,'-frames:v','1','-q:v','4',f'out/vm-{n}.jpg'],check=True)
    print(n)
