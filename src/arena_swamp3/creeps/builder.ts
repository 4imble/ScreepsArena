import State from "arena_swamp3/state";
import { stat } from "fs";
import { getRange } from "game";
import { BodyPartConstant, CARRY, ERR_NOT_IN_RANGE, MOVE, RESOURCE_ENERGY, WORK } from "game/constants";
import { ConstructionSite, Creep, Id, StructureContainer, StructureExtension } from "game/prototypes";
import { createConstructionSite, findClosestByPath, findClosestByRange, findInRange, getObjectsByPrototype } from "game/utils";
import ArrayTools from "helpers/array-tools";
import { RangeTools } from "helpers/range-tools";
import { CreepType } from "./types";

export default class Builder {
    static bodyTemplate: BodyPartConstant[] = [MOVE, MOVE, MOVE, MOVE, MOVE, WORK, CARRY];

    static convert(creep: Creep) {
        creep.type = CreepType.Builder;
        creep.status = BuilderJobs.Collecting;
        creep.data = {};
        creep.doWork = () => Builder.work(creep);
        return creep;
    }


    static work(builder: Creep) {
        let state = State.Instance;

        if (!builder.id)
            return;

        let currentAllocations: Id<StructureContainer>[] = state.getMyCreeps(CreepType.Builder).map(x => x.data.container?.id).filter(x => x);

        console.log("allocations", currentAllocations)

        let bestContainers = state.allContainers
            .filter(x => x.id.startsWith("a"))
            .filter(x => x.store.energy)
            .filter(x => !currentAllocations.some(c => c == x.id))
            .map((cont: StructureContainer) => ({ container: cont, value: (cont.ticksToDecay ?? 0) - getRange(builder, cont) }))
            .sort((a, b) => a.value - b.value).reverse()
            .map(x => x.container);

        if (!builder.data.container?.store?.energy) {
            builder.data.container = bestContainers[0];
            builder.data.ext = null;
            builder.data.site = null;
            builder.status = BuilderJobs.Collecting;
        }

        switch (builder.status) {
            case BuilderJobs.Collecting:
                if (builder.store.getFreeCapacity() != 0) {
                    if (builder.withdraw(builder.data.container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        builder.drop(RESOURCE_ENERGY);
                        builder.moveTo(builder.data.container, state.defaultMoveOptions);
                    }
                }
                else {
                    builder.status = BuilderJobs.Building;
                }
                break;
            case BuilderJobs.Building:
                if (getRange(builder, builder.data.container) > 1) {
                    builder.drop(RESOURCE_ENERGY);
                    builder.moveTo(builder.data.container, state.defaultMoveOptions);
                }
                else if (!builder.store.energy) {
                    builder.status = BuilderJobs.Collecting;
                }
                else if (builder.data.ext) {
                    builder.transfer(builder.data.ext, RESOURCE_ENERGY);
                }
                else if (!builder.data.site) {
                    let locations = ArrayTools.intersectRanges(RangeTools.getAvailableAdjacentSpaces(builder), RangeTools.getAvailableAdjacentSpaces(builder.data.container));
                    builder.data.site = createConstructionSite(locations[0], StructureExtension).object;
                }
                else {
                    let constructionSite = <ConstructionSite>builder.data.site;
                    builder.build(constructionSite);
                    if (constructionSite.structure.id) {
                        builder.data.ext = constructionSite.structure;
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
