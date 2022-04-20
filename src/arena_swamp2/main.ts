import { spawn } from "child_process";
import { create } from "domain";
import { findClosestByPath, findClosestByRange, findInRange, getRange } from "game";
import { ATTACK, CARRY, ERR_NOT_IN_RANGE, HEAL, MOVE, OK, RANGED_ATTACK, RESOURCE_ENERGY, TERRAIN_WALL, TOUGH } from "game/constants";
import { CostMatrix, searchPath } from "game/path-finder";
import { Creep, RoomPosition, Structure, StructureContainer, StructureSpawn } from "game/prototypes";
import { findPath, getDistance, getObjectsByPrototype, getTerrainAt, getTicks } from "game/utils";

enum AttackStatus {
    Idle,
    Defending,
    Retaliate
}

enum CreepType {
    None,
    Bait,
    Army
}

let mySpawn: StructureSpawn;
let enemySpawn: StructureSpawn;
let allCreeps: Creep[] = [];
let enemyCreeps: Creep[] = [];
let myCreeps: Creep[] = [];

let avoidanceMatrix: CostMatrix;


export function loop(): void {
    mySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => i.my);
    enemySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    allCreeps = getObjectsByPrototype(Creep);
    enemyCreeps = allCreeps.filter(i => !i.my);
    myCreeps = myCreeps.filter(x => x?.exists);

    //console.log(myCreeps);

    avoidanceMatrix = getAvoidanceMatrix();

    if (mySpawn) {
        spawning();
        giveorders();
    }
}

function spawning() {
    createBait() || createArmy();
}

function createBait() {
    let baiters = getMyCreeps(CreepType.Bait);
    if (baiters.length)
        return false;

    let baiter = <Creep>mySpawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL]).object;

    if (baiter) {
        baiter.type = CreepType.Bait;
        baiter.data = { corner: 0 };
        myCreeps.push(baiter);
        console.log("Spawned Baiter")
    }

    return true;
}


function createArmy() {
    let army = getMyCreeps(CreepType.Army);
    if (army.length)
        return false;

    let soldier = <Creep>mySpawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK]).object;

    if (soldier) {
        soldier.type = CreepType.Army;
        myCreeps.push(soldier);
        console.log("Spawned Soldier")
    }

    return true;
}


function giveorders() {
    orderBaiters();
    orderArmy();
}

function orderBaiters() {
    let baiter = findMyCreep(CreepType.Bait);
    if (!baiter)
        return;

    let centerCorners = [{ x: 30, y: 35 }, { x: 70, y: 35 }, { x: 70, y: 65 }, { x: 30, y: 65 }]
    baiter.heal(baiter);
    if (getRange(baiter, centerCorners[baiter.data.corner]) < 4)
        baiter.data.corner = baiter.data.corner < 3 ? baiter.data.corner + 1 : 0;
    baiter.moveTo(centerCorners[baiter.data.corner], { swampCost: 1, plainCost: 2, costMatrix: avoidanceMatrix });
}

function orderArmy() {
    let soldier = findMyCreep(CreepType.Army);
    if (!soldier)
        return;

    if (soldier.attack(enemySpawn) == ERR_NOT_IN_RANGE)
        soldier.moveTo(enemySpawn, { swampCost: 1, plainCost: 2, costMatrix: avoidanceMatrix });
}

function getAvoidanceMatrix() {
    var matrix = new CostMatrix();

    enemyCreeps.forEach(enemy => {
        let avoidanceRange = enemy.body.some(y => y.type == RANGED_ATTACK) ? 6 : enemy.body.some(y => y.type == ATTACK) ? 3 : 0;
        for (let x = enemy.x - avoidanceRange; x < enemy.x + avoidanceRange; x++)
            for (let y = enemy.y - avoidanceRange; y < enemy.y + avoidanceRange; y++) {
                let isWall = getTerrainAt({ x, y }) === TERRAIN_WALL;
                matrix.set(x, y, isWall ? 255 : 20);
            }
    });

    allCreeps.forEach(creep => {
        matrix.set(creep.x, creep.y, 255)
    });

    return matrix;
}

function getMyCreeps(type: CreepType): Creep[] {
    return myCreeps.filter(x => x.type == type);
}

function findMyCreep(type: CreepType): Creep {
    return getMyCreeps(type)[0];
}

