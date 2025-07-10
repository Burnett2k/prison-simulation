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
async function makeRequest(url, method = "GET", data = null) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const options = { method, headers };
    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(fullUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error making API request:", error);
    return null;
  }
}

// Get list of inmates
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
            text: "Failed to retrieve inmates data",
          },
        ],
      };
    }

    const inmatesText = `List of inmates: ${JSON.stringify(data, null, 2)}`;

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

// Get specific inmate by ID
server.tool(
  "get-inmate",
  "Get a specific inmate by their ID",
  {
    inmateId: z.string().describe("The ID of the inmate to retrieve"),
  },
  async ({ inmateId }) => {
    const data = await makeRequest(`/inmates/${inmateId}`);

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve inmate data",
          },
        ],
      };
    }

    const inmateText = `Inmate details: ${JSON.stringify(data, null, 2)}`;

    return {
      content: [
        {
          type: "text",
          text: inmateText,
        },
      ],
    };
  }
);

// Add new inmate
server.tool(
  "add-inmate",
  "Add a new inmate to the system",
  {
    firstName: z.string().describe("First name of the inmate"),
    lastName: z.string().describe("Last name of the inmate"),
    isViolent: z.boolean().describe("Whether the inmate is violent"),
    isJuvenile: z.boolean().describe("Whether the inmate is a juvenile"),
  },
  async ({ firstName, lastName, isViolent, isJuvenile }) => {
    const data = await makeRequest("/inmates", "POST", {
      firstName,
      lastName,
      isViolent,
      isJuvenile,
    });

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to add inmate",
          },
        ],
      };
    }

    const resultText = `Inmate added successfully: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  }
);

// Get all cells for a prison
server.tool(
  "get-cells",
  "Get all cells for a specific prison",
  {
    prisonId: z.string().describe("The ID of the prison"),
  },
  async ({ prisonId }) => {
    const data = await makeRequest(`/cells/${prisonId}`);

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve cells data",
          },
        ],
      };
    }

    const cellsText = `Cells for prison ${prisonId}: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: cellsText,
        },
      ],
    };
  }
);

// Create new cell
server.tool(
  "create-cell",
  "Create a new cell in a prison",
  {
    capacity: z.number().describe("The capacity of the cell"),
    prisonId: z.string().describe("The ID of the prison"),
  },
  async ({ capacity, prisonId }) => {
    const data = await makeRequest("/cells", "POST", {
      capacity,
      prisonId,
    });

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to create cell",
          },
        ],
      };
    }

    const resultText = `Cell created successfully: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  }
);

// Get all prisons
server.tool("get-prisons", "Get a list of all prisons", {}, async () => {
  const data = await makeRequest("/prisons");

  if (!data) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve prisons data",
        },
      ],
    };
  }

  const prisonsText = `List of prisons: ${JSON.stringify(data, null, 2)}`;

  return {
    content: [
      {
        type: "text",
        text: prisonsText,
      },
    ],
  };
});

// Get prison cell occupancy
server.tool(
  "get-prison-occupancy",
  "Get cell occupancy data for a specific prison",
  {
    prisonId: z.string().describe("The ID of the prison"),
  },
  async ({ prisonId }) => {
    const data = await makeRequest(`/prisons/${prisonId}/cellOccupancy`);

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve prison occupancy data",
          },
        ],
      };
    }

    const occupancyText = `Prison ${prisonId} occupancy: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: occupancyText,
        },
      ],
    };
  }
);

// Add new officer
server.tool(
  "add-officer",
  "Add a new officer to the system",
  {
    firstName: z.string().describe("First name of the officer"),
    lastName: z.string().describe("Last name of the officer"),
    prisonId: z
      .string()
      .describe("The ID of the prison where the officer works"),
  },
  async ({ firstName, lastName, prisonId }) => {
    const data = await makeRequest("/officers", "POST", {
      firstName,
      lastName,
      prisonId,
    });

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to add officer",
          },
        ],
      };
    }

    const resultText = `Officer added successfully: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  }
);

// Assign inmate to cell
server.tool(
  "assign-inmate",
  "Assign an inmate to a cell",
  {
    inmateId: z.string().describe("The ID of the inmate to assign"),
    cellId: z.string().describe("The ID of the cell"),
    officerId: z
      .string()
      .describe("The ID of the officer making the assignment"),
    prisonId: z.string().describe("The ID of the prison"),
    reason: z.string().describe("The reason for the assignment"),
  },
  async ({ inmateId, cellId, officerId, prisonId, reason }) => {
    const data = await makeRequest(`/assignments/${inmateId}`, "POST", {
      cellId,
      officerId,
      prisonId,
      reason,
    });

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to assign inmate",
          },
        ],
      };
    }

    const resultText = `Inmate assigned successfully: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  }
);

//release inmate
server.tool(
  "release-inmate",
  "Release an inmate from prison",
  {
    inmateId: z.string().describe("The ID of the inmate to release"),
    officerId: z
      .string()
      .describe("The ID of the officer processing the release"),
    prisonId: z.string().describe("The ID of the prison releasing the inmate"),
    reason: z
      .string()
      .optional()
      .describe("The reason for release (optional, defaults to 'released')"),
  },
  async ({ inmateId, officerId, prisonId, reason }) => {
    const data = await makeRequest(`/assignments/${inmateId}/release`, "POST", {
      officerId,
      prisonId,
      reason,
    });

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to release inmate",
          },
        ],
      };
    }

    const resultText = `Inmate released successfully: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: resultText,
        },
      ],
    };
  }
);

// Get cell occupancy (inmates in specific cell)
server.tool(
  "get-cell-occupancy",
  "Get the inmates currently assigned to a specific cell",
  {
    prisonId: z.string().describe("The ID of the prison"),
    cellId: z.string().describe("The ID of the cell"),
  },
  async ({ prisonId, cellId }) => {
    const data = await makeRequest(`/inmates/${prisonId}/${cellId}`);

    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve cell occupancy data",
          },
        ],
      };
    }

    const occupancyText = `Cell ${cellId} occupancy in prison ${prisonId}: ${JSON.stringify(
      data,
      null,
      2
    )}`;

    return {
      content: [
        {
          type: "text",
          text: occupancyText,
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
