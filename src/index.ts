import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as cheerio from "cheerio";
import request from "request";
import _ from "lodash";
import { SEASONS_URL, SEASON_URL, GAME_URL } from "./config.js";
import { parseRound, parseGame, parseIndex } from "./parsing.js";

export const server = new McpServer({
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
        const html = await new Promise<string>((resolve, reject) => {
            request(SEASONS_URL, (error, _response, body) => {
                if (error) return reject(error);
                resolve(body);
            });
        });
        return parseIndex(html);
    }
);

server.tool(
    "get-season",
    "Get a Jeopardy season by ID",
    {
        id: z.string().describe("The ID of the Jeopardy season"),
    },
    async ({ id }: { id: string }): Promise<{ content: { type: "text"; text: string }[] }> => {
        const html = await new Promise<string>((resolve, reject) => {
            request(SEASON_URL(id), (error, _response, body) => {
                if (error) return reject(error);
                resolve(body);
            });
        });
        return parseIndex(html);
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
            request(GAME_URL(id), (error: Error | null, _response: any, html: string) => {
                if (error) return reject(error);

                const $ = cheerio.load(html);
                const parsedGame = parseGame($);

                resolve(parsedGame);
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
            request(GAME_URL(id), (error, _response, html) => {
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.info("J-Archive MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
