/** Original bounded HTTP/lifecycle owners; no provider runtime is embedded. */
export async function radarJson(url, {signal, maximumBytes = 131072, ...options} = {}) {
  const response = await fetch(url, { ...options, signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'origin' });
  if (!response.ok) {
    const error = new Error(`Source returned ${response.status}`);
    const retry = response.headers.get('Retry-After');
    error.retryAfterMs = retry && /^\d+$/.test(retry) ? Number(retry)*1000 : Math.max(0, Date.parse(retry)-Date.now()) || 0;
    throw error;
  }
  if (Number(response.headers.get('Content-Length')) > maximumBytes) throw new Error('Response too large');
  const reader=response.body.getReader(), chunks=[]; let length=0;
  try {
    while(true){ const {value,done}=await reader.read(); if(done)break;length+=value.byteLength;
      if(length>maximumBytes)throw new Error('Response too large');chunks.push(value); }
  } catch(error){await reader.cancel();throw error;} finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** One active request, no hidden/offline activity, bounded retry respecting Retry-After. */
export function createRadarPoller({load,onResult,onStatus,canLoad=()=>true,intervalMs=8000,
  now=Date.now,schedule=setTimeout,cancel=clearTimeout}) {
  let stopped=false,pending=false,timer,controller,failures=0,notBefore=0;
  const tick=async()=>{
    cancel(timer);
    if(stopped||pending)return;
    if(!canLoad()){return;}
    if(now()<notBefore){timer=schedule(tick,Math.min(86400000,notBefore-now()));return;}
    pending=true;controller=new AbortController();const timeout=schedule(()=>controller.abort(),15000);
    let delay=intervalMs;
    try{const result=await load(controller.signal);if(!stopped&&!controller.signal.aborted){failures=0;onResult(result);onStatus('ready');}}
    catch(error){if(!stopped&&canLoad()){delay=Math.max(Math.min(300000,15000*2**Math.min(failures++,5)),error.retryAfterMs||0);onStatus('retrying');}}
    finally{cancel(timeout);pending=false;notBefore=now()+delay;if(!stopped&&canLoad())timer=schedule(tick,Math.min(86400000,delay));}
  };
  return {start:tick,wake(){if(canLoad())void tick();},pause(){cancel(timer);controller?.abort();},dispose(){stopped=true;cancel(timer);controller?.abort();}};
}
