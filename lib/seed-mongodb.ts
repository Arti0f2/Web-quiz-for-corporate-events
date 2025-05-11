import dbConnect from './mongodb';
import User from '../models/mongoose/User';
import Quiz from '../models/mongoose/Quiz';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('Seeding MongoDB database...');
  
  try {
    // Соединение с базой данных
    await dbConnect();
    console.log('Connected to MongoDB');
    
    let admin;
    // Проверяем, есть ли уже админ
    try {
      admin = await User.findOne({ email: 'admin@example.com' });
      
      if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        admin = await User.create({
          name: 'Admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('Admin user created');
      } else {
        console.log('Admin user already exists');
      }
    } catch (userError) {
      console.error('Error with admin user:', userError);
      // Создаем базовый объект админа с ID
      admin = { _id: '6553d94ca2653b425d7ab482' };
    }
    
    let existingQuizCount = 0;
    try {
      // Проверяем, есть ли уже викторины
      existingQuizCount = await Quiz.countDocuments();
    } catch (countError) {
      console.error('Error counting quizzes, assuming 0:', countError);
    }
    
    if (existingQuizCount === 0) {
      console.log('Adding quizzes...');
      
      // Создаем тестовые викторины
      const quizzes = [
        {
          title: 'Спорт',
          description: 'Викторина о различных видах спорта и известных спортсменах',
          categories: [
            {
              name: 'Футбол',
              questions: [
                { text: 'В каком году была основана FIFA?', answer: '1904', points: 100 },
                { text: 'Какая страна выиграла больше всего чемпионатов мира по футболу?', answer: 'Бразилия', points: 200 },
                { text: 'Какой игрок забил больше всего голов в истории футбола?', answer: 'Криштиану Роналду', points: 300 },
              ]
            },
            {
              name: 'Баскетбол',
              questions: [
                { text: 'Какая высота баскетбольного кольца?', answer: '3.05 метра', points: 100 },
                { text: 'Какая команда выиграла больше всего чемпионатов НБА?', answer: 'Бостон Селтикс', points: 200 },
                { text: 'Кто считается лучшим баскетболистом всех времен?', answer: 'Майкл Джордан', points: 300 },
              ]
            }
          ],
          questionTimeLimit: 60,
          answerTimeLimit: 60,
          creatorId: admin._id.toString()
        },
        {
          title: 'История',
          description: 'Викторина о важных исторических событиях и личностях',
          categories: [
            {
              name: 'Древний мир',
              questions: [
                { text: 'В каком году был основан Рим?', answer: '753 до н.э.', points: 100 },
                { text: 'Кто был первым императором Рима?', answer: 'Октавиан Август', points: 200 },
                { text: 'Какая цивилизация построила пирамиды в Гизе?', answer: 'Древний Египет', points: 300 },
              ]
            },
            {
              name: 'Средние века',
              questions: [
                { text: 'В каком году пала Византийская империя?', answer: '1453', points: 100 },
                { text: 'Кто был основателем Монгольской империи?', answer: 'Чингисхан', points: 200 },
                { text: 'Какое событие положило начало Ренессансу?', answer: 'Взятие Константинополя турками', points: 300 },
              ]
            }
          ],
          questionTimeLimit: 60,
          answerTimeLimit: 60,
          creatorId: admin._id.toString()
        },
        {
          title: 'Наука',
          description: 'Викторина о научных открытиях и изобретениях',
          categories: [
            {
              name: 'Физика',
              questions: [
                { text: 'Кто открыл закон всемирного тяготения?', answer: 'Исаак Ньютон', points: 100 },
                { text: 'В каком году Эйнштейн опубликовал общую теорию относительности?', answer: '1915', points: 200 },
                { text: 'Что такое бозон Хиггса?', answer: 'Элементарная частица', points: 300 },
              ]
            },
            {
              name: 'Биология',
              questions: [
                { text: 'Кто является автором теории эволюции?', answer: 'Чарльз Дарвин', points: 100 },
                { text: 'В каком году была расшифрована структура ДНК?', answer: '1953', points: 200 },
                { text: 'Что изучает микробиология?', answer: 'Микроорганизмы', points: 300 },
              ]
            }
          ],
          questionTimeLimit: 60,
          answerTimeLimit: 60,
          creatorId: admin._id.toString()
        }
      ];
      
      try {
        await Quiz.insertMany(quizzes);
        console.log(`Added ${quizzes.length} quizzes to the database.`);
      } catch (insertError) {
        console.error('Error inserting quizzes:', insertError);
      }
    } else {
      console.log(`Found ${existingQuizCount} existing quizzes, skipping seed.`);
    }
    
    console.log('Database seeding completed');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
} 