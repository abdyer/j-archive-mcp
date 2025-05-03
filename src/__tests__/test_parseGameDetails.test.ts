import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { parseGameDetails, server } from '../index';
import path from 'path';

describe('parseGameDetails', () => {
    it('should correctly parse Jeopardy round scores', () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'game_response.html'), 'utf-8');
        const $ = cheerio.load(html);
        const gameDetails = parseGameDetails($);

        expect(gameDetails.jeopardyScores).toEqual([
            { contestant: 'Victoria', score: '3,800' },
            { contestant: 'Yogesh', score: '15,400' },
            { contestant: 'Brad', score: '1,000' },
        ]);
    });

    it('should correctly parse Double Jeopardy round scores', () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'game_response.html'), 'utf-8');
        const $ = cheerio.load(html);
        const gameDetails = parseGameDetails($);

        expect(gameDetails.doubleJeopardyScores).toEqual([
            { contestant: 'Victoria', score: '14,000' },
            { contestant: 'Yogesh', score: '30,800' },
            { contestant: 'Brad', score: '6,200' },
        ]);
    });

    it('should correctly parse Final Jeopardy scores', () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'game_response.html'), 'utf-8');
        const $ = cheerio.load(html);
        const gameDetails = parseGameDetails($);

        expect(gameDetails.finalScores).toEqual([
            { contestant: 'Victoria', score: '14,000' },
            { contestant: 'Yogesh', score: '30,800' },
            { contestant: 'Brad', score: '2,178' },
        ]);
    });

    it('should correctly parse Coryat scores', () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'game_response.html'), 'utf-8');
        const $ = cheerio.load(html);
        const gameDetails = parseGameDetails($);

        expect(gameDetails.coryatScores).toEqual([
            { contestant: 'Victoria', score: '10,200' },
            { contestant: 'Yogesh', score: '22,600' },
            { contestant: 'Brad', score: '6,200' },
        ]);
    });

    afterAll(async () => {
        await server.close();
    });
});
