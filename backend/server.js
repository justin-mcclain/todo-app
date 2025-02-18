require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

const pool = new Pool({
	user: process.env.PG_USER,
	host: process.env.PG_HOST,
	database: process.env.PG_DATABASE,
	password: process.env.PG_PASSWORD,
	port: process.env.PG_PORT,
});

pool.connect()
	.then((client) => {
		console.log("Connected to the database successfully");
		client.release();
	})
	.catch((err) => {
		console.error("Error connecting to the database:", err.stack);
	});

app.get("/", (req, res) => {
	res.send("Server is running...");
});

app.post("/api/add-list", async (req, res) => {
	const { name } = req.body;
	try {
		const query = `INSERT INTO todo_schema."Lists" ("Name") VALUES ($1) RETURNING *`;
		const result = await pool.query(query, [name]);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error("Error inserting: ", err);
		res.status(500).json({ error: "Failed to add new list " });
	}
});

app.post("/api/edit-list", async (req, res) => {
	const { listID, editedList } = req.body;
	try {
		const query = `UPDATE todo_schema."Lists"
			SET "Name" = $2
			WHERE "ID" = $1
			RETURNING *`;
		const result = await pool.query(query, [listID, editedList]);
		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error("Error updating list:", err);
		res.status(500).json({ error: "Failed to update list" });
	}
});

app.post("/api/delete-list", async (req, res) => {
	const { listID } = req.body;
	try {
		const query = `DELETE FROM todo_schema."Lists"
		WHERE "ID" = $1
		RETURNING *
		`;
		const result = await pool.query(query, [listID]);
		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error("Error deleting list:", err);
		res.status(500).json({ error: "Failed to delete list" });
	}
});

app.get("/api/highest-task-id/:listID", async (req, res) => {
	const { listID } = req.params;
	try {
		const query = `
		SELECT MAX((task->>'taskID')::int) AS highestTaskID
		FROM todo_schema."Lists",
		LATERAL jsonb_array_elements("Tasks") AS task
		WHERE "ID" = $1;
	    `;
		const result = await pool.query(query, [listID]);
		const highestTaskID = result.rows[0].highesttaskid || 0;
		res.status(200).json({ highestTaskID });
	} catch (err) {
		console.error("Error fetching highest taskID:", err);
		res.status(500).json({ error: "Failed to fetch highest taskID" });
	}
});

app.post("/api/add-task", async (req, res) => {
	const { taskData, listID } = req.body;

	try {
		const query = `
		UPDATE todo_schema."Lists"
		SET "Tasks" = COALESCE("Tasks", '[]'::jsonb) || $1
		WHERE "ID" = $2
		RETURNING *;
	  `;

		const result = await pool.query(query, [
			JSON.stringify(taskData),
			listID,
		]);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error("Error inserting task:", err);
		res.status(500).json({ error: "Failed to add new task" });
	}
});

app.post("/api/edit-task", async (req, res) => {
	const { taskData, listID, taskID } = req.body;
	try {
		const fetchQuery = `
			SELECT "Tasks"
			FROM todo_schema."Lists"
			WHERE "ID" = $1;
		`;
		const fetchResult = await pool.query(fetchQuery, [listID]);

		if (fetchResult.rows.length === 0) {
			return res.status(404).json({ error: "List not found" });
		}

		const tasks = fetchResult.rows[0].Tasks;
		const updatedTasks = tasks.map((task) => {
			if (task.taskID === taskID) {
				return { ...task, ...taskData };
			}
			return task;
		});
		const updateQuery = `
			UPDATE todo_schema."Lists"
			SET "Tasks" = $1
			WHERE "ID" = $2
			RETURNING *;
		`;
		const updateResult = await pool.query(updateQuery, [
			JSON.stringify(updatedTasks),
			listID,
		]);

		res.status(200).json(updateResult.rows[0]);
	} catch (err) {
		console.error("Error editing task:", err);
		res.status(500).json({ error: "Failed to update task" });
	}
});

app.post("/api/delete-task", async (req, res) => {
	const { listID, taskID } = req.body;
	console.log (listID, taskID)
	try {
		const query = `
		UPDATE todo_schema."Lists"
		SET "Tasks" = (
		  SELECT jsonb_agg(task)
		  FROM jsonb_array_elements("Tasks") AS task
		  WHERE task->>'taskID' <> $1
		)
		WHERE "ID" = $2
		RETURNING *;
	  `;

		const result = await pool.query(query, [taskID.toString(), listID]);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "List not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error("Error deleting task:", err);
		res.status(500).json({ error: "Failed to delete task" });
	}
});

app.get("/api/task-lists", async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM todo_schema."Lists"');
		res.json(result.rows);
	} catch (err) {
		console.error(err);
		res.status(500).send("Error fetching data");
	}
});

app.get("/api/get-tasks/:id", async (req, res) => {
	const { id } = req.params;
	try {
		const query = `SELECT "Tasks" FROM todo_schema."Lists" WHERE "ID" = $1`;
		const result = await pool.query(query, [id]);
		const tasks = result.rows[0].Tasks;
		res.status(200).json(tasks);
	} catch (err) {
		console.error("Error fetching tasks:", err);
		res.status(500).json({ error: "Failed to fetch tasks" });
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
