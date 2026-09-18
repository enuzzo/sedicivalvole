import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Explicit localhost QA only; production PHP retains its canonical-origin gate.
export function motionQaServer() {
  return { name:'sedicivalvole-motion-local-qa', apply:'serve', configureServer(server) {
    if(process.env.SEDICIVALVOLE_MOTION_QA !== '1') return;
    const directory=mkdtempSync(join(tmpdir(),'sv-motion-qa-'));
    server.httpServer?.once('close',()=>rmSync(directory,{recursive:true,force:true}));
    server.middlewares.use('/api/motion-pair.php',(request,response)=>{
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress)) {response.writeHead(403);response.end();return;}
      if(request.method!=='POST'){response.writeHead(405);response.end();return;}
      let body='';request.on('data',chunk=>{body+=chunk;if(body.length>32768)request.destroy();});
      request.on('end',()=>{
        const script="define('SEDICIVALVOLE_MOTION_PAIR_TEST',true); require $argv[1]; $input=json_decode(stream_get_contents(STDIN),true); echo json_encode(motionPairRequest(is_array($input)?$input:[], $argv[2],time()));";
        const child=spawn('php',['-r',script,fileURLToPath(new URL('../public/api/motion-pair.php',import.meta.url)),directory],{stdio:['pipe','pipe','ignore'],timeout:10000});
        let result='';child.stdout.on('data',chunk=>{result+=chunk;if(result.length>65536)child.kill();});
        const fail=()=>{if(!response.writableEnded){response.writeHead(503);response.end('{}');}};
        child.once('error',fail);child.once('close',code=>{if(code!==0){fail();return;}try{const [status,payload]=JSON.parse(result);response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(payload));}catch{fail();}});
        child.stdin.end(body);
      });
    });
  }};
}
