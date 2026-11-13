import * as exifr from 'exifr';
import type {ImageMetadata,ImageFormat} from '../types';

const decoder=new TextDecoder('latin1');
const readText=(bytes:Uint8Array)=>decoder.decode(bytes);
const hasBytes=(bytes:Uint8Array,signature:number[])=>signature.every((value,index)=>bytes[index]===value);

export function detectImageFormat(bytes:Uint8Array):ImageFormat|null{
 if(hasBytes(bytes,[0xff,0xd8,0xff]))return 'image/jpeg';
 if(hasBytes(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))return 'image/png';
 if(readText(bytes.subarray(0,4))==='RIFF'&&readText(bytes.subarray(8,12))==='WEBP')return 'image/webp';
 return null;
}

function jpegBlocks(bytes:Uint8Array):string[]{
 const found:string[]=[];
 if(!hasBytes(bytes,[0xff,0xd8]))return ['Invalid JPEG signature'];
 let offset=2;
 while(offset<bytes.length){
  if(bytes[offset]!==0xff)return ['Malformed JPEG marker sequence'];
  while(offset<bytes.length&&bytes[offset]===0xff)offset++;
  if(offset>=bytes.length)return ['Truncated JPEG marker'];
  const marker=bytes[offset++];
  if(marker===0xda||marker===0xd9)break;
  if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
  if(offset+2>bytes.length)return ['Truncated JPEG segment length'];
  const length=(bytes[offset]<<8)|bytes[offset+1];
  if(length<2||offset+length>bytes.length)return ['Invalid JPEG segment length'];
  const payload=bytes.subarray(offset+2,offset+length);
  const prefix=readText(payload.subarray(0,Math.min(payload.length,80)));
  if(marker===0xe1){
   if(prefix.startsWith('Exif\0\0'))found.push('EXIF (APP1)');
   else if(prefix.includes('http://ns.adobe.com/xap/'))found.push('XMP (APP1)');
   else found.push('APP1 metadata');
  }
  if(marker===0xed)found.push('IPTC / APP13');
  if(marker===0xfe)found.push('JPEG comment');
  offset+=length;
 }
 return [...new Set(found)];
}

function pngBlocks(bytes:Uint8Array):string[]{
 const found:string[]=[];
 if(!hasBytes(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))return ['Invalid PNG signature'];
 let offset=8,ended=false;
 while(offset+12<=bytes.length){
  const length=new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0);
  if(length>bytes.length-offset-12)return ['Invalid PNG chunk length'];
  const type=readText(bytes.subarray(offset+4,offset+8));
  if(['eXIf','tEXt','zTXt','iTXt','tIME'].includes(type))found.push(type+' chunk');
  offset+=12+length;
  if(type==='IEND'){ended=true;break;}
 }
 if(!ended)found.push('Missing or truncated PNG IEND chunk');
 return [...new Set(found)];
}

function webpBlocks(bytes:Uint8Array):string[]{
 const found:string[]=[];
 if(readText(bytes.subarray(0,4))!=='RIFF'||readText(bytes.subarray(8,12))!=='WEBP')return ['Invalid WEBP signature'];
 if(bytes.length<12)return ['Truncated WEBP header'];
 const declared=new DataView(bytes.buffer,bytes.byteOffset+4,4).getUint32(0,true)+8;
 if(declared>bytes.length)return ['Truncated WEBP container'];
 let offset=12;
 while(offset+8<=Math.min(declared,bytes.length)){
  const type=readText(bytes.subarray(offset,offset+4));
  const length=new DataView(bytes.buffer,bytes.byteOffset+offset+4,4).getUint32(0,true);
  if(length>declared-offset-8)return ['Invalid WEBP chunk length'];
  if(type==='EXIF')found.push('EXIF chunk');
  if(type==='XMP ')found.push('XMP chunk');
  offset+=8+length+(length%2);
 }
 if(offset!==declared&&offset!==declared-1)return ['Malformed WEBP chunk layout'];
 return [...new Set(found)];
}

export function detectMetadataBlocks(bytes:Uint8Array,type:string):string[]{
 if(type==='image/jpeg')return jpegBlocks(bytes);
 if(type==='image/png')return pngBlocks(bytes);
 if(type==='image/webp')return webpBlocks(bytes);
 return ['Unsupported image format'];
}

const privacyTags=['Make','Model','CameraSerialNumber','BodySerialNumber','LensModel','LensSerialNumber','SerialNumber','Software','DateTimeOriginal','CreateDate','ModifyDate','GPSLatitude','GPSLongitude','GPSAltitude','GPSDateStamp','GPSTimeStamp','Artist','Copyright','ImageDescription','UserComment','OwnerName','XPTitle','XPComment','XPAuthor','XPKeywords','XPSubject'];

async function parseMetadata(blob:Blob):Promise<Record<string,unknown>>{
 const parsed=await exifr.parse(blob,{gps:true,tiff:true,exif:true,xmp:true,iptc:true,icc:false});
 return parsed&&typeof parsed==='object'?parsed as Record<string,unknown>:{};
}

export async function inspectMetadata(file:File|Blob,width=0,height=0):Promise<ImageMetadata>{
 const bytes=new Uint8Array(await file.arrayBuffer());
 const type=file.type||detectImageFormat(bytes)||'unknown';
 const detectedBlocks=detectMetadataBlocks(bytes,type);
 const fields:ImageMetadata['fields']=[];
 if(type==='image/jpeg')try{
  const data=await parseMetadata(file);
  for(const key of privacyTags){
   const value=data[key];
   if(value!==undefined&&value!==null)fields.push({label:key,value:value instanceof Date?value.toISOString():String(value)});
  }
 }catch{
  detectedBlocks.push('Metadata parser could not inspect this file');
 }
 return{format:type.replace('image/','').toUpperCase(),width,height,fields,detectedBlocks,hasSensitiveMetadata:detectedBlocks.length>0||fields.length>0};
}

export async function verifyMetadataRemoved(blob:Blob):Promise<{passed:boolean;remaining:string[]}>{
 const bytes=new Uint8Array(await blob.arrayBuffer());
 const remaining=detectMetadataBlocks(bytes,blob.type);
 if(blob.type==='image/jpeg')try{
  const parsed=await parseMetadata(blob);
  if(privacyTags.some(key=>parsed[key]!==undefined&&parsed[key]!==null))remaining.push('Parsed privacy-related EXIF metadata');
 }catch{
  remaining.push('Metadata parser could not verify output');
 }
 return{passed:remaining.length===0,remaining:[...new Set(remaining)]};
}
