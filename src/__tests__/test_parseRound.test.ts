import * as cheerio from 'cheerio';
import { parseRound, server } from '../index';
import * as fs from 'fs';
import * as path from 'path';

describe('parseRound', () => {
    it('should correctly parse the first clue with a clue_order_number of 27', () => {
        const htmlFilePath = path.join(__dirname, 'game_response.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        const $ = cheerio.load(htmlContent);

        const jeopardyRound = parseRound($, $('#jeopardy_round'), 'J');

        const firstClue = jeopardyRound['clue_J_1_1'];
        expect(firstClue).toBeDefined();
        expect(firstClue.clue_order_number).toBe('27');
    });

    afterAll(async () => {
        await server.close();
    });
});
