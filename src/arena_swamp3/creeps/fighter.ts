import State from "arena_swamp3/state";
import { ATTACK, BodyPartConstant, ERR_NOT_IN_RANGE, MOVE } from "game/constants";
import { Creep } from "game/prototypes";
import { findInRange } from "game/utils";
import { CreepType } from "./types";

export default class Fighter {
    static bodyTemplate: BodyPartConstant[] = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK];

    static convert(creep: Creep) {
        creep.data = {};
        creep.status = FighterJobs.WaitingAllies;
        creep.type = CreepType.Fighter;
        creep.doWork = () => Fighter.work(creep);
        return creep;
    }

    static work(fighter: Creep) {
        let state = State.Instance;

        if (!fighter.id)
            return;

        const GROUP_COUNT = 3;

        let spawnWait = { x: state.mySpawn.x, y: state.mySpawn.y + 11 };

        let allies = findInRange(spawnWait, state.myCreeps, 4);
        let threats = findInRange(spawnWait, state.enemyCreeps, 6).sort(x => x.hitsMax);

        if (allies.length >= GROUP_COUNT)
            fighter.status = FighterJobs.Attacking;

        switch (fighter.status) {
            case FighterJobs.WaitingAllies:
                if (threats.length) {
                    if (fighter.attack(threats[0]) == ERR_NOT_IN_RANGE) {
                        fighter.moveTo(threats[0], state.defaultMoveOptions);
                    }
                }
                else {
                    fighter.moveTo(spawnWait, state.defaultMoveOptions);
                }
                break;
            case FighterJobs.Attacking:
                if (fighter.attack(state.enemySpawn) == ERR_NOT_IN_RANGE) {
                    fighter.moveTo(state.enemySpawn, state.defaultMoveOptions);
                }
                break;
            default:
                break;
        }
    }
}

enum FighterJobs {
    WaitingAllies,
    Attacking
}
