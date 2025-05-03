import * as cheerio from "cheerio";
import request from "request";
import _ from "lodash";

interface Clue {
    clue_text: string;
    correct_response: string;
    clue_order_number: string;
}

interface Category {
    category_name: string;
    category_comments: string;
}

interface Round {
    [key: string]: Clue | Category;
}

interface GameDetails {
    finalScores: { contestant: string; score: string }[];
    coryatScores: { contestant: string; score: string }[];
    jeopardyScores: { contestant: string; score: string }[];
    doubleJeopardyScores: { contestant: string; score: string }[];
}

export const requestIndex = async (url: string): Promise<any> => {
    try {
        const html = await new Promise<string>((resolve, reject) => {
            request(url, (error, response, body) => {
                if (error) return reject(error);
                resolve(body);
            });
        });

        const $ = cheerio.load(html);
        const result: { type: "text"; text: string }[] = [];
        $("#content table tr").each(function () {
            const data = $(this);
            const row: string[] = [];
            data.children().each(function (i, element) {
                if (i === 0) {
                    let link = $("a", element).first().attr("href") || "";
                    link = link.substring(link.indexOf("=") + 1);
                    row.push(link);
                }
                row.push($(element).text().trim());
            });
            const season = _.zipObject(["id", "name", "description", "note"], row);
            result.push({ type: "text", text: JSON.stringify(season) });
        });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
        console.error("Error in requestIndex:", error);
        throw error;
    }
};

export const parseCategories = ($: cheerio.CheerioAPI, context: any, roundPrefix: string): Record<string, any> => {
    const categories: Record<string, any> = {};
    const roundTable = $(roundPrefix !== "FJ" ? "table.round" : "table.final_round", context);
    const firstRowChildren = $("tr", roundTable).first().children();

    firstRowChildren.each(function (i, element) {
        const data = $(this);
        categories[`category${roundPrefix}${i + 1}`] = {
            category_name: data.find(".category_name").text(),
            category_comments: data.find(".category_comments").text(),
        };
    });

    return categories;
};

export const parseClues = ($: cheerio.CheerioAPI, context: any): Record<string, any> => {
    const clues: Record<string, any> = {};
    const clueTexts = $(".clue_text", context).not("[id$='_r']");

    clueTexts.each(function () {
        const data = $(this);
        const clueId = data.attr("id");
        const parent = data.parent();
        const clueOrder = data.closest(".clue").find(".clue_order_number a").text();
        if (clueId) {
            clues[clueId] = {
                clue_text: data.text(),
                correct_response: parent.find(".correct_response").text(),
                clue_order_number: clueOrder,
            };
        }
    });

    return clues;
};

export const parseRound = ($: cheerio.CheerioAPI, context: any, roundPrefix: string): Round => {
    const categories = parseCategories($, context, roundPrefix);
    const clues = parseClues($, context);

    return { ...categories, ...clues } as Round;
};

export const parseScores = ($: cheerio.CheerioAPI, headerText: string): { contestant: string; score: string }[] => {
    const scores: { contestant: string; score: string }[] = [];
    const header = $(`h3:contains('${headerText}')`);
    const scoresTable = header.next('table');

    if (scoresTable.length === 0) {
        console.warn(`No table found for header: ${headerText}`);
        return scores;
    }

    const nameCells = scoresTable.find('td.score_player_nickname');
    const scoreCells = scoresTable.find('td.score_positive');

    if (nameCells.length !== scoreCells.length) {
        console.warn(`Mismatch between number of names and scores for header: ${headerText}`);
        return scores;
    }

    nameCells.each((index, element) => {
        const contestant = $(element).text().trim();
        const score = $(scoreCells[index]).text().trim();
        if (contestant && score) {
            scores.push({ contestant, score });
        }
    });

    return scores;
};

export const parseGameDetails = ($: cheerio.CheerioAPI): GameDetails => {
    const finalScores = parseScores($, 'Final scores');
    const coryatScores = parseScores($, 'Coryat scores');
    const jeopardyScores = parseScores($, 'Scores at the end of the Jeopardy! Round');
    const doubleJeopardyScores = parseScores($, 'Scores at the end of the Double Jeopardy! Round');

    return { finalScores, coryatScores, jeopardyScores, doubleJeopardyScores };
};

export const parseGame = ($: cheerio.CheerioAPI): { content: { type: "text"; text: string }[] } => {
    const result: { type: "text"; text: string }[] = [];

    const gameTitle = $("#game_title").text();
    const gameComments = $("#game_comments").text();

    result.push({ type: "text", text: `Game Title: ${gameTitle}` });
    result.push({ type: "text", text: `Game Comments: ${gameComments}` });

    const jeopardyRound = parseRound($, $("#jeopardy_round"), "J");
    const doubleJeopardyRound = parseRound($, $("#double_jeopardy_round"), "DJ");
    const finalJeopardyRound = parseRound($, $("#final_jeopardy_round"), "FJ");

    result.push({ type: "text", text: `Jeopardy Round: ${JSON.stringify(jeopardyRound)}` });
    result.push({ type: "text", text: `Double Jeopardy Round: ${JSON.stringify(doubleJeopardyRound)}` });
    result.push({ type: "text", text: `Final Jeopardy Round: ${JSON.stringify(finalJeopardyRound)}` });

    const gameDetails = parseGameDetails($);

    result.push({ type: "text", text: `Jeopardy Scores: ${JSON.stringify(gameDetails.jeopardyScores)}` });
    result.push({ type: "text", text: `Double Jeopardy Scores: ${JSON.stringify(gameDetails.doubleJeopardyScores)}` });
    result.push({ type: "text", text: `Final Scores: ${JSON.stringify(gameDetails.finalScores)}` });
    result.push({ type: "text", text: `Coryat Scores: ${JSON.stringify(gameDetails.coryatScores)}` });

    return { content: result };
};
