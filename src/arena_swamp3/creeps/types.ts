import { BodyPartConstant } from "game/constants";
import { Creep } from "game/prototypes";

export enum CreepType {
    Builder,
    Army,
    Mule,
    Guardian
}

export abstract class MyCreep
{
    static bodyTemplate: BodyPartConstant[];
    static convert: (creep:Creep) => Creep;
    static type: CreepType;
}
