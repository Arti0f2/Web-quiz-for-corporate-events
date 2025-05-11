import { Mongoose } from 'mongoose';

// Расширяем глобальный объект для TypeScript
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

export {}; 