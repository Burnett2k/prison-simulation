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

// Helper to make API requests with proper error handling
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
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error making API request:", error);
    throw error;
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
    try {
      const data = await makeRequest(`/inmates?unassigned=${unassigned}`);

      return {
        content: [
          {
            type: "text",
            text: `List of ${
              unassigned ? "unassigned" : "all"
            } inmates:\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve inmates data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
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
    try {
      // Validate that inmateId is a valid number
      const id = parseInt(inmateId);
      if (isNaN(id) || id <= 0) {
        throw new Error("Inmate ID must be a positive integer");
      }

      const data = await makeRequest(`/inmates/${id}`);

      return {
        content: [
          {
            type: "text",
            text: `Inmate details for ID ${id}:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve inmate data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Add new inmate
server.tool(
  "add-inmate",
  "Add a new inmate to the system",
  {
    firstName: z.string().min(1).describe("First name of the inmate"),
    lastName: z.string().min(1).describe("Last name of the inmate"),
    isViolent: z.boolean().describe("Whether the inmate is violent"),
    isJuvenile: z.boolean().describe("Whether the inmate is a juvenile"),
  },
  async ({ firstName, lastName, isViolent, isJuvenile }) => {
    try {
      const data = await makeRequest("/inmates", "POST", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isViolent,
        isJuvenile,
      });

      return {
        content: [
          {
            type: "text",
            text: `Inmate added successfully:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to add inmate: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
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
    try {
      const id = parseInt(prisonId);
      if (isNaN(id) || id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }

      const data = await makeRequest(`/cells/${id}`);

      return {
        content: [
          {
            type: "text",
            text: `Cells for prison ${id}:\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve cells data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Create new cell
server.tool(
  "create-cell",
  "Create a new cell in a prison",
  {
    capacity: z
      .number()
      .int()
      .min(1)
      .max(32767)
      .describe("The capacity of the cell (1-32767, stored as smallint)"),
    prisonId: z.string().describe("The ID of the prison"),
  },
  async ({ capacity, prisonId }) => {
    try {
      const id = parseInt(prisonId);
      if (isNaN(id) || id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }

      const data = await makeRequest("/cells", "POST", {
        capacity,
        prisonId: id,
      });

      return {
        content: [
          {
            type: "text",
            text: `Cell created successfully:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create cell: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get all prisons
server.tool("get-prisons", "Get a list of all prisons", {}, async () => {
  try {
    const data = await makeRequest("/prisons");

    return {
      content: [
        {
          type: "text",
          text: `List of prisons:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to retrieve prisons data: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Get prison cell occupancy
server.tool(
  "get-prison-occupancy",
  "Get cell occupancy data for a specific prison",
  {
    prisonId: z.string().describe("The ID of the prison"),
  },
  async ({ prisonId }) => {
    try {
      const id = parseInt(prisonId);
      if (isNaN(id) || id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }

      const data = await makeRequest(`/prisons/${id}/cellOccupancy`);

      return {
        content: [
          {
            type: "text",
            text: `Prison ${id} occupancy data:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve prison occupancy data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Add new officer
server.tool(
  "add-officer",
  "Add a new officer to the system",
  {
    firstName: z.string().min(1).describe("First name of the officer"),
    lastName: z.string().min(1).describe("Last name of the officer"),
    prisonId: z
      .string()
      .describe("The ID of the prison where the officer works"),
  },
  async ({ firstName, lastName, prisonId }) => {
    try {
      const id = parseInt(prisonId);
      if (isNaN(id) || id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }

      const data = await makeRequest("/officers", "POST", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        prisonId: id,
      });

      return {
        content: [
          {
            type: "text",
            text: `Officer added successfully:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to add officer: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
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
    reason: z
      .string()
      .max(50)
      .describe("The reason for the assignment (max 50 characters)"),
  },
  async ({ inmateId, cellId, officerId, prisonId, reason }) => {
    try {
      // Validate all IDs are positive integers
      const inmate_id = parseInt(inmateId);
      const cell_id = parseInt(cellId);
      const officer_id = parseInt(officerId);
      const prison_id = parseInt(prisonId);

      if (isNaN(inmate_id) || inmate_id <= 0) {
        throw new Error("Inmate ID must be a positive integer");
      }
      if (isNaN(cell_id) || cell_id <= 0) {
        throw new Error("Cell ID must be a positive integer");
      }
      if (isNaN(officer_id) || officer_id <= 0) {
        throw new Error("Officer ID must be a positive integer");
      }
      if (isNaN(prison_id) || prison_id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }

      // Validate reason length
      if (reason.length > 50) {
        throw new Error("Reason must be 50 characters or less");
      }

      const data = await makeRequest(`/assignments/${inmate_id}`, "POST", {
        cellId: cell_id,
        officerId: officer_id,
        prisonId: prison_id,
        reason: reason.trim(),
      });

      return {
        content: [
          {
            type: "text",
            text: `Inmate assigned successfully:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to assign inmate: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Release inmate
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
      .max(50)
      .optional()
      .describe(
        "The reason for release (optional, defaults to 'released', max 50 characters)"
      ),
  },
  async ({ inmateId, officerId, prisonId, reason }) => {
    try {
      // Validate all IDs are positive integers
      const inmate_id = parseInt(inmateId);
      const officer_id = parseInt(officerId);
      const prison_id = parseInt(prisonId);

      if (isNaN(inmate_id) || inmate_id <= 0) {
        throw new Error("Inmate ID must be a positive integer");
      }
      if (isNaN(officer_id) || officer_id <= 0) {
        throw new Error("Officer ID must be a positive integer");
      }
      if (isNaN(prison_id) || prison_id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }

      // Validate reason length if provided
      if (reason && reason.length > 50) {
        throw new Error("Reason must be 50 characters or less");
      }

      const data = await makeRequest(
        `/assignments/${inmate_id}/release`,
        "POST",
        {
          officerId: officer_id,
          prisonId: prison_id,
          reason: reason ? reason.trim() : undefined,
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `Inmate released successfully:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to release inmate: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
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
    try {
      const prison_id = parseInt(prisonId);
      const cell_id = parseInt(cellId);

      if (isNaN(prison_id) || prison_id <= 0) {
        throw new Error("Prison ID must be a positive integer");
      }
      if (isNaN(cell_id) || cell_id <= 0) {
        throw new Error("Cell ID must be a positive integer");
      }

      const data = await makeRequest(`/inmates/${prison_id}/${cell_id}`);

      return {
        content: [
          {
            type: "text",
            text: `Cell ${cell_id} occupancy in prison ${prison_id}:\n${JSON.stringify(
              data,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve cell occupancy data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
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
