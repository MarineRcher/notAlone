import { Sequelize } from "sequelize";
import config from "./config.json";

type Environment = "development" | "test" | "production";
const env: Environment = (process.env.NODE_ENV || "development") as Environment;

const dbConfig = config[env];

const sequelize = new Sequelize(
	dbConfig.database,
	dbConfig.username,
	dbConfig.password,
	{
		host: dbConfig.host,
		port: dbConfig.port,
		dialect: "postgres",
		define: dbConfig.define,
		logging: dbConfig.logging,
		// Add retry and timeout options for better error handling
		retry: {
			max: 3,
		},
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
	},
);

export default sequelize;
