import State from "arena_swamp3/state";
import { BodyPartConstant, CARRY, ERR_NOT_IN_RANGE, MOVE, RESOURCE_ENERGY } from "game/constants";
import { Creep, StructureContainer, StructureExtension } from "game/prototypes";
import { findClosestByPath, findClosestByRange, getObjectsByPrototype } from "game/utils";
import { CreepType } from "./types";

export default class Mule {
    static bodyTemplate: BodyPartConstant[] = [MOVE, CARRY, CARRY, MOVE, CARRY, MOVE];

    static convert(creep: Creep) {
        creep.data = {};
        creep.status = MuleJobs.Collecting;
        creep.type = CreepType.Mule;
        creep.doWork = () => Mule.work(creep);
        return creep;
    }

    static work(mule: Creep)
    {
        let state = State.Instance;

        if(!mule.id)
            return;

        switch (mule.status) {
            case MuleJobs.Delivering:
                let emptyContainers = [...getObjectsByPrototype(StructureExtension), state.mySpawn];
                let target = findClosestByPath(mule, emptyContainers);

                if (mule.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    mule.moveTo(target, state.defaultMoveOptions);
                }
                if (!mule.store.getUsedCapacity()) {
                    mule.status = MuleJobs.Collecting
                }
                break;
            case MuleJobs.Collecting:
                const container = findClosestByRange(state.mySpawn, getObjectsByPrototype(StructureContainer).filter(i => i.store.energy > 0));
                if (mule.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    mule.moveTo(container, state.defaultMoveOptions);
                }
                if (!mule.store.getFreeCapacity()) {
                    mule.status = MuleJobs.Delivering
                }
                break;
            default:
                break;
        }
    }
}

export enum MuleJobs {
    Collecting,
    Delivering
}
