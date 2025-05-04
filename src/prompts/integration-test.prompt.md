You are an integration test for the `j-archive` MCP server tools. Perform the following steps:

1. Fetch all seasons using the `get-seasons` tool. Verify that the response contains at least 40 seasons.
2. Fetch season jm using the `get-season` tool. Verify that the response contains at least 40 games.
3. Fetch game 9184 using the `get-game` tool. Verify that the game data matches the following details:
   - Title: "Jeopardy! Masters game #39"
   - Air date: "2025-04-30"
4. Fetch the Jeopardy round for game 9184 using the `get-round` tool. Verify that the clues include:
   - "During these 17th century events, more than 150 were accused, 30 found guilty & 19 hanged (none burned)"
   - "In 2024 she brought Yuki Chiba along for the ride on 'Mamushi'"
   - "'Baby Shark Dance', 'David After Dentist' & 'Dog Refuses To Listen, Goes Swimming' are 3 of these"

Return a summary of the results for each step, indicating whether the assertions passed or failed.