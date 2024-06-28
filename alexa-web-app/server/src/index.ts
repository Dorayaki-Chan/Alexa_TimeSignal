import express,  { Express, Request, Response } from 'express';
import session from 'express-session';
import cors from 'cors';


const port = 3001;
const secretKey = 'your_secret_key';

declare module 'express-session' {
    interface SessionData {
        user: string;
    }
}

class App {
    private app: Express;
    private port: number;
    private secretKey: string;


    constructor(port: number, secretKey: string) {
        this.app = express();
        this.port = port;
        this.secretKey = secretKey;
        this.configureMiddleware();
        this.configureRoutes();
    }

    private configureMiddleware(): void {
        this.app.use(cors({
            origin: ['http://localhost:5173', 'http://192.168.1.10:5173', 'http://192.168.1.2'],
            credentials: true
        }));
        this.app.use(express.json());
        this.app.use(session({
            secret: this.secretKey,
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }
        }));
    }

    private configureRoutes(): void {
        this.app.get('/', (req, res) => this.home(req, res));
        this.app.post('/login', (req, res) => this.login(req, res));
        this.app.get('/hello', (req, res) => this.hello(req, res));
        this.app.get('/config', (req, res) => this.config(req, res));
    }

    private home(req: Request, res: Response): void {
        res.status(200).send('Hello World!Type Script!');
    }

    private login(req: Request, res: Response): void {
        console.log('POST通過！');
        const { username, password } = req.body;
        if (username === 'user' && password === 'password') {
            req.session.user = username;
            console.log('ログイン成功！', req.session.user);
            res.status(200).json({ user: username });
        } else {
            res.status(401).json({ message: '認証に失敗しました' });
        }
    }

    private hello(req: Request, res: Response): void {
        console.log('GET通過！');
        if (req.session.user) {
            res.json({ message: `Hello ${req.session.user}` });
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }

    private config(req: Request, res: Response): void {
        console.log('GET通過！');
        if (req.session.user) {
            res.json({ user: req.session.user });
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }

    public listen(): void {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`Server is running on ${this.port}`);
        });
    }
}


const myApp = new App(port, secretKey);
myApp.listen();