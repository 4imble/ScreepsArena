import { ATTACK, RANGED_ATTACK, TERRAIN_WALL } from "game/constants";
import { CostMatrix, MoveToOpts } from "game/path-finder";
import { ConstructionSite, Creep, StructureContainer, StructureExtension, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype, getTerrainAt } from "game/utils";
import { CreepType } from "./creeps/types";

export default class State {
        private static _instance: State;

        mySpawn!: StructureSpawn;
        enemySpawn!: StructureSpawn;
        allContainers!: StructureContainer[];
        myExtensions!: StructureExtension[];
        allCreeps: Creep[] = [];
        enemyCreeps: Creep[] = [];
        myCreeps: Creep[] = [];
        avoidanceMatrix!: CostMatrix;
        defaultMoveOptions!: MoveToOpts;

        constructor(){
            this.calculate();
        }

        calculate() {
            this.mySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => i.my);
            this.enemySpawn = <StructureSpawn>getObjectsByPrototype(StructureSpawn).find(i => !i.my);
            this.allContainers = getObjectsByPrototype(StructureContainer);
            this.myExtensions = getObjectsByPrototype(StructureExtension).filter(i => i.my);
            this.allCreeps = getObjectsByPrototype(Creep);
            this.enemyCreeps = this.allCreeps.filter(i => !i.my);
            this.myCreeps = this.myCreeps.filter(x => x?.exists);

            this.avoidanceMatrix = this.getAvoidanceMatrix();
            this.defaultMoveOptions = { swampCost: 1, plainCost: 2, costMatrix: this.avoidanceMatrix }
        }

        getAvoidanceMatrix() {
            var matrix = new CostMatrix();

            this.enemyCreeps.forEach(enemy => {
                let avoidanceRange = enemy.body.some(y => y.type == RANGED_ATTACK) ? 6 : enemy.body.some(y => y.type == ATTACK) ? 3 : 0;
                for (let x = enemy.x - avoidanceRange; x <= enemy.x + avoidanceRange; x++)
                    for (let y = enemy.y - avoidanceRange; y <= enemy.y + avoidanceRange; y++) {
                        let isWall = getTerrainAt({ x, y }) === TERRAIN_WALL;
                        matrix.set(x, y, isWall ? 255 : matrix.get(x, y) + 10);
                    }
            });

            this.allCreeps.forEach(creep => {
                matrix.set(creep.x, creep.y, 255)
            });

            return matrix;
        }

        getMyCreeps(type: CreepType): Creep[] {
            return this.myCreeps.filter(x => x.type == type);
        }

        findMyCreep(type: CreepType): Creep {
            return this.getMyCreeps(type)[0];
        }

        public static get Instance()
        {
            // Do you need arguments? Make it a regular static method instead.
            return this._instance || (this._instance = new this());
        }
}
