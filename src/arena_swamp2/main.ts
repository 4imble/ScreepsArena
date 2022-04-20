import { spawn } from "child_process";
import { create } from "domain";
import { findClosestByPath, findClosestByRange, findInRange, getRange } from "game";
import { ATTACK, CARRY, ERR_NOT_IN_RANGE, HEAL, MOVE, OK, RANGED_ATTACK, RESOURCE_ENERGY, TERRAIN_WALL, TOUGH } from "game/constants";
import { CostMatrix, MoveToOpts, searchPath } from "game/path-finder";
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
    Army,
    Mule
}

enum MuleJobs {
    Collecting,
    Delivering
}

let mySpawn: StructureSpawn;
let enemySpawn: StructureSpawn;
let allCreeps: Creep[] = [];
let enemyCreeps: Creep[] = [];
let myCreeps: Creep[] = [];

let avoidanceMatrix: CostMatrix;
let defaultMoveOptions: MoveToOpts;

export function loop(): void {

    mySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => i.my);
    enemySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    allCreeps = getObjectsByPrototype(Creep);
    enemyCreeps = allCreeps.filter(i => !i.my);
    myCreeps = myCreeps.filter(x => x?.exists);

    //console.log(myCreeps);

    avoidanceMatrix = getAvoidanceMatrix();
    defaultMoveOptions = { swampCost: 1, plainCost: 2, costMatrix: avoidanceMatrix }

    if (mySpawn) {
        spawning();
        giveorders();
    }
}

function spawning() {
    createMule() || createBait() || createArmy();
}

function createMule() {
    let mules = getMyCreeps(CreepType.Mule);
    if (mules.length)
        return false;

    let mule = <Creep>mySpawn.spawnCreep([MOVE, CARRY, CARRY, MOVE, CARRY, MOVE]).object;

    if (mule) {
        mule.type = CreepType.Mule;
        mule.data = {};
        mule.status = MuleJobs.Collecting;
        myCreeps.push(mule);
        console.log("Spawned Mule")
    }

    return true;
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
    let soldier = <Creep>mySpawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK]).object;

    if (soldier) {
        soldier.type = CreepType.Army;
        myCreeps.push(soldier);
        console.log("Spawned Soldier")
    }

    return true;
}

function giveorders() {
    orderMules();
    orderBaiters();
    orderArmy();
}

function orderMules() {
    let mule = findMyCreep(CreepType.Mule);

    if (!mule || !mule.store)
        return;

    switch (mule.status) {
        case MuleJobs.Delivering:
            if (mule.transfer(mySpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                mule.moveTo(mySpawn, defaultMoveOptions);
            }
            if (!mule.store.getUsedCapacity()) {
                mule.status = MuleJobs.Collecting
            }
            break;
        case MuleJobs.Collecting:
            const container = findClosestByRange(mySpawn, getObjectsByPrototype(StructureContainer).filter(i => i.store.energy > 0));
            if (mule.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                mule.moveTo(container, defaultMoveOptions);
            }
            if (!mule.store.getFreeCapacity()) {
                mule.status = MuleJobs.Delivering
            }
            break;
        default:
            break;
    }
}

function orderBaiters() {
    let baiter = findMyCreep(CreepType.Bait);
    if (!baiter)
        return;

    let centerCorners = [enemySpawn, { x: 30, y: 35 }, { x: 70, y: 35 }, { x: 70, y: 65 }, { x: 30, y: 65 }]
    baiter.heal(baiter);
    let range = baiter.data.corner == 0 ? 12 : 3;
    if (getRange(baiter, centerCorners[baiter.data.corner]) < range+1)
        baiter.data.corner = baiter.data.corner < 4 ? baiter.data.corner + 1 : 1;
    baiter.moveTo(centerCorners[baiter.data.corner], { ...defaultMoveOptions, range: range });
}

function orderArmy() {
    let army = getMyCreeps(CreepType.Army);
    army.forEach(soldier => {
        if (!soldier)
            return;

        if (soldier.attack(enemySpawn) == ERR_NOT_IN_RANGE)
            soldier.moveTo(enemySpawn, defaultMoveOptions);
    })
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

