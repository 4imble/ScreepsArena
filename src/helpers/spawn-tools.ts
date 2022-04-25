import Builder from "arena_swamp3/creeps/builder";
import Guardian from "arena_swamp3/creeps/guardian";
import Mule from "arena_swamp3/creeps/mule";
import { CreepType } from "arena_swamp3/creeps/types";
import State from "arena_swamp3/state";
import { Creep, StructureSpawn } from "game/prototypes";

export class SpawnTools {
    mySpawn: StructureSpawn;
    state: State = State.Instance;

    constructor(spawn: StructureSpawn) {
        this.mySpawn = spawn;
    }

    spawn() {
        this.createMule() || this.createBuilder() || this.createGuardian();
    }

    createMule() {
        let creeps = this.state.getMyCreeps(CreepType.Mule);
        if (creeps.length)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Mule.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Mule.convert(creep));
        return true;
    }

    createBuilder() {
        let creeps = this.state.getMyCreeps(CreepType.Builder);
        if (creeps.length)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Builder.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Builder.convert(creep));
        return true;
    }

    createGuardian() {
        let creeps = this.state.getMyCreeps(CreepType.Guardian);
        if (creeps.length)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Guardian.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Guardian.convert(creep));
        return true;
    }
}
