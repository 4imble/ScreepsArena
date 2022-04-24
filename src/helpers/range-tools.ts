import { TERRAIN_WALL } from "game/constants";
import { RoomPosition } from "game/prototypes";
import { getTerrainAt } from "game/utils";

export class RangeTools {
    static getAvailableAdjacentSpaces(target: RoomPosition, range: number = 1) {
        let validSpaces = [];
        for (let x = target.x - range; x <= target.x + range; x++)
            for (let y = target.y - range; y <= target.y + range; y++) {
                let isWall = getTerrainAt({ x, y }) === TERRAIN_WALL;
                let isTarget = this.match(target, { x, y });
                if (!isTarget && !isTarget)
                    validSpaces.push({ x, y });
            }
        return validSpaces;
    }

    static match(source: RoomPosition, target: RoomPosition) {
        return source.x == target.x && source.y == target.y;
    }
}
