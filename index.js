"use strict";
import "dotenv/config"; // loads the .env file
import sql from "./db.js";

import express from "express";
// console.log(process.env);

var app = express();
app.use(express.json());

app.get("/inmate", async function (req, res) {
  async function getAllInmates() {
    const users = await sql`
      select created_at, first_name, last_name, is_violent, is_juvenile
      from public.inmate
    `;
    // users = Result [{ name: "Walter", age: 80 }, { name: 'Murray', age: 68 }, ...]
    return users;
  }
  const inmates = await getAllInmates();
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

app.listen(3000);
console.log("Express started on port 3000");
