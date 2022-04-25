import { spawn } from "child_process";
import { Worker } from "cluster";
import { Console } from "console";
import exp from "constants";
import { create } from "domain";
import { findClosestByPath, findClosestByRange, findInRange, getRange } from "game";
import { ATTACK, CARRY, ERR_NOT_IN_RANGE, HEAL, MOVE, OK, RANGED_ATTACK, RESOURCE_ENERGY, TERRAIN_WALL, TOUGH, WORK } from "game/constants";
import { CostMatrix, MoveToOpts, searchPath } from "game/path-finder";
import { ConstructionSite, Creep, RoomPosition, Structure, StructureContainer, StructureExtension, StructureRampart, StructureSpawn, StructureTower } from "game/prototypes";
import { createConstructionSite, findPath, getDistance, getObjectsByPrototype, getTerrainAt, getTicks } from "game/utils";
import ArrayTools from "helpers/array-tools";
import { RangeTools } from "helpers/range-tools";
import { SpawnTools } from "helpers/spawn-tools";
import Builder from "./creeps/builder";
import Mule from "./creeps/mule";
import { CreepType, MyCreep } from "./creeps/types";
import State from "./state";

enum AttackStatus {
    Idle,
    Defending,
    Retaliate
}

let state: State = State.Instance;
let spawnTools: SpawnTools = new SpawnTools(state.mySpawn);

export function loop(): void {
    state.calculate();
    spawnTools.spawn();
    giveorders();
}

function giveorders() {
    state.myCreeps.forEach(myCreep => {
        myCreep.doWork();
    });
}
