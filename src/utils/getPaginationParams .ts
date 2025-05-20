export function getPaginationParams(page: string, limit: string) {
  const limitNum = Number(limit || 20);
  const pageNum = Number(page || 1);
  const skip = Number(limitNum * pageNum - limitNum);
  return { skip, take: limitNum };
}
