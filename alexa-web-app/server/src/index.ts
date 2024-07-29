import express,  { Express, Request, Response } from 'express';
import session from 'express-session';
import cors from 'cors';

import os from 'os';


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
        this.app.get('/', (req, res) => this.getHome(req, res));
        this.app.post('/api/login', (req, res) => this.postLogin(req, res));
        this.app.get('/api/hello', (req, res) => this.getHello(req, res));
        this.app.get('/api/config', (req, res) => this.getConfig(req, res));
        this.app.put('/api/config', (req, res) => this.putConfig(req, res));
    }

    private getHome(req: Request, res: Response): void {
        res.status(200).send('Hello World!Type Script!');
    }

    private postLogin(req: Request, res: Response): void {
        // テスト用
        const [myusername, mypassword] = ['user', 'password']; 

        console.log('POST通過！');
        const { username, password } = req.body;
        if(username === myusername){
            if(password === mypassword){
                req.session.user = username;
                console.log('ログイン成功！', req.session.user);
                res.status(200).json({ user: username });
            }
            else{
                console.log('パスワードが異なります。');
                res.status(401).json({ message: 'パスワードが異なります。' });
            }
        }
        else{
            console.log('ユーザー名が異なります。');
            res.status(401).json({ message: 'ユーザー名が異なります。' });
        }
    }

    private getHello(req: Request, res: Response): void {
        console.log('GET通過！');
        if (req.session.user) {
            res.json({ message: `Hello ${req.session.user}` });
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }

    private getConfig(req: Request, res: Response): void {
        console.log('設定GET通過！');
        console.log(req.session.user);
        if (req.session.user) {
            const data = {
                kisho: {
                    flag: false,
                    time: '12:00',
                },
                shoto: {
                    flag: true,
                    time: '23:00',
                },
                stop: {
                    flag: false,
                    startDate: '2024-08-01',
                    endDate: '2024-08-31',
                }
            }
            res.status(200).json({ data: data });
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }

    private putConfig(req: Request, res: Response): void {
        console.log('設定PUT通過！');
        console.log(req.session.user);
        if (req.session.user) {
            const {kisho, shoto, stop} = req.body;
            console.log(kisho);
            console.log(shoto);
            console.log(stop);
            res.status(200).json({ user: req.session.user });
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }

    public listen(): void {
        this.app.listen(this.port, '0.0.0.0', () => {
            // 起動しているipアドレスを表示
            
            const ifaces = os.networkInterfaces();
            // console.log(ifaces['Wi-Fi']);
            if (!ifaces['Wi-Fi']) {
                console.log('Wi-Fi is not found');
                return;
            }
            else {
                const wifiAddress = ifaces['Wi-Fi'].find((i:os.NetworkInterfaceInfo) => i.family === 'IPv4')?.address;
                console.log(`\x1b[1mExpressServer\x1b[0m is running on`);
                console.log(`\t\x1b[1m\x1b[32m→\x1b[0m \x1b[1mlocal\x1b[0m: \x1b[36mhttp://localhost:${this.port}\x1b[0m`);
                console.log(`\t\x1b[1m\x1b[32m→\x1b[0m \x1b[1mnetwork\x1b[0m: \x1b[36mhttp://${wifiAddress}:${this.port}\x1b[0m`);
            }
        });
    }
}


const myApp = new App(port, secretKey);
myApp.listen();