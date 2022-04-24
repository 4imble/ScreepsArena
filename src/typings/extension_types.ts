import { BodyPartConstant } from "game/constants";

declare module "game/prototypes" {
    interface Creep {
        type: string | number;
        status: string | number;
        data: any;
        doWork: () => void;
    }

    interface ConstructionSite {
        tag: string | number;
    }

    interface Structure {
        tag: string | number;
    }
}
