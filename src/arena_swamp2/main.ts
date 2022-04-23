import { spawn } from "child_process";
import { create } from "domain";
import { findClosestByPath, findClosestByRange, findInRange, getRange } from "game";
import { ATTACK, CARRY, ERR_NOT_IN_RANGE, HEAL, MOVE, OK, RANGED_ATTACK, RESOURCE_ENERGY, TERRAIN_WALL, TOUGH, WORK } from "game/constants";
import { CostMatrix, MoveToOpts, searchPath } from "game/path-finder";
import { ConstructionSite, Creep, RoomPosition, Structure, StructureContainer, StructureRampart, StructureSpawn } from "game/prototypes";
import { createConstructionSite, findPath, getDistance, getObjectsByPrototype, getTerrainAt, getTicks } from "game/utils";

enum AttackStatus {
    Idle,
    Defending,
    Retaliate
}

enum CreepType {
    None,
    Bait,
    Army,
    Mule,
    Guardian
}

enum MuleJobs {
    Collecting,
    Delivering
}

let mySpawn: StructureSpawn;
let enemySpawn: StructureSpawn;
let myRamps: Structure[];
let myConstructionSites: ConstructionSite[];
let allCreeps: Creep[] = [];
let enemyCreeps: Creep[] = [];
let myCreeps: Creep[] = [];

let avoidanceMatrix: CostMatrix;
let defaultMoveOptions: MoveToOpts;

let rampsComplete: boolean = false;

export function loop(): void {

    mySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => i.my);
    enemySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    myRamps = getObjectsByPrototype(StructureRampart).filter(i => i.my);
    myConstructionSites = getObjectsByPrototype(ConstructionSite).filter(i => i.my);
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
    createMule() || createBait() || createGuardian() || createArmy();
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

    let baiter = <Creep>mySpawn.spawnCreep([RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL]).object;

    if (baiter) {
        baiter.type = CreepType.Bait;
        baiter.data = { corner: 0 };
        myCreeps.push(baiter);
        console.log("Spawned Baiter")
    }

    return true;
}


function createGuardian(): boolean {
    if (findMyCreep(CreepType.Guardian))
        return false;

    let guardian = <Creep>mySpawn.spawnCreep([WORK, MOVE, CARRY, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK]).object;

    if (guardian) {
        guardian.type = CreepType.Guardian;
        myCreeps.push(guardian);
        console.log("Spawned Guardian")
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
    orderGuardians();
    orderArmy();
}

function orderMules() {
    let mule = findMyCreep(CreepType.Mule);

    if (!mule || !mule.store)
        return;

    switch (mule.status) {
        case MuleJobs.Delivering:
            let target = !rampsComplete && findMyCreep(CreepType.Guardian) ? findMyCreep(CreepType.Guardian) : mySpawn;
            if (mule.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                mule.moveTo(target, defaultMoveOptions);
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
    if (getRange(baiter, centerCorners[baiter.data.corner]) < range + 1)
        baiter.data.corner = baiter.data.corner < 4 ? baiter.data.corner + 1 : 1;

    baiter.moveTo(centerCorners[baiter.data.corner], { ...defaultMoveOptions, range: range });
    baiter.rangedAttack(findClosestByRange(baiter, enemyCreeps));
}


function orderGuardians() {
    let guardian = findMyCreep(CreepType.Guardian);
    if (!guardian)
        return;

    let mySpawnRamp = myRamps.find(ramp => ramp.x == mySpawn.x && ramp.y == mySpawn.y);
    let defenderRamp = myRamps.find(ramp => ramp.x == mySpawn.x + 1 && ramp.y == mySpawn.y);

    if (mySpawnRamp && defenderRamp)
        rampsComplete = true;

    if (!mySpawnRamp) {
        let targetBuild = findClosestByRange(mySpawn, myConstructionSites)

        if (!targetBuild)
            targetBuild = <ConstructionSite>createConstructionSite(mySpawn, StructureRampart).object;

        guardian.build(targetBuild);
    }
    else if (!defenderRamp) {
        let targetBuild = findClosestByRange({ x: mySpawn.x + 1, y: mySpawn.y }, myConstructionSites)

        if (!targetBuild)
            targetBuild = <ConstructionSite>createConstructionSite({ x: mySpawn.x + 1, y: mySpawn.y }, StructureRampart).object;

        guardian.moveTo(targetBuild);
        guardian.build(targetBuild);
    }

    if (rampsComplete) {
        if (guardian.store.energy)
            guardian.transfer(mySpawn, RESOURCE_ENERGY);

        let enemy = findInRange(guardian, enemyCreeps, 3).sort((a, b) => a.hits - b.hits)[0];
        guardian.rangedAttack(enemy);
    }
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
        for (let x = enemy.x - avoidanceRange; x <= enemy.x + avoidanceRange; x++)
            for (let y = enemy.y - avoidanceRange; y <= enemy.y + avoidanceRange; y++) {
                let isWall = getTerrainAt({ x, y }) === TERRAIN_WALL;
                matrix.set(x, y, isWall ? 255 : 20);
            }
    });

    allCreeps.forEach(creep => {
        matrix.set(creep.x, creep.y, 255)
    });

    myRamps.forEach(ramp => {
        matrix.set(ramp.x, ramp.y, 255)
    });

    return matrix;
}

function getMyCreeps(type: CreepType): Creep[] {
    return myCreeps.filter(x => x.type == type);
}

function findMyCreep(type: CreepType): Creep {
    return getMyCreeps(type)[0];
}


