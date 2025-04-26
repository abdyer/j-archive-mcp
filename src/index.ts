import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as cheerio from "cheerio";
import request from "request";
import _ from "lodash";

const server = new McpServer({
    name: "j-archive",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

server.tool(
    "get-seasons",
    "Get all Jeopardy seasons",
    {},
    async (): Promise<{ content: { type: "text"; text: string }[] }> => {
        return requestIndex("http://www.j-archive.com/listseasons.php");
    }
);

server.tool(
    "get-season",
    "Get a Jeopardy season by ID",
    {
        id: z.string().describe("The ID of the Jeopardy season"),
    },
    async ({ id }: { id: string }): Promise<{ content: { type: "text"; text: string }[] }> => {
        return requestIndex(`http://www.j-archive.com/showseason.php?season=${id}`);
    }
);

server.tool(
    "get-game",
    "Get a Jeopardy game by ID",
    {
        id: z.string().describe("The ID of the Jeopardy game"),
    },
    async ({ id }: { id: string }): Promise<{ content: { type: "text"; text: string }[] }> => {
        return new Promise((resolve, reject) => {
            request(`http://www.j-archive.com/showgame.php?game_id=${id}`, (error, response, html) => {
                if (error) return reject(error);

                const $ = cheerio.load(html);
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

                resolve({ content: [{ type: "text", text: JSON.stringify(result) }] });
            });
        });
    }
);

server.tool(
    "get-round",
    "Get a Jeopardy round by ID",
    {
        id: z.string().describe("The ID of the Jeopardy round"),
    },
    async ({ id }: { id: string }): Promise<{ content: { type: "text"; text: string }[] }> => {
        return new Promise((resolve, reject) => {
            request(`http://www.j-archive.com/showgame.php?game_id=${id}`, (error, response, html) => {
                if (error) return reject(error);

                const $ = cheerio.load(html);
                const result: { type: "text"; text: string }[] = [];

                const jeopardyRound = parseRound($, $("#jeopardy_round"), "J");
                result.push({ type: "text", text: JSON.stringify(jeopardyRound) });

                resolve({ content: [{ type: "text", text: JSON.stringify(result) }] });
            });
        });
    }
);

const requestIndex = (url: string) => new Promise<any>((resolve, reject) => {
    request(url, (error, response, html) => {
        if (error) return reject(error);

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
        resolve({ content: [{ type: "text", text: JSON.stringify(result) }] });
    });
});

const parseRound = ($: cheerio.CheerioAPI, context: any, r: string) => {
    const round = $(r !== "FJ" ? "table.round" : "table.final_round", context);
    const roundResult: any = {};

    $("tr", round).first().children().each(function (i, element) {
        const data = $(this);
        roundResult["category" + r + (i + 1)] = {
            category_name: $(".category_name", data).text(),
            category_comments: $(".category_comments", data).text(),
        };
    });

    $(".clue_text", round).not("[id$='_r']").each(function (i, element) {
        const data = $(this);
        const clueId = data.attr("id");
        if (clueId) {
            roundResult[clueId] = {
                clue_text: data.text(),
                correct_response: $(".correct_response", data.parent()).text(),
            };
        }
    });

    return roundResult;
};

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("J-Archive MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});