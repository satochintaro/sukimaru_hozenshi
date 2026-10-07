"use strict";
const http=require("http");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const ROOT=__dirname;
const DATA_DIR=path.join(ROOT,"data");
const DATA_FILE=path.join(DATA_DIR,"submissions.json");
const PIN_FILE=path.join(ROOT,"manager-pin.txt");
const PORT=Number(process.env.PORT)||8787;
const HOST=process.env.HOST||"0.0.0.0";
const SESSION_MS=8*60*60*1000;
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon"};
const sessions=new Map();
const failed=new Map();
fs.mkdirSync(DATA_DIR,{recursive:true});if(!fs.existsSync(DATA_FILE))fs.writeFileSync(DATA_FILE,"[]\n","utf8");
function ensurePin(){
  let pin="";
  try{pin=fs.readFileSync(PIN_FILE,"utf8").trim();}catch(e){}
  if(!/^\d{4,10}$/.test(pin)){
    pin=String(crypto.randomInt(100000,1000000));
    fs.writeFileSync(PIN_FILE,pin+"\n",{encoding:"utf8",mode:0o600});
    console.log("初回用のマネージャーPINを生成しました。");
  }
  return pin;
}
const MANAGER_PIN=ensurePin();
function readRows(){try{const x=JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));return Array.isArray(x)?x:[];}catch(e){return[];}}
function writeRows(rows){const tmp=DATA_FILE+".tmp";fs.writeFileSync(tmp,JSON.stringify(rows,null,2)+"\n","utf8");fs.renameSync(tmp,DATA_FILE);}
function json(res,status,obj,headers={}){const body=JSON.stringify(obj);res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Content-Length":Buffer.byteLength(body),"Cache-Control":"no-store",...headers});res.end(body);}
function readBody(req){return new Promise((resolve,reject)=>{let data="";req.on("data",c=>{data+=c;if(data.length>2_000_000){reject(new Error("too large"));req.destroy();}});req.on("end",()=>resolve(data));req.on("error",reject);});}
function validSubmission(s){return s&&typeof s==="object"&&typeof s.name==="string"&&s.name.trim()&&Number.isFinite(Number(s.total))&&Number.isFinite(Number(s.correct))&&s.cats&&typeof s.cats==="object";}
function cookies(req){const out={};String(req.headers.cookie||"").split(";").forEach(v=>{const i=v.indexOf("=");if(i>0)out[v.slice(0,i).trim()]=decodeURIComponent(v.slice(i+1).trim());});return out;}
function cleanSessions(){const now=Date.now();for(const [k,v] of sessions)if(v<now)sessions.delete(k);}
function isManager(req){cleanSessions();const token=cookies(req).skimaru_manager;return !!(token&&sessions.get(token)>Date.now());}
function setSession(res){const token=crypto.randomBytes(24).toString("hex");sessions.set(token,Date.now()+SESSION_MS);return `skimaru_manager=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_MS/1000)}`;}
function clearSession(req){const token=cookies(req).skimaru_manager;if(token)sessions.delete(token);}
function ipOf(req){return String(req.socket.remoteAddress||"unknown");}
function canTry(req){const ip=ipOf(req),now=Date.now(),x=failed.get(ip)||{n:0,until:0};if(x.until>now)return false;if(x.until&&x.until<=now)failed.delete(ip);return true;}
function recordFail(req){const ip=ipOf(req),now=Date.now(),x=failed.get(ip)||{n:0,until:0};x.n++;if(x.n>=5){x.until=now+10*60*1000;x.n=0;}failed.set(ip,x);}
function safeStatic(req,res){let pathname;try{pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);}catch(e){res.writeHead(400);return res.end("Bad request");}if(pathname==="/")pathname="/index.html";const file=path.normalize(path.join(ROOT,pathname));if(!file.startsWith(ROOT)||file.startsWith(DATA_DIR+path.sep)||path.basename(file)==="server.js"||path.basename(file)==="manager-pin.txt"){res.writeHead(403);return res.end("Forbidden");}fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end("Not found");}res.writeHead(200,{"Content-Type":MIME[path.extname(file).toLowerCase()]||"application/octet-stream","Cache-Control":path.extname(file)===".html"?"no-cache":"public, max-age=300"});fs.createReadStream(file).pipe(res);});}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");
  if(url.pathname==="/api/manager/status"&&req.method==="GET")return json(res,200,{authenticated:isManager(req)});
  if(url.pathname==="/api/manager/login"&&req.method==="POST"){
    if(!canTry(req))return json(res,429,{error:"locked",message:"入力回数が多すぎます。10分後に再試行してください。"});
    try{const body=JSON.parse(await readBody(req)||"{}"),pin=String(body.pin||"").trim();if(pin!==MANAGER_PIN){recordFail(req);return json(res,401,{error:"invalid_pin"});}failed.delete(ipOf(req));return json(res,200,{ok:true},{"Set-Cookie":setSession(res)});}catch(e){return json(res,400,{error:"invalid_json"});}
  }
  if(url.pathname==="/api/manager/logout"&&req.method==="POST"){clearSession(req);return json(res,200,{ok:true},{"Set-Cookie":"skimaru_manager=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"});}
  if(url.pathname==="/api/submissions"&&req.method==="GET"){
    if(!isManager(req))return json(res,401,{error:"manager_auth_required"});
    return json(res,200,{submissions:readRows()});
  }
  if(url.pathname==="/api/submissions"&&req.method==="POST"){
    try{const raw=await readBody(req),body=JSON.parse(raw||"{}"),s=body.submission||body;if(!validSubmission(s))return json(res,400,{error:"invalid submission"});const now=new Date().toISOString();const row={...s,id:s.id||crypto.randomUUID(),name:s.name.trim(),sentAt:s.sentAt||now,receivedAt:now};let rows=readRows();rows=rows.filter(x=>x.id!==row.id);rows.push(row);if(rows.length>5000)rows=rows.slice(-5000);writeRows(rows);return json(res,201,{ok:true,submission:row});}catch(e){return json(res,400,{error:"invalid json"});}
  }
  if(url.pathname==="/api/submissions"&&req.method==="DELETE"){
    if(!isManager(req))return json(res,401,{error:"manager_auth_required"});
    writeRows([]);return json(res,200,{ok:true});
  }
  safeStatic(req,res);
});
server.on("error",err=>{
  if(err&&err.code==="EADDRINUSE") console.error(`エラー: ポート ${PORT} は既に使用されています。既に起動中の黒い画面がないか確認してください。`);
  else console.error("サーバー起動エラー:",err);
});
server.listen(PORT,HOST,()=>{
  console.log(`スキマル保全士 Ver 4.7.1 を起動しました: http://localhost:${PORT}`);
  console.log("同じ社内LANの端末からは、このPCのIPアドレスとポートを指定してアクセスしてください。");
  console.log("----------------------------------------");
  console.log(`マネージャーPIN: ${MANAGER_PIN}`);
  console.log(`PIN保存先: ${PIN_FILE}`);
  console.log("この黒い画面は利用中ずっと閉じないでください。");
  console.log("----------------------------------------");
});
