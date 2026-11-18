// Deterministic, decorative pixel characters. No external art files or network calls.
// A member's request id selects a consistent chibi look for that request.
const HAIR = ['#382e51', '#5a3e33', '#db9c49', '#24536c', '#9a4b78', '#30251e']
const SKIN = ['#f0bf94', '#e2a87f', '#b77f61', '#f5d2ae', '#c99772']
const SHIRT = ['#2dd4bf', '#ff8bae', '#83b8ff', '#ffda75', '#bd9bff', '#99df93']
const deep = '#263247'

function spriteColors(id) {
  const n = ((Number(id) || 1) * 1103515245 + 12345) >>> 0
  return {
    hair: HAIR[n % HAIR.length],
    skin: SKIN[(n >>> 3) % SKIN.length],
    shirt: SHIRT[(n >>> 6) % SHIRT.length],
    bangs: (n >>> 10) % 3,
    accessory: (n >>> 14) % 3,
  }
}

export function MemberAvatar({ id, name, celebrating = false, tapped = false }) {
  const { hair, skin, shirt, bangs, accessory } = spriteColors(id)
  const pixels = [
    // Outline, hair and face: 16x16 crisp square pixels.
    [4, 1, 8, 1, deep], [3, 2, 10, 4, deep],
    [4, 2, 8, 4, hair], [2, 5, 12, 5, deep],
    [3, 6, 10, 5, deep], [4, 5, 8, 6, skin],
    [2, 7, 2, 3, skin], [12, 7, 2, 3, skin],
    [5, 7, 2, 1, deep], [9, 7, 2, 1, deep],
    [4, 9, 2, 1, '#ec858c'], [10, 9, 2, 1, '#ec858c'],
    [7, 10, 2, 1, '#a35062'],
    [3, 11, 10, 1, deep], [4, 12, 8, 4, shirt],
    [2, 12, 2, 3, skin], [12, 12, 2, 3, skin],
    [6, 12, 4, 1, '#f7f8ff'],
    [4, 15, 3, 1, deep], [9, 15, 3, 1, deep],
  ]
  if (bangs === 0) pixels.push([4, 4, 6, 2, hair], [10, 5, 2, 1, hair])
  if (bangs === 1) pixels.push([4, 4, 8, 1, hair], [4, 5, 3, 1, hair])
  if (bangs === 2) pixels.push([7, 4, 5, 2, hair], [4, 5, 2, 1, hair])
  if (accessory === 0) pixels.push([10, 2, 3, 1, '#f7d9ff'])
  if (accessory === 1) pixels.push([3, 3, 2, 1, '#f9e577'])

  return (
    <span className={`cm-avatar${celebrating ? ' cm-avatar--celebrating' : ''}${tapped ? ' cm-avatar--tapped' : ''}`} aria-hidden="true">
      <svg className="cm-avatar__sprite" viewBox="0 0 16 16" shapeRendering="crispEdges" role="img" aria-label={`Pixel avatar of ${name}`}>
        {pixels.map(([x, y, w, h, fill], index) => (
          <rect key={index} x={x} y={y} width={w} height={h} fill={fill} />
        ))}
      </svg>
      {celebrating && <span className="cm-avatar__heart">♥</span>}
    </span>
  )
}
