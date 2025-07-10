# Prison Simulation

🚧 Work in Progress 🚧

This repository will contain an experiment to build out a straightforward database model and api for managing a system of prisons. The prison system needs to be able to:

- Create prisons
- Add cells to the prisons
- Add officers to prisons
- Add Inmates
- Assign Inmates to a cell
- Get a prison-wide occupancy report
- Get a list of current inmates for a prison

Once this api is in place, it will be converted to an Model Context Protocol server.

The eventual goal is to provide an AI with access to this MCP server and have it run a simulation where it manages the prison system. Of course, this could be any other arbitrary booking system like a hotel or whatever, so there's nothing necessarily political in nature happening here.

Guidelines:

- Build the application without aid from AI tools like Claude.
- Googling is acceptable (as it should be)
- End work with something useful, rather than struggling with a grand design.

Phase 1:

- Build out the initial data model ✅
- Build out the underlying apis ✅
- Write up server.tool() calls to explain how to use the tools. This seems like a lot of code, but I'll do it if I have to. Would be nice if it just used an api spec or something.

Phase 2:

- Convert the API to be an MCP server
- Connect the MCP server to Claude AI

Phase 3:

- Come up with scenario or idea for how to get the AI to interact with the APIs

Phase 4:

- Gamification. Consider adding in random events or some other factor that would cause the system to require maintenance and work from the ai
