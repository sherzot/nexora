/** Original SVG geometry; coordinates describe only the synthetic scene. */
export const project = (x: number, y: number, height = 0): readonly [number, number] =>
  [380 + (x - y) * 46, 95 + (x + y) * 23 - height];
export const points = (vertices: readonly (readonly [number, number])[]) =>
  vertices.map(([x, y]) => `${x},${y}`).join(' ');
export const floorPoints = (x: number, y: number, width: number, depth: number, height = 0) =>
  points([project(x, y, height), project(x + width, y, height), project(x + width, y + depth, height), project(x, y + depth, height)]);
export const boxFaces = (x: number, y: number, width: number, depth: number, height: number) => ({
  top: floorPoints(x, y, width, depth, height),
  left: points([project(x, y + depth, height), project(x + width, y + depth, height), project(x + width, y + depth), project(x, y + depth)]),
  right: points([project(x + width, y, height), project(x + width, y + depth, height), project(x + width, y + depth), project(x + width, y)]),
});
