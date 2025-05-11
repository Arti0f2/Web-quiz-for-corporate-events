'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Question {
  text: string;
  answer: string;
  points: number;
}

interface Category {
  name: string;
  questions: Question[];
}

interface QuizFormProps {
  onCreateSuccess?: (quizId: number) => void;
}

export default function QuizForm({ onCreateSuccess }: QuizFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([
    {
      name: '',
      questions: [
        { text: '', answer: '', points: 100 }
      ]
    }
  ]);

  // Изменение названия категории
  const handleCategoryNameChange = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index].name = value;
    setCategories(newCategories);
  };

  // Изменение вопроса
  const handleQuestionChange = (
    categoryIndex: number, 
    questionIndex: number, 
    field: keyof Question, 
    value: string | number
  ) => {
    const newCategories = [...categories];
    if (field === 'text' || field === 'answer') {
      newCategories[categoryIndex].questions[questionIndex][field] = value as string;
    } else if (field === 'points') {
      newCategories[categoryIndex].questions[questionIndex][field] = value as number;
    }
    setCategories(newCategories);
  };

  // Добавление новой категории
  const addCategory = () => {
    setCategories([
      ...categories,
      {
        name: '',
        questions: [
          { text: '', answer: '', points: 100 }
        ]
      }
    ]);
  };

  // Удаление категории
  const removeCategory = (index: number) => {
    if (categories.length <= 1) {
      toast.error('Потрібна хоча б одна категорія');
      return;
    }
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  // Обновление значений баллов для всех вопросов в категории
  const updateCategoryPointValues = (categoryIndex: number, startPoints: number) => {
    if (startPoints < 100) {
      toast.error('Початкова кількість балів повинна бути не менше 100');
      return;
    }

    const newCategories = [...categories];
    const questions = newCategories[categoryIndex].questions;
    
    questions.forEach((question, index) => {
      question.points = startPoints + (index * 100);
    });
    
    setCategories(newCategories);
  };

  // Добавление нового вопроса в категорию
  const addQuestion = (categoryIndex: number) => {
    const newCategories = [...categories];
    const lastQuestion = newCategories[categoryIndex].questions[newCategories[categoryIndex].questions.length - 1];
    const newPoints = lastQuestion ? lastQuestion.points + 100 : 100;
    
    newCategories[categoryIndex].questions.push({
      text: '',
      answer: '',
      points: newPoints
    });
    
    setCategories(newCategories);
  };

  // Удаление вопроса из категории
  const removeQuestion = (categoryIndex: number, questionIndex: number) => {
    if (categories[categoryIndex].questions.length <= 1) {
      toast.error('Потрібне хоча б одне питання у категорії');
      return;
    }
    
    const newCategories = [...categories];
    newCategories[categoryIndex].questions.splice(questionIndex, 1);
    setCategories(newCategories);
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!title.trim()) {
      toast.error('Введіть назву вікторини');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Введіть опис вікторини');
      return;
    }
    
    // Проверка категорий и вопросов
    for (let i = 0; i < categories.length; i++) {
      if (!categories[i].name.trim()) {
        toast.error(`Введіть назву для категорії ${i + 1}`);
        return;
      }
      
      for (let j = 0; j < categories[i].questions.length; j++) {
        const question = categories[i].questions[j];
        if (!question.text.trim()) {
          toast.error(`Введіть текст для питання ${j + 1} в категорії "${categories[i].name}"`);
          return;
        }
        if (!question.answer.trim()) {
          toast.error(`Введіть відповідь для питання ${j + 1} в категорії "${categories[i].name}"`);
          return;
        }
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Прямое использование fetch с обработкой ошибок
      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          categories,
          questionTimeLimit: 60,
          answerTimeLimit: 60
        })
      });

      let data;
      try {
        // Пытаемся разобрать ответ как JSON
        data = await response.json();
      } catch (parseError) {
        // Если не удалось разобрать как JSON, получаем текст ошибки
        const errorText = await response.text();
        console.error('Failed to parse response as JSON:', errorText);
        throw new Error('Сервер вернул неправильный формат ответа. Попробуйте еще раз.');
      }

      if (!response.ok) {
        throw new Error(data?.message || `Ошибка: ${response.status} ${response.statusText}`);
      }
      
      toast.success('Вікторину успішно створено!');
      
      // Після створення вікторини перенаправляємо безпосередньо на головну сторінку
      router.push(`/`);
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error(error.message || 'Помилка при створенні вікторини');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Створення нової вікторини</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Основные данные викторины */}
        <div className="mb-8">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Назва вікторини
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Опис вікторини
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </div>
        
        {/* Категории и вопросы */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Категорії та питання</h2>
          
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 mr-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Назва категорії
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={category.name}
                    onChange={(e) => handleCategoryNameChange(categoryIndex, e.target.value)}
                    required
                  />
                </div>
                <div className="mr-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Початкові бали
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      defaultValue="100"
                      placeholder="100"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const value = parseInt(input.value, 10) || 100;
                        updateCategoryPointValues(categoryIndex, value);
                      }}
                      className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Оновити
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCategory(categoryIndex)}
                  className="h-10 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 mt-6"
                >
                  Видалити
                </button>
              </div>
              
              {/* Вопросы в категории */}
              <div className="space-y-4">
                {category.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="p-3 border border-gray-100 rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 mr-2">
                          Питання {questionIndex + 1}
                        </span>
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded">
                          {question.points} балів
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(categoryIndex, questionIndex)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Видалити
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Текст питання
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={question.text}
                          onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'text', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Відповідь
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={question.answer}
                          onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'answer', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Бали
                        </label>
                        <input
                          type="number"
                          min="100"
                          step="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={question.points}
                          onChange={(e) => handleQuestionChange(categoryIndex, questionIndex, 'points', parseInt(e.target.value, 10) || 100)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addQuestion(categoryIndex)}
                  className="w-full mt-2 px-3 py-2 bg-green-50 text-green-700 rounded-md border border-green-100 hover:bg-green-100"
                >
                  + Додати питання
                </button>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addCategory}
            className="mt-2 mb-6 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          >
            + Додати категорію
          </button>
        </div>
        
        {/* Сохранение */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Рекомендації для створення вікторини:</h3>
            <ul className="list-disc pl-5 mt-2 text-gray-600 text-sm">
              <li>Додайте від 2 до 6 категорій для найкращого ігрового досвіду</li>
              <li>Створіть від 3 до 5 питань у кожній категорії з різною складністю</li>
              <li>Бали мають відображати складність питання (вищі бали = складніше питання)</li>
              <li>Переконайтеся, що відповіді є чіткими та однозначними</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Створення...
                </>
              ) : (
                'Створити вікторину'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 