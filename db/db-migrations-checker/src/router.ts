import type { Request } from 'express';
import { Router } from 'express';
import type { Response } from 'express';
import { initialiseDbConnection } from '../../../shared/rds';
const router: Router = Router();

router.get('/migrations', async (_: Request, res: Response) => {
    const { sql, closeDbConnection } = await initialiseDbConnection();
    const migrations = await sql`SELECT script FROM flyway_schema_history order by installed_on desc limit 1`;
    await closeDbConnection();
	return res.send({ migrations });
});

export default router;