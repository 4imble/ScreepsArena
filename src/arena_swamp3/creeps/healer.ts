import State from "arena_swamp3/state";
import { ATTACK, BodyPartConstant, ERR_NOT_IN_RANGE, HEAL, MOVE } from "game/constants";
import { Creep } from "game/prototypes";
import { findClosestByPath, findInRange } from "game/utils";
import { CreepType } from "./types";

export default class Healer {
    static bodyTemplate: BodyPartConstant[] = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL];

    static convert(creep: Creep) {
        creep.data = {};
        creep.type = CreepType.Healer;
        creep.doWork = () => Healer.work(creep);
        return creep;
    }

    static work(healer: Creep) {
        let state = State.Instance;

        if (!healer.id)
            return;

        let center = { x: 50, y: 50 };
        let guardian = state.findMyCreep(CreepType.Guardian);
        let target = guardian || center;

        let injuredAllies = state.myCreeps.filter(x => x.hits < x.hitsMax);

        let wounded = findInRange(target, injuredAllies, 8);

        if (wounded.length) {
            let closest = <Creep>findClosestByPath(healer, wounded);
            if (healer.heal(closest) == ERR_NOT_IN_RANGE) {
                healer.moveTo(closest, {swampCost: 2, plainCost: 2});
            }
        }
        else {
            healer.moveTo(target, state.defaultMoveOptions);
        }
    }
}
