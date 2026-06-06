/**
 * Decodifica el payload de un JWT sin verificar la firma.
 *
 * La verificación criptográfica real ocurre en el servidor. Acá solo se extrae
 * el payload para tomar decisiones de navegación en el cliente,
 * evitando un round-trip innecesario al servidor.
 *
 * @param {string} token - JWT en formato header.payload.signature (base64url).
 * @returns {{ sub: string, role: string } | null} Payload decodificado, o `null` si el token es inválido o está malformado.
 */
export function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}
