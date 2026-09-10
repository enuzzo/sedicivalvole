/** Original category silhouettes. Category geometry never claims an exact model. */
const paths={
  aircraft:'M21 2Q18 4 18 10V18L3 27V31L18 27V36L12 40V42L21 40L30 42V40L24 36V27L39 31V27L24 18V10Q24 4 21 2Z',
  light:'M20 3H23V17H40V21H23V35L31 38V41L21 39L11 41V38L19 35V21H2V17H19ZM12 6H30V8H12Z',
  twin:'M20 2H23V17L31 18V12H34V19L41 22V25L24 23V35L31 39V42L21 39L11 42V39L18 35V23L1 25V22L8 19V12H11V18L18 17V7Z',
  helicopter:'M19 2H23V10L38 5L40 8L25 16L40 25L38 28L24 20V30L28 38H35V41H23L20 30V22Q13 21 14 16Q14 12 19 11ZM4 5L19 13L17 17L2 8Z',
  glider:'M20 3H22L23 18L41 21V24L23 22V36L29 39V41L21 39L13 41V39L19 36V22L1 24V21L19 18Z',
  balloon:'M21 2C1 2 1 24 16 31L17 35H25L26 31C41 24 41 2 21 2ZM17 37H25V42H17Z',
  vehicle:'M11 5H31L34 14V37H8V14ZM12 1H16V8H12ZM26 1H30V8H26ZM5 16H9V25H5ZM33 16H37V25H33ZM5 30H9V39H5ZM33 30H37V39H33Z',
  obstacle:'M19 3H23V31H19ZM9 12L12 9L21 18L30 9L33 12L24 21L33 30L30 33L21 24L12 33L9 30L18 21ZM7 39H35V42H7Z',
  drone:'M5 2H12V9L19 16H23L30 9V2H37V9H32L25 18V24L32 33H39V40H32V35L23 27H19L10 35V40H3V33H10L17 24V18L10 9H5Z',
};
export function radarCategory(plane,types={}) {
  const desc=types[plane.typeCode]?.[1]??'';
  if(desc.startsWith('H')||desc.startsWith('G')||plane.category==='A7')return 'helicopter';
  if(plane.typeCode==='BALL'||plane.category==='B2')return 'balloon';
  if(plane.category==='B1'||desc==='L0-')return 'glider';
  if(desc.startsWith('L1')||desc.startsWith('S1')||plane.category==='A1')return 'light';
  if((desc.startsWith('L2')||desc.startsWith('S2'))&&!desc.endsWith('J'))return 'twin';
  if(plane.category==='B6')return 'drone';
  if(['C1','C2'].includes(plane.category))return 'vehicle';
  if(['C3','C4','C5'].includes(plane.category))return 'obstacle';
  return 'aircraft';
}
export function radarFallbackMask(plane,types) {
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 44"><path d="${paths[radarCategory(plane,types)]}"/></svg>`)}")`;
}
