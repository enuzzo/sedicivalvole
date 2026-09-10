/** A display lens, not an Earth projection. Geographic data remain unchanged. */
export const RADAR_LENS_STRENGTH=0.055;
export function radarLensPoint(point,width,height){
  const cx=width/2,cy=height/2,scale=Math.hypot(cx,cy)||1;
  const x=(point.x-cx)/scale,y=(point.y-cy)/scale;
  const factor=1+RADAR_LENS_STRENGTH*Math.max(0,1-x*x-y*y);
  return {x:cx+x*factor*scale,y:cy+y*factor*scale};
}
export function radarLensOffset(point,width,height){
  const warped=radarLensPoint(point,width,height);return [warped.x-point.x,warped.y-point.y];
}
/** Composite inside MapLibre's render event, before its framebuffer is discarded. */
export function createRadarLens(map){
  const source=map.getCanvas(),canvas=document.createElement('canvas');
  canvas.className='radar-lens-canvas';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false});
  if(!gl)return {active:false,dispose(){}};
  let program,texture,buffer,disposed=false,active=false;
  const shaders=[];
  const restore=()=>{active=false;source.style.opacity='';canvas.style.display='none';};
  const release=()=>{restore();canvas.remove();gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);
    shaders.forEach(shader=>gl.deleteShader(shader));gl.getExtension('WEBGL_lose_context')?.loseContext();};
  try{
    const compile=(type,code)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,code);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Lens shader unavailable');return shader;};
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 a; varying vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;
      uniform sampler2D image; uniform vec2 size; varying vec2 uv;
      void main(){vec2 halfSize=size*.5;float scale=length(halfSize);
        vec2 q=(uv*size-halfSize)/scale;float radius=length(q);float r=radius;
        for(int i=0;i<5;i++){float f=1.+${RADAR_LENS_STRENGTH}*(1.-r*r);
          r-=(r*f-radius)/(1.+${RADAR_LENS_STRENGTH}-3.*${RADAR_LENS_STRENGTH}*r*r);}
        vec2 p=radius>0.00001?q*(r/radius):q;
        gl_FragColor=texture2D(image,(p*scale+halfSize)/size);
      }`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Lens program unavailable');
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const attribute=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    const size=gl.getUniformLocation(program,'size');source.parentElement.append(canvas);
    const render=()=>{
      if(disposed||document.hidden||gl.isContextLost())return;
      try{
        if(canvas.width!==source.width||canvas.height!==source.height){canvas.width=source.width;canvas.height=source.height;gl.viewport(0,0,canvas.width,canvas.height);}
        gl.uniform2f(size,canvas.width,canvas.height);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
        gl.drawArrays(gl.TRIANGLES,0,6);source.style.opacity='0';canvas.style.display='';active=true;
      }catch{restore();}
    };
    map.on('render',render);canvas.addEventListener('webglcontextlost',restore);map.triggerRepaint();
    return {get active(){return active;},dispose(){disposed=true;map.off('render',render);release();}};
  }catch{release();return {active:false,dispose(){}};}
}
