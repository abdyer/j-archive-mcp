export const BASE_URL = "http://www.j-archive.com";
export const SEASONS_URL = `${BASE_URL}/listseasons.php`;
export const SEASON_URL = (id: string) => `${BASE_URL}/showseason.php?season=${id}`;
export const GAME_URL = (id: string) => `${BASE_URL}/showgame.php?game_id=${id}`;
