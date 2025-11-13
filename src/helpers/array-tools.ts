import { Position } from 'game/prototypes';

import { RangeTools } from './range-tools';

export default class ArrayTools {
    static intersects(target: [], source: []) {
        return target.filter(value => source.includes(value));
    }

    static intersectRanges(target: Position[], source: Position[]) {
        return target.filter(left => source.some(right => RangeTools.match(left, right)));
    }
}
