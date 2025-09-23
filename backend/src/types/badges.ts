import { Url } from "url";

export interface badge {
	badge_id: string;
	name: string;
	description: string;
	time_in_days: number;
	url: Url;
}

