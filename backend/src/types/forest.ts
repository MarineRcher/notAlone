import { Url } from "url";

export interface forest {
    id_forest: number;
    id_nature: number;
    id_platform: number;
    side: "top" | "right" | "bottom" | "left";
}
export interface nature {
    id_nature: number;
    type: "tree" | "flower";
    url: Url;
}
