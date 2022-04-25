import { Spawner } from "arena_swamp3/spawner";
import State from "./state";

let state: State = State.Instance;
let spawnTools: Spawner = new Spawner(state.mySpawn);

export function loop(): void {
    state.calculate();
    spawnTools.spawn();
    giveorders();
}

function giveorders() {
    state.myCreeps.forEach(myCreep => {
        myCreep.doWork();
    });
}
