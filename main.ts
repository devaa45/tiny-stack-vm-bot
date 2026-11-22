import{mkdirSync,readdirSync,readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';
const K=new Uint8Array(256),M=new Uint8Array(256),Q=new Uint8Array(256),U=new Uint8Array(256);
const s=(o,i,p,u)=>{K[o]=1;M[o]=i;Q[o]=p;U[o]=u};
s(0,0,0,0);s(1,1,0,1);s(2,4,0,1);s(3,0,1,0);s(4,0,1,2);s(5,0,2,2);s(6,0,2,3);s(7,0,3,3);
for(let o=16;o<=22;o++)s(o,0,2,1);
s(23,0,1,1);
for(let o=24;o<=26;o++)s(o,0,2,1);
s(27,0,1,1);
for(let o=28;o<=30;o++)s(o,0,2,1);
for(let o=32;o<=34;o++)s(o,0,2,1);
for(let o=48;o<=50;o++)s(o,2,o===48?0:1,0);
s(51,2,0,0);s(52,0,0,0);s(64,0,1,1);s(65,0,2,0);
for(let o=80;o<=83;o++)s(o,0,o===82?0:1,o===82?1:0);
function r(p,g){
const n=p.length,D=new Int32Array(256),C=new Int32Array(64),Y=new Int32Array(256),o=new Uint8Array(65536);
let a=0,c=0,l=0,q=0,f=0,t=0;
const e=x=>[o.subarray(0,l),x];
for(;;){
if(t===1e6)return e(10);
if(f<0||f>=n)return e(9);
const v=p[f];
if(!K[v])return e(5);
const i=M[v];
if(f+i>=n)return e(9);
t++;
if(a<Q[v])return e(2);
if(a-Q[v]+U[v]>256)return e(3);
f+=1+i;
switch(v){
case 0:return e(0);
case 1:D[a++]=(p[f-1]<<24)>>24;break;
case 2:D[a++]=p[f-4]|p[f-3]<<8|p[f-2]<<16|p[f-1]<<24;break;
case 3:a--;break;
case 4:D[a]=D[a-1];a++;break;
case 5:{const z=D[a-1];D[a-1]=D[a-2];D[a-2]=z;break;}
case 6:D[a]=D[a-2];a++;break;
case 7:{const z=D[a-3];D[a-3]=D[a-2];D[a-2]=D[a-1];D[a-1]=z;break;}
case 23:D[a-1]=-D[a-1]|0;break;
case 27:D[a-1]=~D[a-1];break;
case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{
const b=D[a-1],y=D[a-2];
let w;
if(v===16)w=(y+b)|0;
else if(v===17)w=(y-b)|0;
else if(v===18)w=Math.imul(y,b);
else if(v===19){if(b===0)return e(4);w=y===-2147483648&&b===-1?y:(y/b)|0;}
else if(v===20){if(b===0)return e(4);w=b===-1?0:(y%b)|0;}
else if(v===21){if(b===0)return e(4);w=Math.floor((y>>>0)/(b>>>0))|0;}
else if(v===22){if(b===0)return e(4);w=(y>>>0)%(b>>>0)|0;}
else if(v===24)w=y&b;
else if(v===25)w=y|b;
else if(v===26)w=y^b;
else if(v===28)w=y<<(b&31);
else if(v===29)w=y>>(b&31);
else if(v===30)w=(y>>>(b&31))|0;
else if(v===32)w=y===b?1:0;
else if(v===33)w=y<b?1:0;
else w=(y>>>0)<(b>>>0)?1:0;
a-=2;D[a++]=w;break;}
case 48:case 49:case 50:{
const z=((p[f-2]|p[f-1]<<8)<<16)>>16;
if(v!==48){const y=D[--a];if((v===49)!==(y===0))break;}
f+=z;break;}
case 51:
if(c===64)return e(7);
C[c++]=f;f=p[f-2]|p[f-1]<<8;break;
case 52:
if(c===0)return e(8);
f=C[--c];break;
case 64:{
const y=D[a-1];
if(y<0||y>255)return e(6);
D[a-1]=Y[y];break;}
case 65:{
const y=D[a-1],w=D[a-2];
if(y<0||y>255)return e(6);
a-=2;Y[y]=w;break;}
case 80:{
const z=String(D[a-1]);
if(l+z.length>65536)return e(11);
a--;
for(let j=0;j<z.length;j++)o[l++]=z.charCodeAt(j);
break;}
case 81:
if(l+1>65536)return e(11);
o[l++]=D[--a]&255;break;
case 82:D[a++]=q<g.length?g[q++]:-1;break;
case 83:return e(D[--a]&255);
}}}
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const d of readdirSync(I).sort()){
const[z,y]=r(readFileSync(join(I,d,'program.bin')),readFileSync(join(I,d,'input.bin')));
mkdirSync(join(O,d),{recursive:true});
writeFileSync(join(O,d,'stdout.bin'),z);
writeFileSync(join(O,d,'exit.txt'),y+'\n');
}
