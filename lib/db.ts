import { Sequelize } from 'sequelize';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

export default sequelize; 