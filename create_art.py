from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, math, random, os
root=os.path.join(os.path.dirname(__file__),'public','art')
os.makedirs(root,exist_ok=True)
W,H=900,1080
xx,yy=np.meshgrid(np.linspace(-1.1,1.1,W),np.linspace(-1.25,1.25,H))
styles=[
('01-acid','acid', (15,17,15),(216,255,55),(118,154,47),12),
('02-echo','echo', (25,24,29),(225,104,151),(248,212,171),31),
('03-static','static',(221,216,201),(23,30,33),(94,101,226),52),
('04-electric','electric',(35,30,131),(255,124,63),(255,221,197),72),
('05-bloom','bloom',(17,45,37),(135,218,178),(230,244,180),22),
('06-signal','signal',(24,18,32),(197,153,253),(238,234,220),69),
('07-fracture','fracture',(240,232,213),(222,54,50),(25,20,21),8),
('08-phantom','phantom',(15,22,35),(81,174,244),(213,246,248),91),
]
for ix,(name,mode,bg,fg,accent,seed) in enumerate(styles):
 rng=np.random.default_rng(seed)
 field=np.zeros((H,W),dtype=np.float32)
 if mode=='acid':
  r=np.sqrt((xx-.19*np.sin(yy*9))**2+(yy-.05)**2)
  field=.5+.5*np.cos(44*r + 5*np.sin(xx*13))*np.exp(-r*.65)
  field+=.24*np.sin(xx*83+yy*27)
 elif mode=='echo':
  radius=np.sqrt((xx-.12)**2+((yy+.1)*1.25)**2)
  field=.48+.4*np.cos(31*radius+3*np.sin(yy*8))+.18*np.sin(yy*80+xx*18)
 elif mode=='static':
  field=.5+.36*np.sin(yy*115+xx*23*np.sin(yy*4))+.15*np.cos(xx*15-yy*12)
 elif mode=='electric':
  r=np.sqrt((xx+.33*np.sin(yy*3))**2+(yy+.18)**2)
  field=.4+.4*np.sin(32*r +yy*5)+.2*np.sin(xx*18)
 elif mode=='bloom':
  field=.5+.35*np.sin(18*np.arctan2(yy,xx)+20*np.sqrt(xx*xx+yy*yy)) + .17*np.cos(xx*33-yy*6)
 elif mode=='signal':
  field=.5+.35*np.cos(60*(xx+.12*np.sin(yy*7))+.8*np.sin(yy*29))+.21*np.sin(yy*50)
 elif mode=='fracture':
  field=.5+.45*np.sign(np.sin((xx*.57+yy*.9)*17+4*np.sin(yy*6)))+.08*np.sin(yy*111)
 else:
  field=.5+.45*np.sin(26*np.sqrt(xx*xx+yy*yy)+20*np.arctan2(yy,xx)) + .13*np.cos(xx*50-yy*10)
 field=np.clip(field,0,1)
 if mode in ('acid','echo','electric','signal','phantom'):
  mask=np.clip(np.sin(3.2*xx-1.5*yy+.4*np.cos(yy*6))*1.1,0,1)
  field=field*.8+.2*mask
 a=np.array(bg,dtype=np.float32);b=np.array(fg,dtype=np.float32);c=np.array(accent,dtype=np.float32)
 f=field[...,None]
 arr=a[None,None,:]*(1-f)+b[None,None,:]*f
 energy=np.exp(-((xx+0.32*np.sin(yy*5))**2/.19+(yy-.07)**2/.78))
 arr=arr*(1-.21*energy[...,None])+c[None,None,:]*(.21*energy[...,None])
 grain=rng.normal(0,8,size=(H,W,1));arr=np.uint8(np.clip(arr+grain,0,255))
 im=Image.fromarray(arr,'RGB'); d=ImageDraw.Draw(im,'RGBA'); R=random.Random(seed)
 if mode in ('acid','bloom','electric','phantom'):
  for j in range(70):
   px=R.randint(-50,W+50); py=R.randint(-50,H+50);rad=R.randrange(3,24)
   if R.random()<.5:
    d.ellipse((px-rad,py-rad,px+rad,py+rad), fill=(*accent,R.randint(30,115)))
 if mode in ('static','fracture','signal'):
  for j in range(60):
   py=R.randint(0,H);sx=R.randint(0,W); ex=min(W,sx+R.randint(30,400));
   d.line((sx,py,ex,py+R.randint(-4,4)),fill=(*accent,R.randrange(35,160)),width=R.randint(1,6))
 # Abstract design gesture: sharply masked black shape, varying by composition
 if ix==0:
  d.arc((90,110,810,950),-52,241,fill=(3,12,8,200),width=26)
  d.arc((140,160,760,900),-52,241,fill=(*accent,210),width=4)
 if ix==1:
  for k in range(5): d.ellipse((140+k*33,240+k*42,690-k*42,800-k*36),outline=(24,14,29,155),width=8)
 if ix==2:
  d.polygon([(50,740),(450,80),(795,320),(470,1050)], fill=(15,14,25,65))
 if ix==3:
  d.polygon([(80,870),(480,40),(660,170),(250,1020)],fill=(255,225,180,95))
 if ix==4:
  d.arc((55,80,845,1000),-15,280,fill=(230,255,198,230),width=17)
 if ix==5:
  d.ellipse((150,180,800,830),outline=(248,240,239,175),width=3)
 if ix==6:
  d.polygon([(50,220),(600,40),(840,680),(270,990)],fill=(240,64,46,165))
 if ix==7:
  d.arc((20,160,900,1020),40,335,fill=(206,255,252,170),width=31)
 # border and tension line
 d.rectangle((23,23,W-23,H-23),outline=(*accent,155),width=2)
 d.line((42,H-69,260,H-69),fill=(*accent,185),width=3)
 im.save(os.path.join(root,name+'.webp'),quality=88,method=5)
 print(name)
