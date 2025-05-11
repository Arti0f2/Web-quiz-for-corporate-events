'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';

// Components and types for quiz creation
import CategoryForm from '../../components/quiz/CategoryForm';

interface Question {
  text: string;
  answer: string;
  points: number;
}

interface Category {
  name: string;
  questions: Question[];
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authorization
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Для створення вікторини необхідно авторизуватися');
      router.push('/login');
      return;
    }

    // Verify token validity
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsAuthorized(true);
        } else {
          localStorage.removeItem('token');
          toast.error('Ваша сесія закінчилася. Увійдіть знову');
          router.push('/login');
        }
      } catch (error) {
        toast.error('Помилка авторизації');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        name: '',
        questions: []
      }
    ]);
  };

  const updateCategory = (index: number, data: Partial<Category>) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      ...data
    };
    setCategories(updatedCategories);
  };

  const removeCategory = (index: number) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!title.trim()) {
      return toast.error('Введіть назву вікторини');
    }
    
    if (!description.trim()) {
      return toast.error('Введіть опис вікторини');
    }
    
    if (categories.length === 0) {
      return toast.error('Додайте хоча б одну категорію');
    }
    
    for (const category of categories) {
      if (!category.name.trim()) {
        return toast.error('Усі категорії повинні мати назви');
      }
      
      if (category.questions.length === 0) {
        return toast.error(`Категорія "${category.name}" не має питань`);
      }
      
      for (const question of category.questions) {
        if (!question.text.trim()) {
          return toast.error(`Усі питання повинні мати текст`);
        }
        if (!question.answer.trim()) {
          return toast.error(`Усі питання повинні мати відповіді`);
        }
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          categories
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Вікторину успішно створено!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Помилка створення вікторини');
      }
    } catch (error) {
      toast.error('Помилка створення вікторини');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Не рендерим страницу, если пользователь не авторизован
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Створення нової вікторини</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Назва вікторини
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введіть назву вікторини"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Опис вікторини
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Введіть опис вікторини"
            />
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Категорії та питання</h2>
            
            {categories.length > 0 ? (
              <div className="space-y-6">
                {categories.map((category, index) => (
                  <CategoryForm
                    key={index}
                    category={category}
                    onChange={(data) => updateCategory(index, data)}
                    onRemove={() => removeCategory(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">Ще немає категорій. Додайте першу категорію.</p>
              </div>
            )}
            
            <button
              type="button"
              onClick={addCategory}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Додати категорію
            </button>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Збереження...' : 'Зберегти вікторину'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 