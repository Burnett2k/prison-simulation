"use strict";
import "dotenv/config"; // loads the .env file
import sql from "./db.js";

import express from "express";
// console.log(process.env);

var app = express();
app.use(express.json());

app.get("/inmate", async function (req, res) {
  const unassigned = req.query.unassigned === "true" || false;
  async function getAllInmates() {
    const users = await sql`
      select created_at, first_name, last_name, is_violent, is_juvenile
      from public.inmate
    `;
    return users;
  }

  async function getUnassignedInmates() {
    const unassignedPrisoners = await sql`select
      i.first_name,
      i.id,
      i.last_name,
      a.inmate_id
    from
      public.inmate i
      left outer join public.assignment a on i.id = a.inmate_id
    where
      a.inmate_id is null`;
    return unassignedPrisoners;
  }

  const inmates = unassigned
    ? await getUnassignedInmates()
    : await getAllInmates();
  res.json(inmates);
});

app.get("/inmate/:id", async function (req, res) {
  const id = req.params.id;
  async function getInmateById(id) {
    const inmate = await sql`
    select * from public.inmate
    where id = ${id}`;
    return inmate;
  }
  res.json(await getInmateById(id));
});

app.post("/inmate", async function (req, res) {
  async function addNewInmate() {
    const data = req.body; // Access the parsed JSON data
    const users = await sql`
      insert into 
        public.inmate 
        (first_name, last_name, is_violent, is_juvenile)
        values (${data.firstName}, ${data.lastName}, ${data.isViolent}, ${data.isJuvenile})
        returning first_name, last_name, is_violent, is_juvenile, id
    `;
    return users;
  }
  const result = await addNewInmate();
  res.json(result);
});

app.get("/cell/:prisonId", async function (req, res) {
  async function getAllCells() {
    const prisonId = req.params.prisonId;
    const users = await sql`
      select * from 
      public.cell c
      where c.prison_id = ${prisonId}
    `;
    return users;
  }
  const cells = await getAllCells();
  res.json(cells);
});

app.post("/cell", async function (req, res) {
  async function createCell() {
    const data = req.body;
    const cell = await sql`
      insert into public.cell
      (capacity, prison_id)
      values (${data.capacity}, ${data.prisonId})
      returning id, prison_id, capacity
    `;
    return cell;
  }
  const cell = await createCell();
  res.json(cell);
});

app.get("/prison", async function (req, res) {
  async function getAllPrisons() {
    const prisons = await sql`
      select * from 
      public.prison
    `;
    return prisons;
  }
  const prisons = await getAllPrisons();
  res.json(prisons);
});

app.get("/prison/:id/cellOccupancy", async function (req, res) {
  const id = req.params.id;
  async function getPrisonOccupancy(id) {
    const prisonData = await sql`
          SELECT 
        p.name as prison_name,
        c.id as cell_id,
        COALESCE(occupancy.occupant_count, 0) as occupant_count,
        c.capacity,
        ROUND((COALESCE(occupancy.occupant_count, 0) * 100.0) / c.capacity, 2) as occupancy_rate
    FROM public.prison p
    INNER JOIN public.cell c ON p.id = c.prison_id
    LEFT JOIN (
        SELECT cell_id, COUNT(*) as occupant_count
        FROM public.assignment 
        WHERE status = 'active' 
        GROUP BY cell_id
    ) occupancy ON c.id = occupancy.cell_id
    where p.id = ${id};
    `;
    return prisonData;
  }
  const prisonData = await getPrisonOccupancy(id);
  res.json(prisonData);
});

app.post("/officer", async function (req, res) {
  async function addNewOfficer() {
    const data = req.body; // Access the parsed JSON data
    const officer = await sql`
      insert into 
        public.officer 
        (first_name, last_name, prison_id)
        values (${data.firstName}, ${data.lastName}, ${data.prisonId})
        returning first_name, last_name, prison_id, id
    `;
    return officer;
  }
  const result = await addNewOfficer();
  res.json(result);
});

app.post("/assignment/:inmateId", async function (req, res) {
  // situations:
  // release from prison: "how do I handle that?"
  async function assignInmateToCell() {
    const data = req.body; // Access the parsed JSON data
    const inmateId = req.params.inmateId;
    const [_, newAssignment] = await sql.begin(async (sql) => {
      const [prisonerAssignment] = await sql`
      -- End current assignment if it exists
      UPDATE public.assignment 
      SET status = 'transferred', 
      ended_at = NOW()
      WHERE inmate_id = ${inmateId} AND status = 'active';`;

      const [newAssignment] = await sql`
      -- Create new assignment
      INSERT INTO public.assignment (inmate_id, cell_id, officer_id, prison_id, reason)
      VALUES (${inmateId}, ${data.cellId}, ${data.officerId}, ${data.prisonId}, ${data.reason})
      returning *;
      `;
      return [_, newAssignment];
    });
    return newAssignment;
  }
  const result = await assignInmateToCell();
  res.json(result);
});

app.post("/assignment/:inmateId/release", async function (req, res) {
  async function assignInmateToCell() {
    const inmateId = req.params.inmateId;
    const inmateAssignment = await sql`
        -- End current assignment if it exists
        UPDATE public.assignment 
        SET status = 'released', 
            ended_at = NOW(),
            reason = 'good behavior'
        WHERE inmate_id = ${inmateId} AND status = 'active';
    `;
    return inmateAssignment;
  }
  const result = await assignInmateToCell();
  res.json(result);
});

app.get("/inmate/:prisonId/:cellId", async function (req, res) {
  const prisonId = req.params.prisonId;
  const cellId = req.params.cellId;

  async function getCellOccupancy(prisonId, cellId) {
    const prisonData = await sql`
         select i.first_name, i.last_name, i.is_juvenile, i.is_violent, a.* from public.assignment a
          inner join public.inmate i on i.id = a.inmate_id
          where prison_id = ${prisonId}
          and cell_id = ${cellId}
          and status = 'active'
    `;
    return prisonData;
  }
  const prisonData = await getCellOccupancy(prisonId, cellId);
  res.json(prisonData);
});

app.listen(3000);
console.log("Express started on port 3000");
