import type { Request } from 'express';
import { Router } from 'express';
import type { Response } from 'express';

const router: Router = Router();

router.get('/migrations', (req: Request, res: Response) => {
	return res.send({ response: 'ok' });
});

export default router;