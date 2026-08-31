import assert from "node:assert/strict";

import { findReady } from "./lattice-ready.mjs";

const task = (id, status, dependencies = [], priority = "high") => ({
  assigned_to: null,
  created_at: `2026-01-01T00:00:0${id}Z`,
  id: `task-${id}`,
  priority,
  relationships_out: dependencies.map((dependency) => ({
    target_task_id: `task-${dependency}`,
    type: "depends_on",
  })),
  short_id: `DREAM-${id}`,
  status,
  title: `Task ${id}`,
});

const initial = [
  task(7, "done"),
  task(8, "backlog", [7], "high"),
  task(9, "backlog", [8], "critical"),
  task(10, "backlog", [8, 9], "critical"),
];

assert.deepEqual(
  findReady(initial).map(({ short_id }) => short_id),
  ["DREAM-8"],
  "a higher-priority downstream task must not jump an unfinished dependency",
);

initial[1].status = "done";
assert.deepEqual(
  findReady(initial).map(({ short_id }) => short_id),
  ["DREAM-9"],
  "the next dependency layer should release after its prerequisite is done",
);

initial[2].status = "in_progress";
assert.deepEqual(
  findReady(initial).map(({ short_id }) => short_id),
  [],
  "dependents remain blocked while a prerequisite is in progress",
);

console.log("lattice-ready dependency tests passed");
