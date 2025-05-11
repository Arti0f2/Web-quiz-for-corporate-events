import Quiz from '../models/Quiz';
import User from '../models/User';
import sequelize from './db';
import bcryptjs from 'bcryptjs';
import { QueryTypes } from 'sequelize';

export interface SeedQuiz {
  title: string;
  description: string;
  categories: {
    name: string;
    questions: {
      text: string;
      answer: string;
      points: number;
    }[];
  }[];
}

const sampleQuizzes: SeedQuiz[] = [
  {
    title: 'Спорт',
    description: 'Вікторина на спортивну тематику',
    categories: [
      {
        name: 'Футбол',
        questions: [
          {
            text: 'Скільки гравців у футбольній команді на полі?',
            answer: '11',
            points: 100
          },
          {
            text: 'Яка країна виграла найбільше чемпіонатів світу з футболу?',
            answer: 'Бразилія',
            points: 200
          },
          {
            text: 'Як називається найпрестижніший європейський клубний футбольний турнір?',
            answer: 'Ліга Чемпіонів',
            points: 300
          },
          {
            text: 'Хто з футболістів отримав найбільше золотих м\'ячів?',
            answer: 'Ліонель Мессі',
            points: 400
          },
          {
            text: 'В якому році відбувся перший чемпіонат світу з футболу?',
            answer: '1930',
            points: 500
          }
        ]
      },
      {
        name: 'Баскетбол',
        questions: [
          {
            text: 'Яка висота баскетбольного кільця від підлоги?',
            answer: '3.05 метра (10 футів)',
            points: 100
          },
          {
            text: 'Яка команда NBA має найбільше чемпіонств?',
            answer: 'Бостон Селтікс і Лос-Анджелес Лейкерс',
            points: 200
          },
          {
            text: 'Хто вважається найкращим баскетболістом всіх часів?',
            answer: 'Майкл Джордан',
            points: 300
          },
          {
            text: 'Скільки очок дається за влучний кидок з-за триочкової лінії?',
            answer: '3',
            points: 400
          },
          {
            text: 'Яка країна виграла чемпіонат світу з баскетболу 2023 року?',
            answer: 'Німеччина',
            points: 500
          }
        ]
      },
      {
        name: 'Теніс',
        questions: [
          {
            text: 'Скільки основних турнірів "Великого шолома" існує в тенісі?',
            answer: '4',
            points: 100
          },
          {
            text: 'Яке покриття використовується на Вімблдоні?',
            answer: 'Трава',
            points: 200
          },
          {
            text: 'Хто виграв найбільше турнірів "Великого шолома" серед чоловіків?',
            answer: 'Новак Джокович',
            points: 300
          },
          {
            text: 'Як називається найвища нагорода в тенісі у жінок?',
            answer: 'Кубок Біллі Джин Кінг',
            points: 400
          },
          {
            text: 'В якому році теніс повернувся до програми Олімпійських ігор?',
            answer: '1988',
            points: 500
          }
        ]
      },
      {
        name: 'Олімпійські ігри',
        questions: [
          {
            text: 'В якому році відбулись перші сучасні Олімпійські ігри?',
            answer: '1896',
            points: 100
          },
          {
            text: 'Яке місто прийматиме Олімпійські ігри 2024 року?',
            answer: 'Париж',
            points: 200
          },
          {
            text: 'Скільки кілець на Олімпійському прапорі?',
            answer: '5',
            points: 300
          },
          {
            text: 'Який вид спорту був доданий до програми Олімпійських ігор 2020 року в Токіо?',
            answer: 'Скейтбординг',
            points: 400
          },
          {
            text: 'Хто виграв найбільше олімпійських медалей за всю історію?',
            answer: 'Майкл Фелпс',
            points: 500
          }
        ]
      }
    ]
  },
  {
    title: 'Історія',
    description: 'Вікторина з історії різних епох та цивілізацій',
    categories: [
      {
        name: 'Стародавній світ',
        questions: [
          {
            text: 'Яка цивілізація побудувала піраміди в Гізі?',
            answer: 'Єгипетська',
            points: 100
          },
          {
            text: 'Хто був першим імператором об\'єднаного Китаю?',
            answer: 'Цінь Ши Хуанді',
            points: 200
          },
          {
            text: 'Яке місто вважається колискою демократії?',
            answer: 'Афіни',
            points: 300
          },
          {
            text: 'Яка імперія контролювала найбільшу територію у стародавньому світі?',
            answer: 'Перська імперія',
            points: 400
          },
          {
            text: 'В якому році пала Західна Римська імперія?',
            answer: '476',
            points: 500
          }
        ]
      },
      {
        name: 'Середньовіччя',
        questions: [
          {
            text: 'Як називалась епідемія, що знищила третину населення Європи в 14 столітті?',
            answer: 'Чорна смерть (Бубонна чума)',
            points: 100
          },
          {
            text: 'Хто був першим королем об\'єднаної Англії?',
            answer: 'Альфред Великий',
            points: 200
          },
          {
            text: 'Яка подія поклала початок Столітній війні?',
            answer: 'Претензії англійського короля на французький престол',
            points: 300
          },
          {
            text: 'Яка імперія завоювала Константинополь у 1453 році?',
            answer: 'Османська імперія',
            points: 400
          },
          {
            text: 'Хто створив перший друкарський верстат з рухомими літерами в Європі?',
            answer: 'Йоганн Гутенберг',
            points: 500
          }
        ]
      },
      {
        name: 'Новий час',
        questions: [
          {
            text: 'В якому році Христофор Колумб досяг Америки?',
            answer: '1492',
            points: 100
          },
          {
            text: 'Яка революція почалася у Франції в 1789 році?',
            answer: 'Французька революція',
            points: 200
          },
          {
            text: 'Хто винайшов паровий двигун, що започаткував Промислову революцію?',
            answer: 'Джеймс Ватт',
            points: 300
          },
          {
            text: 'Яка країна першою відправила людину в космос?',
            answer: 'СРСР',
            points: 400
          },
          {
            text: 'Хто запропонував теорію еволюції через природний відбір?',
            answer: 'Чарльз Дарвін',
            points: 500
          }
        ]
      },
      {
        name: 'Україна',
        questions: [
          {
            text: 'В якому році була проголошена незалежність України?',
            answer: '1991',
            points: 100
          },
          {
            text: 'Хто був першим гетьманом України?',
            answer: 'Богдан Хмельницький',
            points: 200
          },
          {
            text: 'Яка подія відбулася на Майдані Незалежності у 2013-2014 роках?',
            answer: 'Революція Гідності',
            points: 300
          },
          {
            text: 'Хто є автором "Енеїди", першого твору нової української літератури?',
            answer: 'Іван Котляревський',
            points: 400
          },
          {
            text: 'В якому році відбулась Битва під Крутами?',
            answer: '1918',
            points: 500
          }
        ]
      }
    ]
  },
  {
    title: 'Наука',
    description: 'Вікторина з різних галузей науки',
    categories: [
      {
        name: 'Фізика',
        questions: [
          {
            text: 'Яка найменша частинка атома?',
            answer: 'Кварк',
            points: 100
          },
          {
            text: 'Хто сформулював теорію відносності?',
            answer: 'Альберт Ейнштейн',
            points: 200
          },
          {
            text: 'Яка формула описує взаємозв\'язок маси та енергії?',
            answer: 'E=mc²',
            points: 300
          },
          {
            text: 'Як називається елементарна частинка, що відповідає за електромагнітну взаємодію?',
            answer: 'Фотон',
            points: 400
          },
          {
            text: 'Яка теорія описує поведінку об\'єктів на рівні атомів і субатомних частинок?',
            answer: 'Квантова механіка',
            points: 500
          }
        ]
      },
      {
        name: 'Хімія',
        questions: [
          {
            text: 'Який елемент має символ O?',
            answer: 'Оксиген (Кисень)',
            points: 100
          },
          {
            text: 'Що таке pH?',
            answer: 'Показник концентрації іонів водню',
            points: 200
          },
          {
            text: 'Який найбільш поширений елемент у Всесвіті?',
            answer: 'Гідроген (Водень)',
            points: 300
          },
          {
            text: 'Що таке ізотопи?',
            answer: 'Атоми одного елемента з різною кількістю нейтронів',
            points: 400
          },
          {
            text: 'Який вчений створив першу періодичну таблицю елементів?',
            answer: 'Дмитро Менделєєв',
            points: 500
          }
        ]
      },
      {
        name: 'Біологія',
        questions: [
          {
            text: 'Яка найменша структурна та функціональна одиниця життя?',
            answer: 'Клітина',
            points: 100
          },
          {
            text: 'Що означає термін "ДНК"?',
            answer: 'Дезоксирибонуклеїнова кислота',
            points: 200
          },
          {
            text: 'Який процес дозволяє рослинам перетворювати сонячне світло на енергію?',
            answer: 'Фотосинтез',
            points: 300
          },
          {
            text: 'Яка наука вивчає спадковість і мінливість організмів?',
            answer: 'Генетика',
            points: 400
          },
          {
            text: 'Хто запропонував теорію природного відбору?',
            answer: 'Чарльз Дарвін',
            points: 500
          }
        ]
      },
      {
        name: 'Астрономія',
        questions: [
          {
            text: 'Яка планета найближча до Сонця?',
            answer: 'Меркурій',
            points: 100
          },
          {
            text: 'Що таке чорна діра?',
            answer: 'Область простору-часу з надзвичайно сильною гравітацією',
            points: 200
          },
          {
            text: 'Що є центром нашої галактики Чумацький Шлях?',
            answer: 'Надмасивна чорна діра (Стрілець A*)',
            points: 300
          },
          {
            text: 'Що викликає приливи і відливи на Землі?',
            answer: 'Гравітаційний вплив Місяця',
            points: 400
          },
          {
            text: 'Яка теорія описує початок Всесвіту?',
            answer: 'Теорія Великого вибуху',
            points: 500
          }
        ]
      }
    ]
  },
  {
    title: 'Мистецтво і Культура',
    description: 'Вікторина з мистецтва, культури, музики та літератури',
    categories: [
      {
        name: 'Живопис',
        questions: [
          {
            text: 'Хто намалював "Мона Лізу"?',
            answer: 'Леонардо да Вінчі',
            points: 100
          },
          {
            text: 'До якого художнього напряму належав Ван Гог?',
            answer: 'Постімпресіонізм',
            points: 200
          },
          {
            text: 'Хто створив "Чорний квадрат"?',
            answer: 'Казимир Малевич',
            points: 300
          },
          {
            text: 'Який український художник відомий своїми картинами "Запорожці пишуть листа турецькому султану" та "Бурлаки на Волзі"?',
            answer: 'Ілля Рєпін',
            points: 400
          },
          {
            text: 'Яка картина Пабло Пікассо вважається антивоєнним символом?',
            answer: 'Герніка',
            points: 500
          }
        ]
      },
      {
        name: 'Музика',
        questions: [
          {
            text: 'Скільки струн має класична гітара?',
            answer: '6',
            points: 100
          },
          {
            text: 'Хто є королем рок-н-ролу?',
            answer: 'Елвіс Преслі',
            points: 200
          },
          {
            text: 'Який український композитор написав оперу "Тарас Бульба"?',
            answer: 'Микола Лисенко',
            points: 300
          },
          {
            text: 'Яка група виконувала пісню "Bohemian Rhapsody"?',
            answer: 'Queen',
            points: 400
          },
          {
            text: 'Які чотири групи інструментів складають симфонічний оркестр?',
            answer: 'Струнні, духові дерев\'яні, духові мідні, ударні',
            points: 500
          }
        ]
      },
      {
        name: 'Література',
        questions: [
          {
            text: 'Хто написав "Кобзар"?',
            answer: 'Тарас Шевченко',
            points: 100
          },
          {
            text: 'Хто є автором серії книг про Гаррі Поттера?',
            answer: 'Джоан Роулінг',
            points: 200
          },
          {
            text: 'Який жанр представляє "Ромео і Джульєтта" Шекспіра?',
            answer: 'Трагедія',
            points: 300
          },
          {
            text: 'Який український письменник є автором "Тіней забутих предків"?',
            answer: 'Михайло Коцюбинський',
            points: 400
          },
          {
            text: 'В якому романі Достоєвського головний герой вбиває стару лихварку?',
            answer: 'Злочин і кара',
            points: 500
          }
        ]
      },
      {
        name: 'Кіно',
        questions: [
          {
            text: 'Хто зіграв головну роль у фільмі "Титанік"?',
            answer: 'Леонардо ДіКапріо і Кейт Вінслет',
            points: 100
          },
          {
            text: 'Який фільм отримав найбільше Оскарів в історії?',
            answer: '"Бен-Гур", "Титанік" і "Володар перснів: Повернення короля" (по 11)',
            points: 200
          },
          {
            text: 'Хто режисер фільму "Тіні забутих предків"?',
            answer: 'Сергій Параджанов',
            points: 300
          },
          {
            text: 'У якому році відбувся перший публічний кіносеанс братів Люм\'єр?',
            answer: '1895',
            points: 400
          },
          {
            text: 'Яка кіностудія випустила перший повнометражний анімаційний фільм?',
            answer: 'Walt Disney',
            points: 500
          }
        ]
      }
    ]
  },
  {
    title: 'Географія',
    description: 'Вікторина з географії світу та України',
    categories: [
      {
        name: 'Країни світу',
        questions: [
          {
            text: 'Яка найбільша за площею країна у світі?',
            answer: 'Росія',
            points: 100
          },
          {
            text: 'Скільки країн входить до Європейського Союзу?',
            answer: '27',
            points: 200
          },
          {
            text: 'Яка держава має найбільшу кількість населення?',
            answer: 'Індія',
            points: 300
          },
          {
            text: 'Яка найменша за площею країна у світі?',
            answer: 'Ватикан',
            points: 400
          },
          {
            text: 'Яка країна розташована одночасно в Європі та Азії?',
            answer: 'Туреччина',
            points: 500
          }
        ]
      },
      {
        name: 'Україна',
        questions: [
          {
            text: 'Скільки областей в Україні?',
            answer: '24 (та АР Крим)',
            points: 100
          },
          {
            text: 'Яка найвища гора України?',
            answer: 'Говерла',
            points: 200
          },
          {
            text: 'Яка найдовша річка України?',
            answer: 'Дніпро',
            points: 300
          },
          {
            text: 'З якими країнами межує Україна?',
            answer: 'Польща, Словаччина, Угорщина, Румунія, Молдова, Росія, Білорусь',
            points: 400
          },
          {
            text: 'Яке найбільше озеро в Україні?',
            answer: 'Ялпуг',
            points: 500
          }
        ]
      },
      {
        name: 'Природні чудеса',
        questions: [
          {
            text: 'Який найвищий водоспад у світі?',
            answer: 'Анхель',
            points: 100
          },
          {
            text: 'Де знаходиться найсухіша пустеля у світі?',
            answer: 'Атакама (Чилі)',
            points: 200
          },
          {
            text: 'Яке найглибше озеро у світі?',
            answer: 'Байкал',
            points: 300
          },
          {
            text: 'Який найбільший острів у світі?',
            answer: 'Гренландія',
            points: 400
          },
          {
            text: 'Яка найдовша гірська система у світі?',
            answer: 'Анди',
            points: 500
          }
        ]
      },
      {
        name: 'Столиці',
        questions: [
          {
            text: 'Яка столиця Австралії?',
            answer: 'Канберра',
            points: 100
          },
          {
            text: 'Яка столиця Бразилії?',
            answer: 'Бразиліа',
            points: 200
          },
          {
            text: 'Яка столиця Канади?',
            answer: 'Оттава',
            points: 300
          },
          {
            text: 'Яка столиця Південної Кореї?',
            answer: 'Сеул',
            points: 400
          },
          {
            text: 'Яка столиця Казахстану?',
            answer: 'Астана',
            points: 500
          }
        ]
      }
    ]
  }
];

export async function seedQuizzes() {
  try {
    // Use raw query to check if admin exists
    const adminUsers = await sequelize.query(
      "SELECT * FROM Users WHERE email = 'admin@example.com'",
      { type: QueryTypes.SELECT }
    ) as any[];

    let adminUserId;
    
    if (!adminUsers || adminUsers.length === 0) {
      // Create admin user directly with SQL
      const hashedPassword = await bcryptjs.hash('admin123', await bcryptjs.genSalt(10));
      
      const [adminInsertResult] = await sequelize.query(
        `INSERT INTO Users (name, email, password, role, createdAt, updatedAt) 
         VALUES ('Admin', 'admin@example.com', '${hashedPassword}', 'organizer', datetime('now'), datetime('now'))
         RETURNING id`,
        { type: QueryTypes.INSERT }
      ) as [any, unknown];
      
      adminUserId = adminInsertResult;
      console.log('Admin user created');
    } else {
      adminUserId = adminUsers[0]?.id;
    }
    
    // Check if quizzes exist
    const [existingQuizzes] = await sequelize.query(
      "SELECT COUNT(*) as count FROM Quizzes",
      { type: QueryTypes.SELECT }
    ) as [{ count: number }, unknown];

    const existingQuizCount = existingQuizzes.count;
    
    if (existingQuizCount === 0) {
      console.log('Adding quizzes...');
      
      // Add quizzes using direct SQL
      for (const quiz of sampleQuizzes) {
        await sequelize.query(
          `INSERT INTO Quizzes (title, description, categories, creatorId, questionTimeLimit, answerTimeLimit, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, 60, 60, datetime('now'), datetime('now'))`,
          { 
            replacements: [
              quiz.title,
              quiz.description,
              JSON.stringify(quiz.categories),
              adminUserId
            ],
            type: QueryTypes.INSERT 
          }
        );
      }
      
      console.log(`Added ${sampleQuizzes.length} quizzes to the database.`);
    } else {
      console.log(`There are already ${existingQuizCount} quizzes in the database.`);
    }
  } catch (error) {
    console.error('Error adding quizzes:', error);
    throw error;
  }
} 