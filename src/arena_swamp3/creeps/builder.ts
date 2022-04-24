import State from "arena_swamp3/state";
import { stat } from "fs";
import { BodyPartConstant, CARRY, ERR_NOT_IN_RANGE, MOVE, RESOURCE_ENERGY, WORK } from "game/constants";
import { ConstructionSite, Creep, StructureContainer, StructureExtension } from "game/prototypes";
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

        let container = state.allContainers.sort((a, b) => (a.ticksToDecay ?? 0) - (b.ticksToDecay ?? 0)).reverse()[0];

        switch (builder.status) {
            case BuilderJobs.Collecting:
                let targetContainer = builder.data.container || container;
                if (!targetContainer)
                    break;
                if (builder.getRangeTo(targetContainer) > 1)
                    builder.moveTo(targetContainer, state.defaultMoveOptions);
                else if (builder.store.getFreeCapacity()) {
                    builder.withdraw(targetContainer, RESOURCE_ENERGY);
                    builder.data.container = targetContainer;
                }
                else {
                    builder.status = BuilderJobs.Building;
                    let existingConstruction = findInRange(builder.data.container, state.myConstructionSites, 1)[0];
                    if (existingConstruction)
                        builder.data.site = existingConstruction;
                }
                break;
            case BuilderJobs.Building:
                let extensions = state.myExtensions.filter(x => x.store.getUsedCapacity(RESOURCE_ENERGY) == 0);
                let extension = findInRange(builder.data.container, extensions, 2)[0];

                if (builder.store.getUsedCapacity() == 0) {
                    builder.status = BuilderJobs.Collecting;
                }
                else {
                    if (!builder.data.site) {
                        let locations = ArrayTools.intersectRanges(RangeTools.getAvailableAdjacentSpaces(builder), RangeTools.getAvailableAdjacentSpaces(builder.data.container));
                        builder.data.site = createConstructionSite(locations[0], StructureExtension).object;
                    }
                    else {
                        let constructionSite = <ConstructionSite>builder.data.site;
                        builder.build(constructionSite);
                        if (constructionSite.structure.id) {
                            builder.data.site = null;
                            builder.data.ext = constructionSite.structure;
                            builder.status = BuilderJobs.Collecting;
                        }
                    }
                }
                break;
            default:
                break;
        }
    }
}


enum BuilderJobs {
    Collecting,
    Building
}
