import { Sequelize } from 'sequelize';
import config from './config.json'; 

type Environment = 'development' | 'test' | 'production';
const env: Environment = (process.env.NODE_ENV || 'development') as Environment;

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
  }
);

export default sequelize;