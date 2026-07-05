export async function hashPassword(password: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  const h = await hashPassword(plain);
  return h === hashed;
}