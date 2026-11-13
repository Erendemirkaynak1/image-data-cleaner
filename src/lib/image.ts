import type {ImageFormat,ProcessOptions,ProcessedImage} from '../types';
import {sha256} from './hash';
import {detectImageFormat,verifyMetadataRemoved} from './metadata';

const extensions:Record<ImageFormat,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const MAX_FILE_BYTES=50*1024*1024;
const MAX_IMAGE_PIXELS=100_000_000;

function decodeImage(file:File):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file);
  const image=new Image();
  image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('The image could not be decoded.'))};
  image.src=url;
 });
}

function encode(canvas:HTMLCanvasElement,type:ImageFormat,quality:number):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image encoding failed.')),type,quality));
}

export async function validateImageFile(file:File):Promise<boolean>{
 if(file.size<=0||file.size>MAX_FILE_BYTES)return false;
 const header=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const detected=detectImageFormat(header);
 return detected!==null&&(!file.type||file.type===detected);
}

export async function processImage(file:File,options:ProcessOptions):Promise<ProcessedImage>{
 const header=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const actualType=detectImageFormat(header);
 if(!actualType||actualType!==file.type)throw new Error('The file signature does not match its declared image format.');
 if(file.size>MAX_FILE_BYTES)throw new Error('The image exceeds the 50 MB file limit.');
 const image=await decodeImage(file);
 try{
  const originalWidth=image.naturalWidth,originalHeight=image.naturalHeight;
  if(!originalWidth||!originalHeight||originalWidth*originalHeight>MAX_IMAGE_PIXELS)throw new Error('Image dimensions exceed the safe processing limit of 100 megapixels.');
  const maxWidth=options.maxWidth&&options.maxWidth>0?options.maxWidth:null;
  const maxHeight=options.maxHeight&&options.maxHeight>0?options.maxHeight:null;
  const scale=Math.min(maxWidth?maxWidth/originalWidth:1,maxHeight?maxHeight/originalHeight:1,1);
  const width=Math.max(1,Math.round(originalWidth*scale));
  const height=Math.max(1,Math.round(originalHeight*scale));
  const type=options.outputFormat==='original'?actualType:options.outputFormat;
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)throw new Error('Canvas is unavailable.');
  if(type==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(image,0,0,width,height);
  let output:Blob;
  try{output=await encode(canvas,type,Math.min(1,Math.max(.1,options.quality)));}
  finally{canvas.width=0;canvas.height=0;}
  if(output.type!==type)throw new Error('The browser returned an unexpected output format.');
  const verification=await verifyMetadataRemoved(output);
  const hash=await sha256(output);
  const name=file.name.replace(/\.[^.]+$/,'')||'image';
  return{
   id:crypto.randomUUID(),original:file,output,outputName:name+'-cleaned.'+extensions[type],
   width,height,originalWidth,originalHeight,originalSize:file.size,outputSize:output.size,
   hash,verificationPassed:verification.passed,
   removedItems:verification.passed?['EXIF','GPS coordinates','camera and device tags','XMP / IPTC','embedded comments']:[]
  };
 }finally{
  image.src='';
 }
}

export function isSupportedImage(file:File):boolean{
 return['image/jpeg','image/png','image/webp'].includes(file.type)&&file.size>0&&file.size<=MAX_FILE_BYTES;
}

export function formatBytes(bytes:number):string{
 if(bytes<1024)return bytes+' B';
 if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';
 return(bytes/1048576).toFixed(2)+' MB';
}

export function downloadBlob(blob:Blob,name:string):void{
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;anchor.click();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
