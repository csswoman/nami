/**
 * Enlaces externos de la página /acerca. Se pueden cambiar sin tocar código con variables de entorno
 * (NEXT_PUBLIC_REPO_URL, NEXT_PUBLIC_PORTFOLIO_URL); sin ellas se usa el perfil de GitHub y el portafolio queda sin enlace.
 */
export const GITHUB_URL = "https://github.com/csswoman";
export const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL || GITHUB_URL;
export const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || null;
