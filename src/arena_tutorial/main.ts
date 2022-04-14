import { getObjectsByPrototype } from 'game/utils';
import { Creep } from 'game/prototypes';
import { Flag } from 'arena/prototypes';

export function loop() {
    var creeps = getObjectsByPrototype(Creep);
    var flags = getObjectsByPrototype(Flag);
    creeps[0].moveTo(flags[0]);
}
