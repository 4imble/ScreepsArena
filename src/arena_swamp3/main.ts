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
import Builder from "./creeps/builder";
import Mule from "./creeps/mule";
import { CreepType } from "./creeps/types";
import State from "./state";

enum AttackStatus {
    Idle,
    Defending,
    Retaliate
}

let state: State = State.Instance;

export function loop(): void {
    state.calculate();

    if (state.mySpawn) {
        spawning();
        giveorders();
    }
}

function spawning() {
    createMule() || createBuilder();
}

function createMule() {
    let creeps = state.getMyCreeps(CreepType.Mule);
    if (creeps.length)
        return false;

    let creep = <Creep>state.mySpawn.spawnCreep(Mule.bodyTemplate).object;
    if(creep)
        state.myCreeps.push(Mule.convert(creep));
    return true;
}

function createBuilder() {
    let creeps = state.getMyCreeps(CreepType.Builder);
    if (creeps.length)
        return false;

    let creep = <Creep>state.mySpawn.spawnCreep(Builder.bodyTemplate).object;
    if(creep)
        state.myCreeps.push(Builder.convert(creep));
    return true;
}


function giveorders() {
    state.myCreeps.forEach(myCreep => {
        myCreep.doWork();
    });
}
