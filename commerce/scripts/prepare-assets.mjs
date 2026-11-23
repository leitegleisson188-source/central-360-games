/**
 * Copia SOMENTE o site público para Cloudflare Workers Static Assets.
 * Nunca inclui worker.mjs, secrets, banco, migrações ou README.
 */
import {mkdir,copyFile,readdir,rm} from "node:fs/promises";
import {resolve,join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,"../../");
const out=resolve(here,"../public");
await rm(out,{recursive:true,force:true});
await mkdir(join(out,"assets"),{recursive:true});
await copyFile(join(root,"index.html"),join(out,"index.html"));
for(const file of await readdir(join(root,"assets"))){
 if(!/^[a-z0-9._-]+\.(?:js|css|svg|webp|png|jpg|jpeg)$/i.test(file))continue;
 await copyFile(join(root,"assets",file),join(out,"assets",file));
}
console.log("Site pronto para Cloudflare Workers em:",out);
