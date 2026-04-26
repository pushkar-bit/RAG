import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Express API listening on port ${PORT}`);
});
