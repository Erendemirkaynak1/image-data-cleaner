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
 if(!hasBytes(bytes,[0xff,0xd8,0xff]))return ['Invalid JPEG signature'];
 let offset=2,sawScan=false,sawEnd=false;
 while(offset<bytes.length){
  if(bytes[offset]!==0xff)return ['Malformed JPEG marker sequence'];
  const markerStart=offset;
  while(offset<bytes.length&&bytes[offset]===0xff)offset++;
  if(offset>=bytes.length)return ['Truncated JPEG marker'];
  const marker=bytes[offset++];
  if(marker===0xd9){sawEnd=true;break;}
  if(marker===0xda)sawScan=true;
  else if(marker===0xd8)return ['Unexpected nested JPEG start marker'];
  else if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
  else{
   if(offset+2>bytes.length)return ['Truncated JPEG segment length'];
   const length=(bytes[offset]<<8)|bytes[offset+1];
   if(length<2||offset+length>bytes.length)return ['Invalid JPEG segment length'];
   const payload=bytes.subarray(offset+2,offset+length);
   const prefix=readText(payload.subarray(0,Math.min(payload.length,80)));
   if(marker===0xe1){
    if(prefix.startsWith('Exif\\0\\0'))found.push('EXIF (APP1)');
    else if(prefix.includes('http://ns.adobe.com/xap/'))found.push('XMP (APP1)');
    else found.push('APP1 metadata');
   }
   if(marker===0xed)found.push('IPTC / APP13');
   if(marker===0xfe)found.push('JPEG comment');
   if(marker>=0xe2&&marker<=0xef&&marker!==0xed){
    const isIcc=marker===0xe2&&prefix.startsWith('ICC_PROFILE');
    const isAdobe=marker===0xee&&prefix.startsWith('Adobe');
    if(!isIcc&&!isAdobe)found.push('APP'+(marker-0xe0)+' metadata');
   }
   offset+=length;
  }
  if(marker===0xda){
   let nextMarker=false;
   while(offset<bytes.length){
    if(bytes[offset++]!==0xff)continue;
    const candidateStart=offset-1;
    while(offset<bytes.length&&bytes[offset]===0xff)offset++;
    if(offset>=bytes.length)break;
    const code=bytes[offset++];
    if(code===0x00||(code>=0xd0&&code<=0xd7))continue;
    if(code===0xd9){sawEnd=true;nextMarker=false;break;}
    offset=candidateStart;nextMarker=true;break;
   }
   if(sawEnd)break;
   if(!nextMarker)return ['JPEG scan is truncated or missing its end marker'];
  }
  if(offset<=markerStart)return ['Malformed JPEG structure'];
 }
 if(!sawScan||!sawEnd)return ['JPEG is incomplete or missing image scan/end marker'];
 return [...new Set(found)];
}
function pngBlocks(bytes:Uint8Array):string[]{
 const found:string[]=[];
 if(!hasBytes(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))return ['Invalid PNG signature'];
 let offset=8,ended=false,sawHeader=false,sawData=false,chunkIndex=0;
 while(offset+12<=bytes.length){
  const length=new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0);
  if(length>bytes.length-offset-12)return ['Invalid PNG chunk length'];
  const type=readText(bytes.subarray(offset+4,offset+8));
  if(!/^[A-Za-z]{4}$/.test(type))return ['Invalid PNG chunk type'];
  if(chunkIndex===0&&type!=='IHDR')return ['PNG IHDR must be the first chunk'];
  if(type==='IHDR'){if(sawHeader||length!==13)return ['Invalid PNG IHDR chunk'];sawHeader=true;}
  if(type==='IDAT')sawData=true;
  if(['eXIf','tEXt','zTXt','iTXt','tIME'].includes(type))found.push(type+' chunk');
  if(type==='IEND'){
   if(length!==0||!sawHeader||!sawData)return ['Invalid PNG end or missing image data'];
   ended=true;offset+=12;break;
  }
  offset+=12+length;chunkIndex++;
 }
 if(!ended)return ['Missing or truncated PNG IEND chunk'];
 if(offset!==bytes.length)return ['Unexpected data after PNG IEND'];
 return [...new Set(found)];
}
function webpBlocks(bytes:Uint8Array):string[]{
 const found:string[]=[];
 if(bytes.length<20||readText(bytes.subarray(0,4))!=='RIFF'||readText(bytes.subarray(8,12))!=='WEBP')return ['Invalid or truncated WEBP signature'];
 const declared=new DataView(bytes.buffer,bytes.byteOffset+4,4).getUint32(0,true)+8;
 if(declared!==bytes.length)return ['WEBP container size does not match file length'];
 let offset=12,sawImage=false,sawHeader=false;
 while(offset+8<=declared){
  const type=readText(bytes.subarray(offset,offset+4));
  const length=new DataView(bytes.buffer,bytes.byteOffset+offset+4,4).getUint32(0,true);
  if(length>declared-offset-8)return ['Invalid WEBP chunk length'];
  if(type==='VP8 '||type==='VP8L')sawImage=true;
  if(type==='VP8X'){if(length!==10||sawHeader)return ['Invalid WEBP extended header'];sawHeader=true;}
  if(type==='EXIF')found.push('EXIF chunk');
  if(type==='XMP ')found.push('XMP chunk');
  offset+=8+length+(length%2);
 }
 if(offset!==declared)return ['Malformed WEBP chunk layout'];
 if(!sawImage)return ['WEBP image payload is missing'];
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
 if(type==='image/jpeg'&&detectedBlocks.includes('EXIF (APP1)'))try{
  const data=await parseMetadata(file);
  for(const key of privacyTags){
   const value=data[key];
   if(value!==undefined&&value!==null)fields.push({label:key,value:value instanceof Date?value.toISOString():String(value)});
  }
 }catch{/* The EXIF segment is already reported by the structural scan. */}
 return{format:type.replace('image/','').toUpperCase(),width,height,fields,detectedBlocks,hasSensitiveMetadata:detectedBlocks.length>0||fields.length>0};
}

export async function verifyMetadataRemoved(blob:Blob):Promise<{passed:boolean;remaining:string[]}>{
 const bytes=new Uint8Array(await blob.arrayBuffer());
 const remaining=detectMetadataBlocks(bytes,blob.type);
 return{passed:remaining.length===0,remaining:[...new Set(remaining)]};
}
