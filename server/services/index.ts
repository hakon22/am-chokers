import { DatabaseService } from '@server/db/database.service';

export const database = new DatabaseService();

await database.init();
