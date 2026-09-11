import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createSessionReportSnapshot } from '../src/reports/session-report-model.js';
import { createSessionStats, observeSessionStats } from '../src/environments/atlas/session-stats.js';

const root = new URL('../public/report-support/', import.meta.url);
const library = fileURLToPath(new URL('delivery.php', root));
const digest = data => createHash('sha256').update(data).digest('hex');
function fixture(includeRoute = false) {
  return { schema:'sedicivalvole.session-report.v1', createdAt:'2026-09-07T20:00:00.000Z', app:{version:'0.0.0',build:'20260907-2004',commit:'b27975d'}, source:'GPS', includeRoute,
    summary:{elapsedMs:600000,observedMs:580000,movingMs:500000,stoppedMs:80000,unknownMs:20000,distanceM:6200,averageKmh:38.48,movingAverageKmh:44.64,peakKmh:87,stops:3,elevationGainM:12,elevationLossM:8,elevationObservedMs:500000},
    speedBandsMs:[100000,260000,220000,0,0],headingMs:[100000,80000,140000,40000,30000,50000,40000,20000],
    samples:Array.from({length:60},(_,i)=>({t:i*10,speedKmh:Math.max(0,50+30*Math.sin(i/5)),altitudeM:120+8*Math.sin(i/11),gap:i===29})),
    route:includeRoute?[{latitude:45.464,longitude:9.19},{latitude:45.466,longitude:9.193},{latitude:45.47,longitude:9.2},{latitude:45.473,longitude:9.196}]:[],
    system:{audio:'running',averageFps:54,p95FrameMs:28,longTaskCount:4,downloadBytes:24000000,uploadBytes:1500,engineRpm:4200,engineGear:3,engineLoad:0.54} };
}
function php(source, input = {}) {
  const result=spawnSync('php',['-r', `require ${JSON.stringify(library)}; $input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR); ${source}`],{input:JSON.stringify(input),encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stderr,'');
  return result.stdout;
}
function pdfStreams(pdf) {
  return [...pdf.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].flatMap(([,bytes])=>{
    try{return [inflateSync(Buffer.from(bytes,'latin1')).toString('latin1')];}catch{return [];}
  });
}

test('FPDF source and font metrics retain their exact admitted bytes', async()=>{
  const inventory=JSON.parse(await readFile(new URL('fpdf/source-inventory.json',root),'utf8'));
  for(const file of inventory.files){const bytes=await readFile(new URL(`fpdf/${file.path}`,root));assert.equal(bytes.length,file.bytes);assert.equal(digest(bytes),file.sha256);}
  assert.equal(inventory.version,'1.9');
});

test('real PHP builds deterministic PDFs and matches the exact email attachment',async()=>{
  const result=JSON.parse(php(`$snapshot=reportNormalize($input); $pdf=reportBuildPdf($snapshot); $mail=reportBuildMail($pdf,$snapshot,'reports@example.test'); echo json_encode(['pdf'=>base64_encode($pdf),'mail'=>$mail]);`,fixture()));
  const pdf=Buffer.from(result.pdf,'base64');
  assert.match(pdf.toString('latin1'),/^%PDF-1\./);assert.ok(pdf.length<200000);
  assert.doesNotMatch(pdf.toString('latin1'),/\/(?:JavaScript|OpenAction|EmbeddedFile|URI)\b/);
  assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,3);
  const again=Buffer.from(php(`date_default_timezone_set('America/Los_Angeles'); echo base64_encode(reportBuildPdf(reportNormalize($input)));`,fixture()),'base64');
  assert.equal(digest(again),digest(pdf));
  const attachment=result.mail.message.split('Content-Disposition: attachment;')[1].split('\r\n\r\n')[1].split('\r\n--')[0];
  assert.equal(digest(Buffer.from(attachment,'base64')),digest(pdf));
  assert.match(result.mail.headers,/From: sedicivalvole <diagnostics@sedicivalvole.app>/);
  assert.doesNotMatch(result.mail.headers,/Reply-To:|Cc:|Bcc:/);
  await writeFile('/tmp/sv-travel-report.pdf',pdf);
  await writeFile('/tmp/sv-session-report-request.json',JSON.stringify({action:'preview',snapshot:fixture()}));
});

test('an explicit route adds one bounded plate; an empty session remains exportable',async()=>{
  const route=Buffer.from(php(`echo base64_encode(reportBuildPdf(reportNormalize($input)));`,fixture(true)),'base64');
  assert.equal((route.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,4);
  const streams=[...route.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].flatMap(([,bytes])=>{
    try{return [inflateSync(Buffer.from(bytes,'latin1')).toString('latin1')];}catch{return [];}
  });
  const appendix=streams.filter(text=>text.includes('(Session details)'));
  assert.equal(appendix.length,1);
  for(const label of ['Moving / stopped','Unobserved time','Stops','Engine simulated load','Technical appendix.']) assert.ok(appendix[0].includes(label),label);
  const routePlate=streams.find(text=>text.includes('(Route included by request)'));
  assert.ok(routePlate);assert.ok(!routePlate.includes('Session details'));assert.ok(!routePlate.includes('Moving / stopped'));
  await writeFile('/tmp/sv-travel-report-route.pdf',route);
  const empty=fixture(); for(const key of Object.keys(empty.summary)) empty.summary[key]=key.includes('Kmh')?null:0;
  empty.samples=[];empty.headingMs=Array(8).fill(0);empty.speedBandsMs=Array(5).fill(0);
  for(const key of Object.keys(empty.system)) empty.system[key]=key==='audio'?'unavailable':null;
  assert.match(php(`echo reportBuildPdf(reportNormalize($input));`,empty),/^%PDF-1\./);
});

test('optional terrain evidence preserves legacy snapshots, prefers GPS, and rejects coordinates or unbounded heights',()=>{
  const legacy=JSON.parse(php(`echo json_encode(reportNormalize($input));`,fixture()));
  assert.ok(legacy.samples.every(sample=>sample.groundElevationM===null));
  const dual=fixture();dual.samples[0].groundElevationM=777;
  const preferred=JSON.parse(php(`echo json_encode(reportNormalize($input));`,dual));
  assert.equal(preferred.samples[0].altitudeM,dual.samples[0].altitudeM);
  assert.equal(preferred.samples[0].groundElevationM,null);
  const cases=[];
  for(const change of [s=>s.samples[0].groundElevationM=-501,s=>s.samples[0].groundElevationM=10001,s=>s.samples[0].groundElevationM='123',s=>s.samples[0].latitude=45,s=>s.samples[0].longitude=9,s=>s.samples[0].elevationSourceUrl='https://example.test/']){
    const snapshot=fixture();snapshot.samples[0].altitudeM=null;change(snapshot);cases.push(snapshot);
  }
  const rejected=JSON.parse(php(`$out=[];foreach($input as $row){try{reportNormalize($row);$out[]='accepted';}catch(SessionReportProblem $e){$out[]=$e->getMessage();}}echo json_encode($out);`,cases));
  assert.ok(rejected.every(value=>value!=='accepted'));
  assert.equal(php(`$input['samples'][0]['groundElevationM']=INF;try{reportNormalize($input);echo 'accepted';}catch(SessionReportProblem $e){echo $e->getMessage();}`,fixture()),'value_rejected');
});

test('PDF altitude paths break at source changes and gaps, while dense map paths retain a continuous dash pattern',()=>{
  const samples=Array.from({length:9},(_,i)=>({t:i,speedKmh:30,altitudeM:[0,1,7,8].includes(i)?120+i:null,groundElevationM:[2,3,5,6].includes(i)?120+i:null,gap:i===4}));
  const buildTrace=rows=>Buffer.from(php(`$pdf=new TravelReportPdf(1788811200);$pdf->AddPage();reportTrace($pdf,$input,'altitudeM',16,50,178,48,[46,102,139],false);echo base64_encode($pdf->Output('S'));`,rows),'base64');
  const content=pdfStreams(buildTrace(samples)).join('\n');
  const segments=[...content.matchAll(/(\[[\d. ]*\] 0 d)\n([\d. ]+m(?: [\d. ]+l)+ S)\n\[\] 0 d/g)];
  assert.equal(segments.length,4);
  assert.deepEqual(segments.map(([,dash])=>dash!=='[] 0 d'),[false,true,true,false]);
  assert.ok(segments.every(([, ,path])=>(path.match(/ l/g)||[]).length===1));
  const dense=Array.from({length:720},(_,i)=>({t:i,speedKmh:30,altitudeM:null,groundElevationM:120+i/10,gap:false}));
  const dashed=[...pdfStreams(buildTrace(dense)).join('\n').matchAll(/\[[\d. ]+\] 0 d\n([\d. ]+m(?: [\d. ]+l)+ S)\n\[\] 0 d/g)];
  assert.equal(dashed.length,1);
  assert.equal((dashed[0][1].match(/ l/g)||[]).length,719);
});

test('map fallback PDFs retain A4 page counts, distinct source labels and only the fixed elevation attribution link',async()=>{
  for(const includeRoute of [false,true]){
    const snapshot=fixture(includeRoute);
    snapshot.samples=snapshot.samples.map((sample,i)=>i>=18&&i<38||i>=50?{...sample,altitudeM:null,groundElevationM:150+18*Math.sin(i/11)}:sample);
    const pdf=Buffer.from(php(`echo base64_encode(reportBuildPdf(reportNormalize($input)));`,snapshot),'base64');
    const raw=pdf.toString('latin1'),text=pdfStreams(pdf).join('\n');
    assert.equal((raw.match(/\/Type \/Page\b/g)||[]).length,includeRoute?4:3);
    assert.match(raw,/\/MediaBox \[0 0 595\.28 841\.89\]/);
    assert.deepEqual([...raw.matchAll(/\/URI \(([^)]*)\)/g)].map(([,uri])=>uri),['https://open-meteo.com/en/docs/elevation-api']);
    for(const label of ['GPS altitude','map elevation estimate','GPS elevation gain / loss','Open-Meteo / EU Copernicus GLO-90','CC BY 4.0','90 m DEM']) assert.ok(text.includes(label),label);
    assert.match(text,/GPS altitude \\\(solid\\\)/);
    assert.match(text,/map elevation estimate \\\(dashed\\\)/);
    assert.doesNotMatch(raw,/\/(?:JavaScript|OpenAction|EmbeddedFile)\b/);
    await writeFile(`/tmp/sv-travel-report-map${includeRoute?'-route':''}.pdf`,pdf);
  }
});

test('JavaScript terrain-only snapshots remain coordinate-free and never fabricate GPS elevation gain or loss',async()=>{
  const observations=Array.from({length:8},(_,i)=>({capturedAtMs:i*1000,speedKmh:36,accuracyM:3,heading:90,altitudeM:null,altitudeAccuracyM:null,groundElevationM:120+i*60}));
  const snapshot=createSessionReportSnapshot({journey:{totals:observations.reduce(observeSessionStats,createSessionStats()),sessionSamples:observations,travelPoints:[{latitude:45.464,longitude:9.19}]},system:{},app:fixture().app,nowMs:8000,createdAt:fixture().createdAt});
  assert.deepEqual(snapshot.samples.map(sample=>sample.groundElevationM),observations.map(sample=>sample.groundElevationM));
  assert.ok(snapshot.samples.every(sample=>sample.altitudeM===null));
  assert.equal(snapshot.summary.elevationGainM,0);assert.equal(snapshot.summary.elevationLossM,0);assert.equal(snapshot.summary.elevationObservedMs,0);
  assert.doesNotMatch(JSON.stringify(snapshot),/latitude|longitude/);
  const output=JSON.parse(php(`$s=reportNormalize($input);echo json_encode(['snapshot'=>$s,'pdf'=>base64_encode(reportBuildPdf($s))]);`,snapshot));
  assert.deepEqual(output.snapshot,snapshot);
  const pdf=Buffer.from(output.pdf,'base64'),text=pdfStreams(pdf).join('\n');
  assert.match(text,/Map elevation estimate/);
  assert.doesNotMatch(text,/\(GPS altitude \d/);
  assert.match(text,/GPS elevation gain \/ loss[\s\S]*?Unavailable/);
  await writeFile('/tmp/sv-travel-report-map-only.pdf',pdf);
});

test('the actual JavaScript immutable snapshot passes PHP validation and renders both route choices',()=>{
  const observations=[0,1000.25,2000.5,3000.75].map((capturedAtMs,i)=>({capturedAtMs,speedKmh:36+i,accuracyM:3,heading:90,altitudeM:120+i,altitudeAccuracyM:3}));
  const input={journey:{totals:observations.reduce(observeSessionStats,createSessionStats()),sessionSamples:observations,travelPoints:[{latitude:45.464,longitude:9.19},{latitude:45.466,longitude:9.193}]},
    system:{audio:'running',frame:{averageFps:29.5,p95FrameMs:35.4},network:{observedDownloadBytes:2345,observedUploadBytes:45},longTasks:{supported:true,count:0,maximumDurationMs:null},engine:{active:true,status:'ready',rpm:2500.5,gear:2,load:0.5}},
    app:{version:'0.0.0',build:'20260907-2004',commit:'b27975d'},nowMs:4500.25,createdAt:'2026-09-07T20:00:00.000Z'};
  for(const includeRoute of [false,true]){
    const snapshot=createSessionReportSnapshot({...input,includeRoute});
    const output=JSON.parse(php(`$normalized=reportNormalize($input);$pdf=reportBuildPdf($normalized);echo json_encode(['snapshot'=>$normalized,'pdf'=>base64_encode($pdf)]);`,snapshot));
    assert.deepEqual(output.snapshot,snapshot);
    const text=Buffer.from(output.pdf,'base64').toString('latin1');
    assert.equal((text.match(/\/Type \/Page\b/g)||[]).length,includeRoute?4:3);
    assert.match(text,/\/MediaBox \[0 0 595\.28 841\.89\]/);
  }
  const polar=createSessionReportSnapshot({...input,includeRoute:true,journey:{...input.journey,travelPoints:[{latitude:90,longitude:179},{latitude:89.9,longitude:-179}]}});
  assert.match(php(`echo reportBuildPdf(reportNormalize($input));`,polar),/^%PDF-1\./);
  const empty=createSessionReportSnapshot({...input,journey:{totals:createSessionStats()},system:{}});
  assert.match(php(`echo reportBuildPdf(reportNormalize($input));`,empty),/^%PDF-1\./);
});

test('fixed report schema rejects arbitrary markup, mismatched route consent and invalid numeric evidence',()=>{
  const cases=[];
  for(const change of [s=>s.html='<h1>Untrusted</h1>',s=>s.pdf='JVBERi0=',s=>s.app.build='bad\r\nBcc:other@example.test',s=>s.summary.distanceM=-1,s=>s.speedBandsMs.push(1),s=>s.samples[1].t=-1,s=>s.system.audio='arbitrary message',s=>s.route=[{latitude:45,longitude:9}],s=>s.samples[0].url='https://example.test/private',s=>s.summary.observedMs=700000,s=>s.route=[{latitude:91,longitude:0}]]){const s=fixture();change(s);cases.push(s);}
  const results=JSON.parse(php(`$out=[];foreach($input as $row){try{reportNormalize($row);$out[]='accepted';}catch(SessionReportProblem $e){$out[]=$e->getMessage();}}echo json_encode($out);`,cases));
  assert.ok(results.every(value=>value!=='accepted'));
});

const setup = `$dir=sys_get_temp_dir().'/sv-report-test-'.bin2hex(random_bytes(10)); $messages=[]; $mail=function($to,$subject,$message,$headers)use(&$messages){$messages[]=compact('to','subject','message','headers');return true;}; $session=[]; $now=1788811200; $service=new SessionReportDelivery($dir,'test-ip','test-session',$now,$mail); $recipient='reports@example.test';`;
const cleanup = `foreach(glob($dir.'/*') as $file)unlink($file);rmdir($dir);`;

test('verification status restores only current unexpired session proof without any mail or rate charge',()=>{
  const result=JSON.parse(php(`${setup}
    $fresh=$service->verificationStatus($session);$session['report_challenge']=['recipient'=>$recipient,'expires'=>$now+900];$challenge=$service->verificationStatus($session);
    $session['report_verified']=['recipient'=>'Case.Sensitive@EXAMPLE.TEST','expires'=>$now+28800];$verified=$service->verificationStatus($session);
    $otherSession=[];$isolated=$service->verificationStatus($otherSession);
    $later=new SessionReportDelivery($dir,'test-ip','test-session',$now+28800,$mail);$expired=$later->verificationStatus($session);$cleared=!isset($session['report_verified']);
    $session['report_verified']=['recipient'=>"bad\\r\\nBcc:other@example.test",'expires'=>$now+30000];$invalid=$service->verificationStatus($session);
    echo json_encode(compact('fresh','challenge','verified','isolated','expired','cleared','invalid')+['mails'=>count($messages),'ledgerExists'=>file_exists($dir.'/ledger.json')]);${cleanup}`));
  const unverified={ok:true,status:'verification_status',recipient:null,expiresInSeconds:0};
  for(const key of ['fresh','challenge','isolated','expired','invalid']) assert.deepEqual(result[key],unverified);
  assert.deepEqual(result.verified,{ok:true,status:'verification_status',recipient:'Case.Sensitive@example.test',expiresInSeconds:28800});
  assert.equal(result.cleared,true);assert.equal(result.mails,0);assert.equal(result.ledgerExists,false);
});

test('verification and repeated idempotent send invoke only the fake mailer once per purpose',()=>{
  const result=JSON.parse(php(`${setup}
    $service->requestCode($recipient,$session);preg_match('/code is: (\\d{6})/',$messages[0]['message'],$found);
    $verified=$service->verifyCode($found[1],$session);$snapshot=reportNormalize($input);$hash=hash('sha256',reportBuildPdf($snapshot));
    $first=$service->send($recipient,$snapshot,'sample-request-123456',$hash,$session);
    $second=$service->send($recipient,$snapshot,'sample-request-123456',$hash,$session);
    $ledger=file_get_contents($dir.'/ledger.json');echo json_encode(['verified'=>$verified,'first'=>$first,'second'=>$second,'mails'=>count($messages),'ledger'=>$ledger]);${cleanup}`,fixture()));
  assert.equal(result.verified.status,'recipient_verified');assert.equal(result.first.replayed,false);assert.equal(result.second.replayed,true);assert.equal(result.mails,2);
  assert.doesNotMatch(result.ledger,/reports@example|latitude|longitude|speedKmh|%PDF|code is/);
});

test('verification expires, caps guesses, rejects changed recipients and binds the preview digest',()=>{
  const result=JSON.parse(php(`${setup}
    $service->requestCode($recipient,$session);$out=[];
    for($i=0;$i<6;$i++){try{$service->verifyCode('bad',$session);$out[]='accepted';}catch(SessionReportProblem $e){$out[]=$e->getMessage();}}
    $late=new SessionReportDelivery($dir,'test-ip','test-session',$now+901,$mail);try{$late->verifyCode('123456',$session);}catch(SessionReportProblem $e){$out[]=$e->getMessage();}
    $snapshot=reportNormalize($input);$hash=hash('sha256',reportBuildPdf($snapshot));$session['report_verified']=['recipient'=>$recipient,'expires'=>$now+1000];
    try{$service->send('other@example.test',$snapshot,'sample-request-123456',$hash,$session);}catch(SessionReportProblem $e){$out[]=$e->getMessage();}
    try{$service->send($recipient,$snapshot,'sample-request-123456',str_repeat('0',64),$session);}catch(SessionReportProblem $e){$out[]=$e->getMessage();}
    echo json_encode(['out'=>$out,'mails'=>count($messages)]);${cleanup}`,fixture()));
  assert.deepEqual(result.out.slice(0,5),Array(5).fill('verification_rejected'));assert.equal(result.out[5],'verification_locked');assert.equal(result.out[6],'verification_expired');assert.equal(result.out[7],'recipient_verification_required');assert.equal(result.out[8],'preview_changed');assert.equal(result.mails,1);
});

test('mail uncertainty never resends and definite failure retries with the same key only after cooldown',()=>{
  const result=JSON.parse(php(`${setup}
    $snapshot=reportNormalize($input);$hash=hash('sha256',reportBuildPdf($snapshot));$session['report_verified']=['recipient'=>$recipient,'expires'=>$now+10000];
    $calls=0;$uncertain=new SessionReportDelivery($dir,'test-ip','test-session',$now,function()use(&$calls){$calls++;throw new RuntimeException('simulated_transport_crash');});
    $out=[];for($i=0;$i<2;$i++){try{$uncertain->send($recipient,$snapshot,'uncertain-request-1234',$hash,$session);}catch(Throwable $e){$out[]=$e->getMessage();}}
    $failed=new SessionReportDelivery($dir,'test-ip','test-session',$now,function()use(&$calls){$calls++;return false;});
    try{$failed->send($recipient,$snapshot,'definite-request-12345',$hash,$session);}catch(SessionReportProblem $e){$out[]=$e->getMessage();}
    try{$failed->send($recipient,$snapshot,'definite-request-12345',$hash,$session);}catch(SessionReportProblem $e){$out[]=$e->getMessage();}
    $recovered=new SessionReportDelivery($dir,'test-ip','test-session',$now+31,$mail);$last=$recovered->send($recipient,$snapshot,'definite-request-12345',$hash,$session);
    echo json_encode(['out'=>$out,'calls'=>$calls,'recovered'=>$last,'mails'=>count($messages)]);${cleanup}`,fixture()));
  assert.deepEqual(result.out,['simulated_transport_crash','delivery_unknown','mail_transport_rejected','retry_later']);assert.equal(result.calls,2);assert.equal(result.recovered.ok,true);assert.equal(result.mails,1);
});

test('verification requests are bounded per recipient with no header-controlled sender',()=>{
  const result=JSON.parse(php(`${setup}
    $out=[];for($i=0;$i<3;$i++){$session=[];$service=new SessionReportDelivery($dir,'ip-'.$i,'session-'.$i,$now+$i*70,$mail);try{$service->requestCode($recipient,$session);$out[]='accepted';}catch(SessionReportProblem $e){$out[]=$e->getMessage();}}
    foreach(["bad\\r\\nBcc: attacker@example.test",'a@example.test,b@example.test'] as $bad){try{reportRecipient($bad);$out[]='accepted';}catch(SessionReportProblem $e){$out[]=$e->getMessage();}}
    echo json_encode(['out'=>$out,'mails'=>count($messages)]);${cleanup}`));
  assert.deepEqual(result.out,['accepted','accepted','rate_limited','recipient_rejected','recipient_rejected']);assert.equal(result.mails,2);
});

test('IP and aggregate limits survive fresh sessions and different recipient addresses',()=>{
  const result=JSON.parse(php(`${setup}
    $ipResult='';for($i=0;$i<9;$i++){$session=[];$service=new SessionReportDelivery($dir,'shared-ip','session-'.$i,$now+$i*70,$mail);try{$service->requestCode('person-'.$i.'@example.test',$session);}catch(SessionReportProblem $e){$ipResult=$e->getMessage();}}
    $globalResult='';for($i=0;$i<33;$i++){$session=[];$service=new SessionReportDelivery($dir,'unique-ip-'.$i,'other-session-'.$i,$now+$i*70,$mail);try{$service->requestCode('other-'.$i.'@example.test',$session);}catch(SessionReportProblem $e){$globalResult=$e->getMessage();}}
    echo json_encode(['ip'=>$ipResult,'global'=>$globalResult,'mails'=>count($messages)]);${cleanup}`));
  assert.equal(result.ip,'rate_limited');assert.equal(result.global,'rate_limited');assert.equal(result.mails,40);
});

test('a reused request key cannot change the report after successful delivery',()=>{
  const result=JSON.parse(php(`${setup}
    $session['report_verified']=['recipient'=>$recipient,'expires'=>$now+1000];$snapshot=reportNormalize($input);$hash=hash('sha256',reportBuildPdf($snapshot));
    $service->send($recipient,$snapshot,'sample-request-123456',$hash,$session);$snapshot['system']['engineRpm']=4500;$hash=hash('sha256',reportBuildPdf($snapshot));
    try{$service->send($recipient,$snapshot,'sample-request-123456',$hash,$session);$reason='accepted';}catch(SessionReportProblem $e){$reason=$e->getMessage();}
    echo json_encode(['reason'=>$reason,'mails'=>count($messages)]);${cleanup}`,fixture()));
  assert.equal(result.reason,'idempotency_conflict');assert.equal(result.mails,1);
});

test('concurrent PHP requests serialize the same send and invoke only one fake transport',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'sv-report-concurrency-'));
  const code=`require ${JSON.stringify(library)}; $snapshot=reportNormalize(json_decode(stream_get_contents(STDIN),true)); $dir=${JSON.stringify(directory)}; $session=['report_verified'=>['recipient'=>'reports@example.test','expires'=>1788814800]]; $service=new SessionReportDelivery($dir,'test-ip','same-session',1788811200,function()use($dir){file_put_contents($dir.'/calls.txt',"called\\n",FILE_APPEND|LOCK_EX);usleep(100000);return true;}); echo json_encode($service->send('reports@example.test',$snapshot,'concurrent-request-123',hash('sha256',reportBuildPdf($snapshot)),$session));`;
  const run=()=>new Promise((resolve,reject)=>{
    const process=spawn('php',['-r',code],{stdio:['pipe','pipe','pipe']});let output='',error='';process.stdout.on('data',b=>output+=b);process.stderr.on('data',b=>error+=b);process.on('error',reject);process.on('close',status=>status===0&&!error?resolve(JSON.parse(output)):reject(new Error(error||`Exit ${status}`)));process.stdin.end(JSON.stringify(fixture()));
  });
  try {const results=await Promise.all([run(),run()]);assert.equal(results.filter(r=>r.replayed).length,1);assert.equal((await readFile(join(directory,'calls.txt'),'utf8')).match(/called/g).length,1);}finally{await rm(directory,{recursive:true,force:true});}
});

test('corrupt or oversized delivery state fails closed before any fake mail call',()=>{
  const result=JSON.parse(php(`${setup}
    $out=[];foreach(['broken-json',json_encode(['rates'=>'invalid','sends'=>[]]),str_repeat('x',2097153)] as $bytes){file_put_contents($dir.'/ledger.json',$bytes);try{$service->requestCode($recipient,$session);$out[]='accepted';}catch(SessionReportProblem $e){$out[]=$e->getMessage();}}
    echo json_encode(['out'=>$out,'mails'=>count($messages)]);${cleanup}`));
  assert.deepEqual(result.out,Array(3).fill('delivery_storage_unavailable'));assert.equal(result.mails,0);
});
