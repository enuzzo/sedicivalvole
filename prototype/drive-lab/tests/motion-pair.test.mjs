import test from 'node:test';
import { createMotionTelemetry } from '../src/motion/telemetry.js';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const endpoint=fileURLToPath(new URL('../public/api/motion-pair.php',import.meta.url));
function run(body){const dir=mkdtempSync(join(tmpdir(),'sv-motion-test-'));try{
 const script=`define('SEDICIVALVOLE_MOTION_PAIR_TEST',true); require $argv[1]; $dir=$argv[2]; $now=time(); function req($a){global $dir,$now;return motionPairRequest($a,$dir,$now);} ${body}`;
 const result=spawnSync('php',['-r',script,endpoint,dir],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}finally{rmSync(dir,{recursive:true,force:true});}}
const create=`[$s,$r]=req(['action'=>'create','sdp'=>"v=0\r\na=fixture-offer-only\r\n"]); $receiver=['id'=>$r['id'],'token'=>$r['token']]; $join=['id'=>$r['id'],'token'=>$r['join']];`;
test('pairing is single-use, separates receiver/phone authority and deletes signaling',()=>{
 const result=run(`${create}
 [$js,$j]=req(['action'=>'join']+$join);$phone=['id'=>$r['id'],'token'=>$j['token']];
 $again=req(['action'=>'join']+$join)[0];$badPoll=req(['action'=>'poll']+$phone)[0];$badAnswer=req(['action'=>'answer','sdp'=>"v=0 fixture answer data"]+$receiver)[0];
 $answer=req(['action'=>'answer','sdp'=>"v=0 fixture answer data"]+$phone)[0];$repeat=req(['action'=>'answer','sdp'=>"v=0 second answer data"]+$phone)[0];
 $poll=req(['action'=>'poll']+$receiver);$finish=req(['action'=>'finish']+$receiver)[0];$gone=req(['action'=>'poll']+$receiver)[0];
 echo json_encode([$s,$js,$again,$badPoll,$badAnswer,$answer,$repeat,$poll[1]['status'],$finish,$gone]);`);
 assert.deepEqual(result,[200,200,403,403,403,200,403,'answered',200,410]);
});
test('expiry, bounds and malformed capabilities fail closed',()=>{
 const result=run(`${create}
 $bad=req(['action'=>'poll','id'=>'../outside','token'=>$r['token']])[0];$wrong=req(['action'=>'poll','id'=>$r['id'],'token'=>str_repeat('a',64)])[0];
 $large=req(['action'=>'create','sdp'=>'v=0'.str_repeat('x',24576)])[0];$now+=180;$expired=req(['action'=>'poll']+$receiver)[0];echo json_encode([$bad,$wrong,$large,$expired]);`);
 assert.deepEqual(result,[403,403,400,410]);
});
test('storage is private, bearer capabilities are hashed and sessions are bounded',()=>{
 const result=run(`${create}
 $raw=file_get_contents($dir.'/session-'.$r['id'].'.json');$hashed=strpos($raw,$r['token'])===false && strpos($raw,$r['join'])===false;
 $mode=fileperms($dir.'/session-'.$r['id'].'.json') & 0777;
 for($i=1;$i<64;$i++)req(['action'=>'create','sdp'=>"v=0 fixture offer data"]);
 $full=req(['action'=>'create','sdp'=>"v=0 fixture offer data"])[0];echo json_encode([$hashed,$mode,$full]);`);
 assert.deepEqual(result,[true,0o600,429]);
});
test('motion aggregate report is accepted by the existing coordinate privacy validator',()=>{
 const diagnostic=fileURLToPath(new URL('../public/api/send-diagnostic.php',import.meta.url));
 const script=`define('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY',true); require $argv[1]; echo json_encode(containsForbiddenCoordinateKey(json_decode(stream_get_contents(STDIN),true)));`;
 const telemetry=createMotionTelemetry(()=>0);telemetry.update({state:'connected',tared:true});
 const result=spawnSync('php',['-r',script,diagnostic],{input:JSON.stringify({phoneMotion:telemetry.snapshot()}),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout),false);
});
test('public HTTP handler rejects other origins, methods, media types and oversized bodies',()=>{
 for(const [server,expected] of [
  [{REQUEST_METHOD:'GET'},405],
  [{REQUEST_METHOD:'POST',HTTP_ORIGIN:'https://other.example'},403],
  [{REQUEST_METHOD:'POST',HTTP_ORIGIN:'https://sedicivalvole.app',HTTP_SEC_FETCH_SITE:'cross-site'},403],
  [{REQUEST_METHOD:'POST',HTTP_ORIGIN:'https://sedicivalvole.app',CONTENT_TYPE:'text/plain'},415],
  [{REQUEST_METHOD:'POST',HTTP_ORIGIN:'https://sedicivalvole.app',CONTENT_TYPE:'application/json',CONTENT_LENGTH:32769},413],
 ]) {
  const script="$_SERVER=json_decode(stream_get_contents(STDIN),true);ob_start();require $argv[1];ob_end_clean();echo http_response_code();";
  const result=spawnSync('php',['-r',script,endpoint],{encoding:'utf8',input:JSON.stringify(server)});
  assert.equal(result.status,0,result.stderr);assert.equal(Number(result.stdout),expected);
 }
});
