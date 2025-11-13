declare module "game/prototypes" {
import {
    BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, ERR_BUSY, ERR_INVALID_ARGS, ERR_NOT_ENOUGH_ENERGY,
    ERR_NOT_OWNER, LEFT, OK, RIGHT, TOP, TOP_LEFT, TOP_RIGHT
} from 'game/constants';
import { BodyPartType, Creep } from 'game/prototypes/creep';
import { OwnedStructure } from 'game/prototypes/owned-structure';
import { Store } from 'game/prototypes/store';

        /** {@link createConstructionSite} call result*/
    export interface SpawnCreepResult {
        /** the instance of the {@link Creep} being spawned */
        object?: Creep | undefined;

        /** the error code */
        error?: typeof ERR_NOT_OWNER | typeof ERR_INVALID_ARGS | typeof ERR_NOT_ENOUGH_ENERGY | typeof ERR_BUSY | undefined;
    }

    type SetDirectionsResult = typeof OK | typeof ERR_NOT_OWNER | typeof ERR_INVALID_ARGS;

    type DirectionConstant =
    typeof TOP |
    typeof TOP_RIGHT |
    typeof RIGHT |
    typeof BOTTOM_RIGHT |
    typeof BOTTOM |
    typeof BOTTOM_LEFT |
    typeof LEFT |
    typeof TOP_LEFT;

    /** Details of the creep being spawned currently */
    export class Spawning {
        /** Time needed in total to complete the spawning */
        needTime: number;

        /** Remaining time to go */
        remainingTime: number;

        /** The creep that being spawned */
        creep: Creep;

        /** Cancel spawning immediately */
        cancel(): typeof OK | typeof ERR_NOT_OWNER | undefined;
    }

    /** This structure can create creeps. It also auto-regenerate a little amount of energy each tick */
    export class StructureSpawn extends OwnedStructure {
        /** A {@link Store} object that contains cargo of this structure */
        store: Store;

        /** If the spawn is in process of spawning a new creep, this object will contain a {@link Spawning} object, or null otherwise */
        spawning: Spawning;

        /** The directions in which the spawn can create creeps */
        directions: DirectionConstant[];

        /**
         * Set the directions in which the spawn can create creeps
         * @param directions An array of direction constants
         */
        setDirections(directions: DirectionConstant[]): SetDirectionsResult;

        /**
         * Start the creep spawning process
         * @param body An array describing the new creep’s body
         * @returns a {@link SpawnCreepResult} object with the call result
         */
        spawnCreep(body: BodyPartType[]): SpawnCreepResult;
    }
}
