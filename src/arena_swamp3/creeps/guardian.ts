import State from "arena_swamp3/state";
import { ATTACK, BodyPartConstant, CARRY, ERR_NOT_IN_RANGE, MOVE, RESOURCE_ENERGY } from "game/constants";
import { Creep, StructureContainer, StructureExtension } from "game/prototypes";
import { findClosestByPath, findClosestByRange, findInRange, getObjectsByPrototype } from "game/utils";
import { CreepType } from "./types";

export default class Guardian {
    static bodyTemplate: BodyPartConstant[] = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK];

    static convert(creep: Creep) {
        creep.data = {};
        creep.type = CreepType.Guardian;
        creep.doWork = () => Guardian.work(creep);
        return creep;
    }

    static work(guardian: Creep) {
        let state = State.Instance;

        if (!guardian.id)
            return;

        let center = { x: 50, y: 50 };

        let enemiesInRange = findInRange(center, state.enemyCreeps, 8);

        if (enemiesInRange.length) {
            let closest = <Creep>findClosestByPath(guardian, enemiesInRange);
            if (guardian.attack(closest) == ERR_NOT_IN_RANGE) {
                guardian.moveTo(closest, {swampCost: 2, plainCost: 2});
            }
        }
        else {
            guardian.moveTo(center, state.defaultMoveOptions);
        }
    }
}
