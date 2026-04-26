declare const process: { env: Record<string, string | undefined> };

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || '5000';

app.use(cors());
app.use(express.json());

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ success: true, message: 'RAG Knowledge Assistant API is running' });
});

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});

export default app;
