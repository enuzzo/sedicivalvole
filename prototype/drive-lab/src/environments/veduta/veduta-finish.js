import { VEDUTA_STYLES } from './veduta-model.js';

const VERTEX = `#version 300 es
out vec2 uv;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;

// Original bounded colour abstraction: nine paint samples, four soft
// variance-weighted regions, then one medium response over the complete world.
// Four one-pixel samples keep structural contours separate from broad washes.
// No sampled pixels leave the GPU. Paper is screen-fixed; geometry retains its
// own globally anchored pigment. This is not a semantic/depth reconstruction.
export const VEDUTA_FINISH_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D landscape;
uniform vec2 resolution;
uniform float pixelRatio;
uniform float medium;
uniform vec2 marker;
uniform float keepMarker;
in vec2 uv;
out vec4 result;
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(a),hash(a+vec2(1.,0.)),f.x),mix(hash(a+vec2(0.,1.)),hash(a+1.),f.x),f.y);}
vec4 region(vec3 a,vec3 b,vec3 c,vec3 d){vec3 mean=(a+b+c+d)*.25;
vec3 variance=max((a*a+b*b+c*c+d*d)*.25-mean*mean,vec3(0.));
float w=1./pow(1.+dot(variance,vec3(.3,.5,.2))*180.,2.);
return vec4(mean*w,w);}
void main(){vec2 px=gl_FragCoord.xy/pixelRatio;
vec3 original=texture(landscape,uv).rgb;
if(keepMarker>.5&&distance(px,marker)<7.5){result=vec4(original,1.);return;}
float radius=medium>1.5?3.2:medium>.5?1.05:1.65;
vec2 t=vec2(radius*pixelRatio)/resolution;
vec3 n=texture(landscape,uv+vec2(0.,t.y)).rgb;
vec3 s=texture(landscape,uv-vec2(0.,t.y)).rgb;
vec3 e=texture(landscape,uv+vec2(t.x,0.)).rgb;
vec3 w=texture(landscape,uv-vec2(t.x,0.)).rgb;
vec3 ne=texture(landscape,uv+t).rgb,sw=texture(landscape,uv-t).rgb;
vec3 nw=texture(landscape,uv+vec2(-t.x,t.y)).rgb,se=texture(landscape,uv+vec2(t.x,-t.y)).rgb;
vec4 paint=region(original,n,w,nw)+region(original,n,e,ne)+region(original,s,w,sw)+region(original,s,e,se);
vec3 c=paint.rgb/max(paint.a,.001);
float gradient=length(e-w)+length(n-s);
vec2 detail=vec2(pixelRatio)/resolution;
vec3 dn=texture(landscape,uv+vec2(0.,detail.y)).rgb;
vec3 ds=texture(landscape,uv-vec2(0.,detail.y)).rgb;
vec3 de=texture(landscape,uv+vec2(detail.x,0.)).rgb;
vec3 dw=texture(landscape,uv-vec2(detail.x,0.)).rgb;
float localGradient=length(de-dw)+length(dn-ds);
float outline=smoothstep(.10,.42,localGradient);
// Preserve structure where a wide paint kernel would mix road/roof/sky.
if(medium<.5||medium>1.5)c=mix(c,original,smoothstep(.10,.32,gradient)*.84);
float fine=hash(floor(px));
float wash=noise(px*.025)*.55+noise(px*.083)*.3+noise(px*.19)*.15;
if(medium<.5){
  float l=lum(c);vec3 chroma=c-vec3(l);
  float band=floor(clamp(l,0.,.999)*7.)/7.;
  c=mix(c,vec3(band)+chroma*1.22,.33);
  float shade=1.-smoothstep(.28,.82,l);
  c=mix(c,c*vec3(.79,.91,1.13),shade*.42);
  c+=vec3(.025,.012,-.012)*(1.-shade);
  c*=.975+wash*.055;
  float water=step(original.r*1.18,original.b)*step(original.r*1.18,original.g)*step(original.g*.9,original.b);
  c=mix(c,vec3(.14,.23,.25),outline*.26*(1.-water*.88));
}else if(medium<1.5){
  float l=lum(c),shade=1.-smoothstep(.3,.94,l);
  vec3 paper=vec3(.985,.972,.935);
  float spacing=3.6;
  vec2 p=vec2(px.x*.866+px.y*.5,-px.x*.5+px.y*.866)/spacing;
  vec2 cell=fract(p)-.5;
  float dotRadius=mix(.05,.43,shade),aa=max(fwidth(length(cell)),.035);
  float dots=1.-smoothstep(dotRadius-aa,dotRadius+aa,length(cell));
  float hatchPhase=(px.x+px.y*.62)/5.;
  float hatch=1.-smoothstep(.08,.08+max(fwidth(hatchPhase),.08),abs(fract(hatchPhase)-.5));
  float tone=shade*.36+dots*shade*.48+hatch*smoothstep(.35,.8,shade)*.18;
  float black=1.-smoothstep(.19,.36,l);
  float ink=max(black,outline*.70);
  c=mix(paper*(1.-tone),vec3(.055,.065,.07),ink);
  c*=.985+fine*.023;
}else{
  vec3 paper=vec3(.985,.959,.895);
  vec3 pigment=clamp(c*vec3(1.025,1.015,.975),vec3(.035),vec3(.98));
  float density=.66+wash*.69;
  c=paper*pow(clamp(pigment/paper,vec3(.025),vec3(1.)),vec3(density));
  float reserve=smoothstep(.63,.9,wash)*.18;
  c=mix(c,paper,reserve);
  float pooling=outline*(.08+noise(px*.14)*.10);
  c*=1.-pooling;
  c*=.973+fine*.046;
  c=mix(c,paper,.045);
}
result=vec4(clamp(c,0.,1.),1.);
}`;

function shader(gl, type, source) {
  const object = gl.createShader(type); gl.shaderSource(object, source); gl.compileShader(object);
  if (!gl.getShaderParameter(object, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(object); gl.deleteShader(object); throw new Error(`Veduta finish shader: ${message}`);
  }
  return object;
}

/** A terminal public custom layer: one GPU copy/texture, one fullscreen draw. */
export function createVedutaFinish(readPreferences, readPoint, onError) {
  let program, texture, vao, map, size = '', disposed = false, disabled = false;
  const uniforms = {};
  return {
    id: 'veduta-medium-finish', type: 'custom', renderingMode: '2d',
    onAdd(owner, gl) {
      map = owner;
      let vertex, fragment;
      try {
        vertex = shader(gl, gl.VERTEX_SHADER, VERTEX); fragment = shader(gl, gl.FRAGMENT_SHADER, VEDUTA_FINISH_FRAGMENT);
        program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Veduta finish link: ${gl.getProgramInfoLog(program)}`);
        texture = gl.createTexture(); vao = gl.createVertexArray();
        for (const name of ['landscape','resolution','pixelRatio','medium','marker','keepMarker']) uniforms[name] = gl.getUniformLocation(program, name);
      } catch (error) { disabled = true; onError?.(error); }
      finally { if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); }
    },
    render(gl) {
      if (disposed || disabled || !program || !texture) return;
      const viewport = gl.getParameter(gl.VIEWPORT), previousRead = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
      const previousActive = gl.getParameter(gl.ACTIVE_TEXTURE), previousProgram = gl.getParameter(gl.CURRENT_PROGRAM);
      const previousVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
      gl.activeTexture(gl.TEXTURE0); const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
      const caps = [gl.BLEND,gl.DEPTH_TEST,gl.STENCIL_TEST,gl.CULL_FACE,gl.SCISSOR_TEST];
      const enabled = caps.map(cap => gl.isEnabled(cap));
      const depthWrite = gl.getParameter(gl.DEPTH_WRITEMASK);
      try {
        const [x,y,width,height] = viewport;
        if (!width || !height) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (size !== `${width}:${height}`) {
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          size = `${width}:${height}`;
        }
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER,gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING));
        gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,x,y,width,height);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previousRead);
        caps.forEach(cap => gl.disable(cap)); gl.depthMask(false);
        gl.useProgram(program); gl.bindVertexArray(vao);
        const ratio = width / Math.max(1,map.getCanvas().clientWidth), preferences = readPreferences();
        gl.uniform1i(uniforms.landscape,0); gl.uniform2f(uniforms.resolution,width,height); gl.uniform1f(uniforms.pixelRatio,ratio);
        gl.uniform1f(uniforms.medium,Math.max(0,VEDUTA_STYLES.indexOf(preferences.style)));
        const point = readPoint(), marker = point ? map.project([point.longitude,point.latitude]) : null;
        gl.uniform1f(uniforms.keepMarker,point && (preferences.vehicle === 'point' || !Number.isFinite(point.heading)) ? 1 : 0);
        gl.uniform2f(uniforms.marker,marker?.x ?? -100,marker ? height/ratio-marker.y : -100);
        gl.drawArrays(gl.TRIANGLES,0,3);
      } catch (error) { disabled = true; onError?.(error); }
      finally {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previousRead); gl.bindTexture(gl.TEXTURE_2D,previousTexture); gl.activeTexture(previousActive);
        gl.useProgram(previousProgram); gl.bindVertexArray(previousVao); gl.depthMask(depthWrite);
        caps.forEach((cap,index) => enabled[index] ? gl.enable(cap) : gl.disable(cap));
      }
    },
    onRemove(owner, gl) {
      disposed = true; if (texture) gl.deleteTexture(texture); if (program) gl.deleteProgram(program); if (vao) gl.deleteVertexArray(vao);
    },
  };
}
