import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = "http://localhost:3000";
const USER_AGENT = "prison-manager/1.0";

// Create server instance
const server = new McpServer({
  name: "prison-manager",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// helper to make api requests
async function makeRequest(url) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(fullUrl, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

server.tool(
  "get-inmates",
  "Get a list of inmates. Include unassigned=true querystring parameter to filter out unassigned",
  {
    unassigned: z
      .boolean()
      .describe(
        "A boolean indicating whether to pull assigned or unassigned inmates, (e.g. true, false)"
      ),
  },
  async ({ unassigned }) => {
    const data = await makeRequest(`/inmates?unassigned=${unassigned}`);

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve data",
          },
        ],
      };
    }

    const inmatesText = `List of inmates is ${JSON.stringify(data)}`;

    return {
      content: [
        {
          type: "text",
          text: inmatesText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prison Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
