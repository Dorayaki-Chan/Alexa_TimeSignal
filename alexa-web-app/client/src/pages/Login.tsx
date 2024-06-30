import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { SxProps } from '@mui/system'; // SxPropsのインポート

import { PageNameContext, TopBarImgContext } from '../parts/contexts.ts';

import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import TopBarImg from '../assets/img/bgg-dg-yl.png';

type CopyrightProps = {
	children?: React.ReactNode;
	sx?: SxProps;
}

function Copyright(props: CopyrightProps) {
	return (
		<Typography variant="body2" color="text.secondary" align="center" {...props}>
			{'Copyright © '}
			<Link color="inherit" href="https://mui.com/">
				Alexa情報統合システム
			</Link>{' '}
			{new Date().getFullYear()}
			{'.'}
		</Typography>
	);
}

type FormValues = {
	username: string;
	password: string;
}
type LoginErrors = {
	isFlag: boolean;
	msg: string;
}

function SignIn() {
	const initialFormValues: FormValues = {
		username: '',
		password: ''
	};
	const initialFormErrors: FormValues = {
		username: '',
		password: ''
	};
	const loginError: LoginErrors = {
		isFlag: false,
		msg: ''
	} 
	const [formValues, setFormValues] = useState(initialFormValues);
	const [formErrors, setFormErrors] = useState(initialFormErrors);
	const [isSubmit, setIsSubmit] = useState(false);
	const [loginRequest, setLoginRequest] = useState(loginError);
	const navigate = useNavigate();

	const { setPageName } = useContext(PageNameContext);
	const { setTopBarImg } = useContext(TopBarImgContext);

    useEffect(() => {
        setPageName('ログイン'); // ページ名を設定
		setTopBarImg(TopBarImg); // トップバーの画像を設定
    }, [setPageName, setTopBarImg]);

	const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormValues({
			...formValues,
			[name]: value
		});
	}
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const errors = validate(formValues);
		setFormErrors(errors);

		if (errors.username.length === 0 && errors.password.length === 0) {
			setIsSubmit(true);
			// APIリクエストを送信する
			axios.post('http://192.168.1.10:3001/api/login', formValues, {withCredentials: true})
			.then((response:any) => {
				console.log("結果", response);
				if (response.status === 200) {
					
					console.log('ログイン成功:', response.data);
					
					// 成功したアクションをここで行う
					navigate('/config');
				} 
			})
			.catch((error) => {
				if (error.response) {
					// エラーレスポンスが存在する場合、その中のメッセージを取得
					const errorMessage = error.response.data.message;
					if(errorMessage){
						setLoginRequest({
							isFlag: true,
							msg: errorMessage
						});
					}else{
						setLoginRequest({
							isFlag: true,
							msg: 'APIリクエストに失敗しました:404'
						});
					}
				} else {
					// エラーレスポンスがない場合の処理
					setLoginRequest({
						isFlag: true,
						msg: 'APIリクエストに失敗しました:404-2'
					});
				}
			});
		}
		/*const data = new FormData(event.currentTarget);
		console.log({
			username: data.get('username'),
			password: data.get('password'),
		});*/
	};
	const validate = (values:FormValues) => {
		const erros:FormValues = {
			username: '',
			password: ''
		};

		// 値が存在しないとき
		if (!values.username) {
			erros.username = 'ユーザー名を入力してください';
		}
		if (!values.password) {
			erros.password = 'パスワードを入力してください';
		}
		else if (values.password.length < 4) {
			erros.password = 'パスワードは4文字以上で入力してください';
		}
		return erros;
	}

	return (
		<Container component="main" maxWidth="xs">
			<CssBaseline />
			<Box
			sx={{
				marginTop: 8,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
			>
				{/* <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
					<LockOutlinedIcon />
				</Avatar>
				<Typography component="h1" variant="h5">
					ログイン
				</Typography> */}
				<Box component="form" onSubmit={(e) => handleSubmit(e)} noValidate sx={{ mt: 1 }}>
					<TextField
					margin="normal"
					required
					fullWidth
					id="username"
					label="ユーザー名"
					name="username"
					autoComplete="username"
					autoFocus
					onChange={(e) => handleChange(e)}
					/>
					<Typography variant="body1" color="error.main">
					{formErrors.username}
					</Typography>
					<TextField
					margin="normal"
					required
					fullWidth
					name="password"
					label="パスワード"
					type="password"
					id="password"
					autoComplete="current-password"
					onChange={(e) => handleChange(e)}
					/>
					<Typography variant="body1" color="error.main">
					{formErrors.password}
					</Typography>
					<FormControlLabel
					control={<Checkbox value="remember" color="primary" />}
					label="ログイン状態を保存"
					/>
					<Button
					type="submit"
					fullWidth
					variant="contained"
					sx={{ mt: 3, mb: 2 }}
					>
					ログイン
					</Button>
					{
						isSubmit && loginRequest.isFlag && (
							<Typography variant="body1" color="error.main">
								{loginRequest.msg}
							</Typography>
						)
					}
				</Box>
			</Box>

			<Copyright sx={{ mt: 8, mb: 4 }} />
		</Container>
	);
}


export default SignIn;
