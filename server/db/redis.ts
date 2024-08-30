import { createClient } from 'redis';

const redis = await createClient()
  .on('error', (error) => console.log('Невозможно подключиться к Redis', error))
  .connect();

export default redis;
