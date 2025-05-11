import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../lib/db';
import User from './User';

interface Question {
  text: string;
  answer: string;
  points: number;
}

interface Category {
  name: string;
  questions: Question[];
}

class Quiz extends Model<InferAttributes<Quiz>, InferCreationAttributes<Quiz>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare categories: Category[];
  declare creatorId: number;
  declare questionTimeLimit: CreationOptional<number>;
  declare answerTimeLimit: CreationOptional<number>;
}

Quiz.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categories: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidCategories(value: Category[]) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Quiz must have at least one category');
          }
          
          value.forEach((category, categoryIndex) => {
            if (!category.name) {
              throw new Error(`Category ${categoryIndex + 1} must have a name`);
            }
            if (!Array.isArray(category.questions) || category.questions.length === 0) {
              throw new Error(`Category ${category.name} must have at least one question`);
            }
            
            category.questions.forEach((question, questionIndex) => {
              if (!question.text) {
                throw new Error(`Question ${questionIndex + 1} in category ${category.name} must have text`);
              }
              if (!question.answer) {
                throw new Error(`Question ${questionIndex + 1} in category ${category.name} must have an answer`);
              }
              if (typeof question.points !== 'number' || question.points <= 0) {
                throw new Error(`Question ${questionIndex + 1} in category ${category.name} must have positive points`);
              }
            });
          });
        }
      }
    },
    questionTimeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      validate: {
        min: 10,
        max: 300
      }
    },
    answerTimeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      validate: {
        min: 10,
        max: 300
      }
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'Quiz',
  }
);

// Определяем отношения
Quiz.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });

export default Quiz; 