import Builder from "arena_swamp3/creeps/builder";
import Defender from "arena_swamp3/creeps/defender";
import Fighter from "arena_swamp3/creeps/fighter";
import Guardian from "arena_swamp3/creeps/guardian";
import Healer from "arena_swamp3/creeps/healer";
import Mule from "arena_swamp3/creeps/mule";
import { CreepType } from "arena_swamp3/creeps/types";
import State from "arena_swamp3/state";
import { Creep, StructureRampart, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype } from "game/utils";

export class Spawner {
    mySpawn: StructureSpawn;
    state: State = State.Instance;

    constructor(spawn: StructureSpawn) {
        this.mySpawn = spawn;
    }

    spawn() {
        this.createMules() ||
        this.createDefender() ||
        this.createBuilders(1) ||
        // this.createGuardians() ||
        // this.createHealers(2) ||
        this.createFighters();
    }

    createMules() {
        let creeps = this.state.getMyCreeps(CreepType.Mule);
        if (creeps.length)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Mule.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Mule.convert(creep));
        return true;
    }

    createDefender() {
        let creeps = this.state.getMyCreeps(CreepType.Defender);
        let doesRampartExist = getObjectsByPrototype(StructureRampart).some(x => x.my);

        if (creeps.length || doesRampartExist)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Builder.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Defender.convert(creep));

        return true;
    }

    createBuilders(count: number = 1) {
        let creeps = this.state.getMyCreeps(CreepType.Builder);
        if (creeps.length >= count)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Builder.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Builder.convert(creep));
        return true;
    }

    createGuardians() {
        let creeps = this.state.getMyCreeps(CreepType.Guardian);
        if (creeps.length)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Guardian.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Guardian.convert(creep));
        return true;
    }

    createHealers(count: number) {
        let creeps = this.state.getMyCreeps(CreepType.Healer);
        if (creeps.length >= count)
            return false;

        let creep = <Creep>this.state.mySpawn.spawnCreep(Healer.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Healer.convert(creep));
        return true;
    }

    createFighters() {
        let creep = <Creep>this.state.mySpawn.spawnCreep(Fighter.bodyTemplate).object;
        if (creep)
            this.state.myCreeps.push(Fighter.convert(creep));
        return true;
    }
}
