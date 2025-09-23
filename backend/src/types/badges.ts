import { Url } from "url";

export interface badge {
	badge_id: string;
	name: string;
	description: string;
	timeInDays: number;
	url: Url;
}

