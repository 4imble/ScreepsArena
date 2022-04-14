import { spawn } from "child_process";
import { findClosestByPath, findClosestByRange, findInRange, getRange } from "game";
import { ATTACK, CARRY, ERR_NOT_IN_RANGE, HEAL, MOVE, OK, RANGED_ATTACK, RESOURCE_ENERGY, TOUGH } from "game/constants";
import { Creep, RoomPosition, Structure, StructureContainer, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype, getTicks } from "game/utils";

enum AttackStatus {
  Idle,
  Defending,
  Retaliate
}

let triggerRange = 16;
let goTime = 1406;

let mules: Array<Creep | undefined> = [];
let army: Array<Creep | undefined> = [];
let turtles: Array<Creep | undefined> = [];
let healers: Array<Creep | undefined> = [];
let attack_status: AttackStatus = AttackStatus.Idle;
let focus: Creep | null;

export function loop(): void {
  const mySpawn = getObjectsByPrototype(StructureSpawn).find(i => i.my);

  if (mySpawn) {

    // Spawning
    mules = mules.filter(x => x?.exists);
    turtles = turtles.filter(x => x?.exists);
    army = army.filter(x => x?.exists);
    healers = healers.filter(x => x?.exists);
    focus = !focus?.exists ? null : focus;

    if (mules.length < 3) {
      let mule = mySpawn.spawnCreep([MOVE, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]).object;
      if (mule)
        mules.push(mule);
    }
    else if (attack_status != AttackStatus.Retaliate && healers.length < 3) {
      let healer = mySpawn.spawnCreep([TOUGH, MOVE, HEAL, MOVE, HEAL, MOVE]).object;
      if (healer)
        healers.push(healer);
    }

    else if (attack_status != AttackStatus.Retaliate && army.length < 12) {
      let unit = mySpawn.spawnCreep([TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE]).object;
      if (unit)
        army.push(unit);
    }
    else {
      let carryTurtle = turtles.find(x => x?.body != undefined && x?.body.some(y => y.type == CARRY));
      console.log(carryTurtle);
      let turtle = carryTurtle ? mySpawn.spawnCreep([TOUGH, TOUGH]).object : mySpawn.spawnCreep([CARRY]).object;
      if (turtle)
        turtles.push(turtle);
    }

    // Farming

    if (mules.length) {
      const container = findClosestByRange(mySpawn, getObjectsByPrototype(StructureContainer).filter(i => i.store.energy > 0))
      if (container) {
        let carryTurtle = turtles.find(x => x?.body != undefined && x?.body.some(y => y.type == CARRY));

        mules.forEach(mule => {
          if (mule) {
            let threats = findInRange(mule, getObjectsByPrototype(Creep).filter(x => !x.my), 5);
            if(threats.length)
            {
              let nearestThreat = findClosestByRange(mule, threats);
              moveAway(mule, nearestThreat);
            }
            else if (mule.store?.energy && getRange(mule, container) > 1 || !mule.store?.getFreeCapacity()) {
              let drop = carryTurtle ? carryTurtle : mySpawn;
              if (mule.transfer(drop, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                mule.moveTo(drop);
              }
            }
            else {
              if (mule.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                mule.moveTo(container);
              }
            }
          }
        });

        carryTurtle?.transfer(mySpawn, RESOURCE_ENERGY);
        turtles.forEach(turtle => {
          let threats = findInRange(<Creep>turtle, getObjectsByPrototype(Creep).filter(x => !x.my), 5);
          turtle?.rangedAttack(findClosestByRange(turtle, threats));
        })
      }
    }

    // Healers
    let allies = [...army, ...healers];
    let injuredAllies = <Creep[]>allies.filter(x => x != undefined && x.hits < x.hitsMax);

    if (healers.length && attack_status == AttackStatus.Idle && injuredAllies.length == 0) {
      let i = 0;
      healers.forEach(healer => {
        let ymod = i % 2 == 0 ? 2 : -2;
        healer?.moveTo({ x: mySpawn.x, y: mySpawn.y + ymod });
        i++;
      });
    }
    else if (attack_status == AttackStatus.Retaliate && injuredAllies.length == 0) {
      healers.forEach(healer => {
        let safest = findClosestByRange(mySpawn, <Creep[]>army);
        healer?.moveTo(safest)
      })
    }
    else {
      if (healers.length) {
        healers.forEach(healer => {
          doHealing(healer, injuredAllies);
        });
      }
    }


    //Army

    // Guard
    if (army.length && attack_status == AttackStatus.Idle) {
      let i = 0;
      army.forEach(unit => {
        let ymod = i % 2 == 0 ? 3 : -3;
        unit?.moveTo({ x: mySpawn.x, y: mySpawn.y + ymod });
        i++;
      });
    }

    //Calc status
    let close_invaders = findInRange(mySpawn, getObjectsByPrototype(Creep).filter(x => !x.my), triggerRange);
    if (attack_status != AttackStatus.Retaliate)
      attack_status = close_invaders.length || focus != null ? AttackStatus.Defending : AttackStatus.Idle;

    if (getTicks() > goTime && attack_status != AttackStatus.Retaliate)
      attack_status = AttackStatus.Retaliate;

    // Defending
    if (army.length && attack_status == AttackStatus.Defending) {
      let target = findClosestByRange(mySpawn, close_invaders);

      if (focus == null) {
        focus = target;
      }

      army.forEach(unit => {
        doRangedCombat(unit, <Creep>focus);
      });

      //todo check body for fighters
      let enemy_attackers = getObjectsByPrototype(Creep).filter(x => !x.my && (x.body.some(x => x.type == ATTACK || x.type == RANGED_ATTACK)));
      if (enemy_attackers.length = 0 && army.length > 8)
        attack_status = AttackStatus.Retaliate;
    }

    const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my);
    if (attack_status == AttackStatus.Retaliate) {
      army.forEach(unit => {
        if (unit != null) {
          let enemy = findClosestByRange(unit, getObjectsByPrototype(Creep).filter(x => !x.my));
          let enemy_attackers = getObjectsByPrototype(Creep).filter(x => !x.my && (x.body.some(x => x.type == ATTACK || x.type == RANGED_ATTACK)));
          if (enemySpawn != null) {
            if (unit.getRangeTo(enemySpawn) > 12 || enemy_attackers.length) {
              // if (unit.rangedAttack(enemy) == ERR_NOT_IN_RANGE) {
              //   unit.moveTo(enemySpawn);
              // }
              doRangedCombat(unit, enemySpawn);
            }
            else if (unit.rangedAttack(enemySpawn) == ERR_NOT_IN_RANGE) {
              //rush
              unit.moveTo(enemySpawn)
            }
          }
        }
      });
    }
  }
}

function doRangedCombat(unit: Creep | undefined, target: Creep | Structure) {
  if (unit == null)
    return;

  let threats = findInRange(unit, getObjectsByPrototype(Creep).filter(x => !x.my), 2);
  let targets = findInRange(unit, getObjectsByPrototype(Creep).filter(x => !x.my), 3);
  let threat = findClosestByRange(unit, targets);
  // let targetIsMelee = target.exists && (target instanceof Creep) && (<Creep>target).body.some(x => x.type == ATTACK);
  let threatIsMelee = threat && threat.body.some(x => x.type == ATTACK);

  if (threats.length && threatIsMelee) {
    console.log("evading");
    moveAway(unit, threat);
  }
  else if (targets.length) {
    let massValid = threats.length > 1;
    massValid ? unit.rangedMassAttack() : unit.rangedAttack(threat);
    console.log(massValid ? "MASS ATTACK!" : "Attack");
  }
  else {
    unit.moveTo(target);
  }
}

function moveAway(unit: Creep, threat: Creep) {
  unit.moveTo({ x: unit.x + (unit.x - threat.x), y: unit.y + (unit.y - threat.y) });
}

function doHealing(unit: Creep | undefined, injuredAllies: Creep[]) {
  if (unit == undefined)
    return;

  let mostInjured = injuredAllies.sort((a, b) => a.hits - b.hits)[0];

  if (unit.hits < unit.hitsMax) {
    console.log("healing self");
    unit.heal(unit);
  }
  else if (injuredAllies.length) {
    console.log("heal other");
    if (unit.heal(mostInjured) == ERR_NOT_IN_RANGE)
      unit.rangedHeal(mostInjured) == ERR_NOT_IN_RANGE

    unit.moveTo(mostInjured);
  }
}

