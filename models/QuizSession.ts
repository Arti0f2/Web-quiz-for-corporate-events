import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../lib/db';
import Quiz from './Quiz';
import User from './User';

export enum PlayerRole {
  PLAYER = 'player',
  HOST = 'host',
  HOST_PLAYER = 'host_player'
}

interface Player {
  id: string;
  nickname: string;
  score: number;
  role: PlayerRole;
}

interface AnsweredQuestion {
  categoryIndex: number;
  questionIndex: number;
}

class QuizSession extends Model<InferAttributes<QuizSession>, InferCreationAttributes<QuizSession>> {
  declare id: CreationOptional<number>;
  declare quizId: number;
  declare code: string;
  declare isActive: boolean;
  declare status: 'waiting' | 'in_progress' | 'completed';
  declare players: Player[];
  declare answeredQuestions: AnsweredQuestion[];
  declare currentCategoryIndex: number | null;
  declare currentQuestionIndex: number | null;
  declare currentAnsweringPlayerId: string | null;
  declare currentPlayerTurn: string | null;
  declare startTime: Date;
  declare endTime: Date | null;
}

QuizSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Quiz,
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'waiting',
    },
    players: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    answeredQuestions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    currentCategoryIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    currentQuestionIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    currentAnsweringPlayerId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    currentPlayerTurn: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'QuizSession',
    hooks: {
      beforeCreate: async (session: QuizSession) => {
        // Генерируем уникальный код сессии
        const generateCode = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          return Array.from(
            { length: 6 },
            () => chars.charAt(Math.floor(Math.random() * chars.length))
          ).join('');
        };

        let code = generateCode();
        let existingSession = await QuizSession.findOne({ where: { code } });
        
        while (existingSession) {
          code = generateCode();
          existingSession = await QuizSession.findOne({ where: { code } });
        }

        session.code = code;
      }
    }
  }
);

// Определяем отношения
QuizSession.belongsTo(Quiz, { foreignKey: 'quizId' });
Quiz.hasMany(QuizSession, { foreignKey: 'quizId' });

export default QuizSession; 