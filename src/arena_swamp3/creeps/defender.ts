import State from "arena_swamp3/state";
import { getRange } from "game";
import { BodyPartConstant, CARRY, ERR_NOT_IN_RANGE, MOVE, RESOURCE_ENERGY, WORK } from "game/constants";
import { ConstructionSite, Creep, StructureRampart } from "game/prototypes";
import { createConstructionSite, findClosestByPath } from "game/utils";
import Builder from "./builder";
import { CreepType } from "./types";

export default class Defender {
    static bodyTemplate: BodyPartConstant[] = [MOVE, MOVE, MOVE, MOVE, MOVE, WORK, CARRY];

    static convert(creep: Creep) {
        creep.type = CreepType.Defender;
        creep.status = BuilderJobs.Collecting;
        creep.data = {};
        creep.doWork = () => Defender.work(creep);
        return creep;
    }

    static work(defender: Creep) {
        let state = State.Instance;

        if (!defender.id)
            return;

        let container = findClosestByPath(defender, state.allContainers);

        switch (defender.status) {
            case BuilderJobs.Collecting:
                if (defender.store.getFreeCapacity() != 0) {
                    if (defender.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        defender.drop(RESOURCE_ENERGY);
                        defender.moveTo(container, state.defaultMoveOptions);
                    }
                }
                else {
                    defender.status = BuilderJobs.Building;
                }
                break;
            case BuilderJobs.Building:
                if (getRange(defender, container) > 1) {
                    defender.drop(RESOURCE_ENERGY);
                    defender.moveTo(container, state.defaultMoveOptions);
                }
                else if (!defender.store.energy) {
                    defender.status = BuilderJobs.Collecting;
                }
                else if (!defender.data.site) {
                    defender.data.site = createConstructionSite(state.mySpawn, StructureRampart).object;
                }
                else {
                    let constructionSite = <ConstructionSite>defender.data.site;
                    defender.build(constructionSite);
                    if (constructionSite.structure.id) {
                        Builder.convert(defender);
                    }
                }
            default:
                break;
        }
    }
}


enum BuilderJobs {
    Collecting,
    Building
}
