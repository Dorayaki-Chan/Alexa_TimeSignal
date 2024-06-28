import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function Copyright(props: any) {
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
	mailAddress: string;
	password: string;
}

function SignIn() {
	const initialFormValues: FormValues = {
		username: '',
		mailAddress: '',
		password: ''
	};
	const initialFormErrors: FormValues = {
		username: '',
		mailAddress: '',
		password: ''
	};
	const [formValues, setFormValues] = useState(initialFormValues);
	const [formErrors, setFormErrors] = useState(initialFormErrors);
	const [isSubmit, setIsSubmit] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [loginRequest, setLoginRequest] = useState(false);
	const navigate = useNavigate();

	const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
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
		const data = new FormData(event.currentTarget);
		console.log({
			username: data.get('username'),
			password: data.get('password'),
		});
	};
	const validate = (values:FormValues) => {
		const erros:FormValues = {
			username: '',
			mailAddress: '',
			password: ''
		};
		const regex = /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/;

		// 値が存在しないとき
		if (!values.username) {
			erros.username = 'ユーザー名を入力してください';
		}
		if (!values.mailAddress) {
			erros.mailAddress = 'メールアドレスを入力してください';
		}else if (!regex.test(values.mailAddress)) {
			erros.mailAddress = '正しいメールアドレスを入力してください';
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
			<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
				<LockOutlinedIcon />
			</Avatar>
			<Typography component="h1" variant="h5">
				ログイン
			</Typography>
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
			</Box>
			</Box>

			<Copyright sx={{ mt: 8, mb: 4 }} />
		</Container>
	);
	}

function App() {
	const initialFormValues: FormValues = {
		username: '',
		mailAddress: '',
		password: ''
	};
	const initialFormErrors: FormValues = {
		username: '',
		mailAddress: '',
		password: ''
	};
	const [formValues, setFormValues] = useState(initialFormValues);
	const [formErrors, setFormErrors] = useState(initialFormErrors);
	const [isSubmit, setIsSubmit] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [loginRequest, setLoginRequest] = useState(false);
	const navigate = useNavigate();
	

	const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
		// console.log(e.target.value);
		const { name, value } = e.target;
		// console.log(name, value);
		setFormValues({
			...formValues,
			[name]: value
		});
		// console.log(formValues);
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const errors = validate(formValues);
		setFormErrors(errors);
			
		if (errors.username.length === 0 && errors.mailAddress.length === 0 && errors.password.length === 0) {
			setIsSubmit(true);
			try {
				// APIリクエストを送信する
				axios.post('http://192.168.1.10:3001/login', formValues, {withCredentials: true})
				.then((response) => {
					if (response.status === 200) {
						
						console.log('ログイン成功:', response.data);
						
						// 成功したアクションをここで行う
						setIsLoggedIn(true);
						setLoginRequest(true);
						navigate('/config');
	
					} else if (response.status === 401) {
						setIsLoggedIn(false);
						throw new Error('APIリクエストに失敗しました');
					}
				})
				
			} catch (error) {
				console.error('エラーが発生しました:', error);
				setIsLoggedIn(false);
				// エラーハンドリングをここで行う
			}
		}
	};

	const validate = (values:FormValues) => {
		const erros:FormValues = {
		username: '',
		mailAddress: '',
		password: ''
    };
		const regex = /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/;

		// 値が存在しないとき
		if (!values.username) {
			erros.username = 'ユーザー名を入力してください';
		}
		if (!values.mailAddress) {
			erros.mailAddress = 'メールアドレスを入力してください';
		}else if (!regex.test(values.mailAddress)) {
			erros.mailAddress = '正しいメールアドレスを入力してください';
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
		<div className="formContainer">
			{!isLoggedIn ? (
				<form onSubmit={(e) => handleSubmit(e)}>
					<h1>ログインフォーム</h1>
					<hr />
					<div className='uiForm'>
						<div className='formField'>
							<label>ユーザー名</label>
							<input type="text" placeholder='ユーザー名' name='username' onChange={(e) => handleChange(e)}/>
						</div>
						<p className='errorMsg'>{formErrors.username}</p>
						<div className='formField'>
							<label>メールアドレス</label>
							<input type="text" placeholder='メールアドレス' name='mailAddress' onChange={(e) => handleChange(e)}/>
						</div>
						<p className='errorMsg'>{formErrors.mailAddress}</p>
						<div className='formField'>
							<label>パスワード</label>
							<input type="password" placeholder='パスワード' name='password' onChange={(e) => handleChange(e)}/>
						</div>
						<p className='errorMsg'>{formErrors.password}</p>
						<button className='submitButton'>ログイン</button>
						{/* {formErrors.username.length === 0 && formErrors.mailAddress.length === 0 && formErrors.password.length === 0 && formValues.username && formValues.mailAddress && formValues.password && isSubmit && (
							<div className='msgOk'>ログインに成功しました。</div>
						)} */}
						{
							isSubmit && !loginRequest && (
								<div className='msgError'>ログインに失敗しました。</div>
							)
						}
					</div>
				</form>
			) : (
				<div>ログイン成功！</div>
			)}
		</div>
	);
}

export default SignIn;
