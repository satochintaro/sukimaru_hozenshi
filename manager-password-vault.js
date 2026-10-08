"use strict";
// Device-only convenience storage. This is not an OS password manager or an XSS boundary.
// Non-extractable key and authenticated ciphertext remain in IndexedDB, never in backups.
(() => {
 const DB='skimaru-manager-passwords-v1616',scope=new URL('.',location.href).pathname;
 let connection;
 function db(){
  if(!connection)connection=new Promise((resolve,reject)=>{
   if(!window.isSecureContext||!window.indexedDB||!window.crypto?.subtle){reject(Error('storage_unavailable'));return;}
   const open=indexedDB.open(DB,1);
   open.onupgradeneeded=()=>open.result.createObjectStore('vault');
   open.onsuccess=()=>{open.result.onversionchange=()=>{open.result.close();connection=null;};resolve(open.result);};
   open.onerror=()=>reject(open.error);open.onblocked=()=>reject(Error('storage_blocked'));
  }).catch(e=>{connection=null;throw e;});
  return connection;
 }
 async function read(id){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('vault','readonly'),r=t.objectStore('vault').get(id);t.oncomplete=()=>resolve(r.result);t.onerror=t.onabort=()=>reject(t.error||Error('storage_failed'));});}
 async function put(id,value){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('vault','readwrite');t.objectStore('vault').put(value,id);t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(t.error||Error('storage_failed'));});}
 async function remove(id){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('vault','readwrite');t.objectStore('vault').delete(id);t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(t.error||Error('storage_failed'));});}
 async function key(create){
  const id='key:'+scope,existing=await read(id);if(existing||!create)return existing;
  const candidate=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),d=await db();
  return new Promise((resolve,reject)=>{const t=d.transaction('vault','readwrite'),store=t.objectStore('vault'),r=store.get(id);let chosen;
   r.onsuccess=()=>{chosen=r.result||candidate;if(!r.result)store.put(chosen,id);};
   t.oncomplete=()=>resolve(chosen);t.onerror=t.onabort=()=>reject(t.error||Error('storage_failed'));
  });
 }
 const id=(identity,site)=>`password:${scope}:${identity}:${site}`;
 const context=(identity,site)=>new TextEncoder().encode(id(identity,site));
 window.SKIMARU_MANAGER_PASSWORDS={
  async save(identity,site,password){
   if(!identity||!site||!password)return false;
   const k=await key(true),iv=crypto.getRandomValues(new Uint8Array(12));
   const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:context(identity,site)},k,new TextEncoder().encode(password));
   await put(id(identity,site),{iv,data});return true;
  },
  async load(identity,site){
   if(!identity||!site)return '';
   const record=await read(id(identity,site));if(!record)return '';
   const k=await key(false);if(!k){await remove(id(identity,site));return '';}
   try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:context(identity,site)},k,record.data));}
   catch{await remove(id(identity,site));return '';}
  },
  forget:(identity,site)=>remove(id(identity,site)),
  async clear(identity){
   const d=await db(),prefix=`password:${scope}:${identity}:`;
   await new Promise((resolve,reject)=>{const t=d.transaction('vault','readwrite'),r=t.objectStore('vault').openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return;if(String(c.key).startsWith(prefix))c.delete();c.continue();};t.oncomplete=()=>resolve();t.onerror=t.onabort=()=>reject(t.error||Error('storage_failed'));});
  }
 };
})();
