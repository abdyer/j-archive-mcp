import * as cheerio from 'cheerio';
import { parseRound, parseGameDetails, parseGame, parseCategories, parseClues, parseScores } from '../parsing';
import * as fs from 'fs';
import * as path from 'path';

let html: string;
let $: cheerio.CheerioAPI;

beforeAll(() => {
    html = fs.readFileSync(path.resolve(__dirname, 'game_response.html'), 'utf-8');
    $ = cheerio.load(html);
});

describe('parseRound', () => {
    it('should correctly parse the first clue with a clue_order_number of 27', () => {
        const jeopardyRound = parseRound($, $('#jeopardy_round'), 'J');

        const firstClue = jeopardyRound['clue_J_1_1'];
        expect(firstClue).toBeDefined();
        if ('clue_order_number' in firstClue) {
            expect(firstClue.clue_order_number).toBe('27');
        } else {
            throw new Error('Expected a Clue object but got a Category');
        }
    });
});

describe('parseGameDetails', () => {
    it('should correctly parse Jeopardy round scores', () => {
        const gameDetails = parseGameDetails($);

        expect(gameDetails.jeopardyScores).toEqual([
            { contestant: 'Victoria', score: '3,800' },
            { contestant: 'Yogesh', score: '15,400' },
            { contestant: 'Brad', score: '1,000' },
        ]);
    });

    it('should correctly parse Double Jeopardy round scores', () => {
        const gameDetails = parseGameDetails($);

        expect(gameDetails.doubleJeopardyScores).toEqual([
            { contestant: 'Victoria', score: '14,000' },
            { contestant: 'Yogesh', score: '30,800' },
            { contestant: 'Brad', score: '6,200' },
        ]);
    });

    it('should correctly parse Final Jeopardy scores', () => {
        const gameDetails = parseGameDetails($);

        expect(gameDetails.finalScores).toEqual([
            { contestant: 'Victoria', score: '14,000' },
            { contestant: 'Yogesh', score: '30,800' },
            { contestant: 'Brad', score: '2,178' },
        ]);
    });

    it('should correctly parse Coryat scores', () => {
        const gameDetails = parseGameDetails($);

        expect(gameDetails.coryatScores).toEqual([
            { contestant: 'Victoria', score: '10,200' },
            { contestant: 'Yogesh', score: '22,600' },
            { contestant: 'Brad', score: '6,200' },
        ]);
    });
});

describe('parseGame', () => {
    it('should correctly parse game details including title and comments', () => {
        const parsedGame = parseGame($);

        expect(parsedGame.content).toEqual(
            expect.arrayContaining([
                { type: 'text', text: expect.stringContaining('Game Title:') },
                { type: 'text', text: expect.stringContaining('Game Comments:') },
            ])
        );
    });

    it('should correctly parse Jeopardy round details', () => {
        const parsedGame = parseGame($);

        expect(parsedGame.content).toEqual(
            expect.arrayContaining([
                { type: 'text', text: expect.stringContaining('Jeopardy Round:') },
                { type: 'text', text: expect.stringContaining('Double Jeopardy Round:') },
                { type: 'text', text: expect.stringContaining('Final Jeopardy Round:') },
            ])
        );
    });

    it('should correctly parse game scores', () => {
        const parsedGame = parseGame($);

        expect(parsedGame.content).toEqual(
            expect.arrayContaining([
                { type: 'text', text: expect.stringContaining('Jeopardy Scores:') },
                { type: 'text', text: expect.stringContaining('Double Jeopardy Scores:') },
                { type: 'text', text: expect.stringContaining('Final Scores:') },
                { type: 'text', text: expect.stringContaining('Coryat Scores:') },
            ])
        );
    });
});

describe('parseCategories', () => {
    it('should correctly parse categories from a round', () => {
        const categories = parseCategories($, $('#jeopardy_round'), 'J');

        expect(categories).toHaveProperty('categoryJ1');
        expect(categories['categoryJ1']).toEqual(
            expect.objectContaining({
                category_name: expect.any(String),
                category_comments: expect.any(String),
            })
        );
    });
});

describe('parseClues', () => {
    it('should correctly parse clues from a round', () => {
        const clues = parseClues($, $('#jeopardy_round'));

        expect(clues).toHaveProperty('clue_J_1_1');
        expect(clues['clue_J_1_1']).toEqual(
            expect.objectContaining({
                clue_text: expect.any(String),
                correct_response: expect.any(String),
                clue_order_number: expect.any(String),
            })
        );
    });
});

describe('parseScores', () => {
    it('should correctly parse scores from a game', () => {
        const scores = parseScores($, 'Final scores');

        expect(scores).toEqual(
            expect.arrayContaining([
                { contestant: 'Victoria', score: '14,000' },
                { contestant: 'Yogesh', score: '30,800' },
                { contestant: 'Brad', score: '2,178' },
            ])
        );
    });
});
