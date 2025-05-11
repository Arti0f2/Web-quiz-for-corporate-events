import mongoose, { Document, Schema } from 'mongoose';

interface IQuestion {
  text: string;
  answer: string;
  points: number;
}

interface ICategory {
  name: string;
  questions: IQuestion[];
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  categories: ICategory[];
  questionTimeLimit: number;
  answerTimeLimit: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: [true, 'Текст вопроса обязателен'],
  },
  answer: {
    type: String,
    required: [true, 'Ответ обязателен'],
  },
  points: {
    type: Number,
    required: [true, 'Количество баллов обязательно'],
    min: [10, 'Минимальное количество баллов - 10'],
  },
});

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Название категории обязательно'],
  },
  questions: {
    type: [QuestionSchema],
    required: [true, 'Хотя бы один вопрос обязателен'],
    validate: {
      validator: function(questions: IQuestion[]) {
        return questions.length > 0;
      },
      message: 'Категория должна содержать хотя бы один вопрос',
    },
  },
});

const QuizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: [true, 'Название викторины обязательно'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Описание викторины обязательно'],
    trim: true,
  },
  categories: {
    type: [CategorySchema],
    required: [true, 'Хотя бы одна категория обязательна'],
    validate: {
      validator: function(categories: ICategory[]) {
        return categories.length > 0;
      },
      message: 'Викторина должна содержать хотя бы одну категорию',
    },
  },
  questionTimeLimit: {
    type: Number,
    required: true,
    default: 60,
    min: [10, 'Минимальное время на вопрос - 10 секунд'],
    max: [300, 'Максимальное время на вопрос - 300 секунд'],
  },
  answerTimeLimit: {
    type: Number,
    required: true,
    default: 60,
    min: [10, 'Минимальное время на ответ - 10 секунд'],
    max: [300, 'Максимальное время на ответ - 300 секунд'],
  },
  creatorId: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema); 