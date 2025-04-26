# J-Archive MCP Server

This repository facilitates a single-player *Jeopardy!* game experience in VSCode using the [J-Archive](https://www.j-archive.com/) and GitHub Copilot.

## Features
- Play *Jeopardy!* rounds (Jeopardy!, Double Jeopardy!, and Final Jeopardy!).
- Explore questions from specific seasons and games.
- Single-player adaptation of the classic *Jeopardy!* format.

## Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:abdyer/j-archive-mcp.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update your VSCode `settings.json` file to include the following configuration under the `mcp` key:
   ```json
   "mcp": {
     "servers": {
       "j-archive-mcp": {
         "command": "node",
         "args": ["/path/to/repo/j-archive-mcp/build/index.js"]
       }
     }
   }
   ```
   Replace the file path with the correct path to your MCP server's entry point.
4. Start the MCP server and ask Copilot to play a game of Jeopardy!

## Contributing
Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
