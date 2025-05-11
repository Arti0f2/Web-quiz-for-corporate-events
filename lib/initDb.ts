import sequelize from './db';
import User from '../models/User';
import Quiz from '../models/Quiz';
import QuizSession from '../models/QuizSession';
import { seedQuizzes } from './seedData';

async function initDatabase() {
  try {
    // Синхронизируем модели с базой данных
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
    
    // Заполняем базу данных тестовыми квизами
    await seedQuizzes();
  } catch (error) {
    console.error('Failed to synchronize database:', error);
    throw error;
  }
}

export default initDatabase; 