#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PRIORITY = new Map([
  ["critical", 0],
  ["high", 1],
  ["medium", 2],
  ["low", 3],
  ["none", 4],
]);

export function findReady(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));

  const ready = tasks.filter((task) => {
    if (task.status !== "backlog" || task.assigned_to) return false;

    return task.relationships_out
      .filter((relationship) => relationship.type === "depends_on")
      .every((relationship) => {
        const dependency = byId.get(relationship.target_task_id);
        if (!dependency) {
          throw new Error(
            `${task.short_id} has a missing dependency: ${relationship.target_task_id}`,
          );
        }
        return dependency.status === "done";
      });
  });

  return ready.sort((left, right) => {
    const priority =
      (PRIORITY.get(left.priority) ?? 5) -
      (PRIORITY.get(right.priority) ?? 5);
    if (priority !== 0) return priority;
    return left.created_at.localeCompare(right.created_at);
  });
}

function readTasks(projectRoot) {
  const tasksDirectory = join(projectRoot, ".lattice", "tasks");
  return readdirSync(tasksDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) =>
      JSON.parse(readFileSync(join(tasksDirectory, name), "utf8")),
    );
}

function publicTask(task) {
  return {
    id: task.id,
    short_id: task.short_id,
    title: task.title,
    priority: task.priority,
    complexity: task.complexity,
    status: task.status,
  };
}

function runLattice(projectRoot, args) {
  const result = spawnSync("lattice", args, {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, LATTICE_ROOT: projectRoot },
  });

  if (result.status !== 0) {
    throw new Error(
      [result.stdout, result.stderr].filter(Boolean).join("\n").trim(),
    );
  }
}

function parseArgs(argv) {
  const values = { actor: undefined, claim: false, json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--claim") values.claim = true;
    else if (argument === "--json") values.json = true;
    else if (argument === "--actor") values.actor = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (values.claim && !values.actor?.includes(":")) {
    throw new Error("--claim requires --actor agent:<id>");
  }

  return values;
}

function emit(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const tasks = payload.ready ?? (payload.claimed ? [payload.claimed] : []);
  if (tasks.length === 0) {
    console.log("No dependency-ready backlog tasks.");
    return;
  }

  for (const task of tasks) {
    console.log(`${task.short_id}\t${task.priority}\t${task.title}`);
  }
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const projectRoot = resolve(
    process.env.LATTICE_ROOT ??
      join(dirname(fileURLToPath(import.meta.url)), ".."),
  );

  if (!options.claim) {
    emit(
      { ready: findReady(readTasks(projectRoot)).map(publicTask) },
      options.json,
    );
    return;
  }

  const lockDirectory = join(projectRoot, ".lattice", ".ready-claim.lock");
  try {
    mkdirSync(lockDirectory);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(
        "Another dependency-aware claim is in progress. Retry after it finishes.",
      );
    }
    throw error;
  }

  try {
    const task = findReady(readTasks(projectRoot))[0];
    if (!task) {
      emit({ claimed: null }, options.json);
      return;
    }

    runLattice(projectRoot, [
      "assign",
      task.short_id,
      options.actor,
      "--actor",
      options.actor,
    ]);
    runLattice(projectRoot, [
      "status",
      task.short_id,
      "in_planning",
      "--actor",
      options.actor,
    ]);

    emit(
      {
        claimed: {
          ...publicTask(task),
          assigned_to: options.actor,
          status: "in_planning",
        },
      },
      options.json,
    );
  } finally {
    rmSync(lockDirectory, { recursive: true, force: true });
  }
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
