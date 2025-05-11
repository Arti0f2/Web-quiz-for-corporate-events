import { useState } from 'react';

interface Question {
  text: string;
  answer: string;
  points: number;
}

interface Category {
  name: string;
  questions: Question[];
}

interface CategoryFormProps {
  category: Category;
  onChange: (data: Partial<Category>) => void;
  onRemove: () => void;
}

export default function CategoryForm({ category, onChange, onRemove }: CategoryFormProps) {
  const [showQuestions, setShowQuestions] = useState(true);

  const handleAddQuestion = () => {
    const newQuestions = [...category.questions, {
      text: '',
      answer: '',
      points: 100
    }];
    
    onChange({ questions: newQuestions });
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...category.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    
    onChange({ questions: newQuestions });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...category.questions];
    newQuestions.splice(index, 1);
    
    onChange({ questions: newQuestions });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex-1 min-w-0 mr-4">
          <input
            type="text"
            value={category.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Назва категорії"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowQuestions(!showQuestions)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            {showQuestions ? 'Згорнути' : 'Розгорнути'}
          </button>
          
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-red-500 hover:text-red-700"
          >
            Видалити
          </button>
        </div>
      </div>
      
      {showQuestions && (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium text-gray-700">Питання</h3>
          
          {category.questions.length > 0 ? (
            <div className="space-y-4">
              {category.questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-3">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Питання
                    </label>
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => handleUpdateQuestion(index, 'text', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Текст питання"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Відповідь
                    </label>
                    <input
                      type="text"
                      value={question.answer}
                      onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Правильна відповідь"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Бали
                    </label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => handleUpdateQuestion(index, 'points', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Кількість балів"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Видалити питання
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 bg-gray-50 rounded-md">
              <p className="text-gray-500">Додайте перше питання в цю категорію</p>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleAddQuestion}
            className="mt-2 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Додати питання
          </button>
        </div>
      )}
    </div>
  );
} 