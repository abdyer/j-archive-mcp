import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as cheerio from "cheerio";
import request from "request";
import _ from "lodash";
import { SEASONS_URL, SEASON_URL, GAME_URL } from "./config.js";
import { parseRound, parseGame, parseIndex } from "./parsing.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const PROMPTS: Record<string, { name: string; description: string; arguments: any[] }> = fs.readdirSync(path.join(__dirname, "prompts"))
  .filter((file) => file.endsWith(".prompt.md"))
  .reduce((acc, file) => {
    const name = path.basename(file, ".prompt.md");
    acc[name] = {
      name,
      description: fs.readFileSync(path.join(__dirname, "prompts", file), "utf-8"),
      arguments: [],
    };
    return acc;
  }, {} as Record<string, { name: string; description: string; arguments: any[] }>);

server.tool(
  "list-prompts",
  "List available prompts",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(Object.values(PROMPTS)),
        },
      ],
    };
  }
);

server.tool(
  "get-prompt",
  "Get a specific prompt",
  {
    name: z.string().describe("The name of the prompt to retrieve"),
  },
  async ({ name }) => {
    const prompt = PROMPTS[name];
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prompt),
        },
      ],
    };
  }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
