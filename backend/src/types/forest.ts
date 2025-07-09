import { Url } from "url";

export interface nature {
    id_nature: string;
    name: string;
    type: "tree" | "flower";
    url: Url;
}
export interface forest {
    id_forest: string;
    x: number;
    y: number;
    id_user: string;
    id_nature: string;
}