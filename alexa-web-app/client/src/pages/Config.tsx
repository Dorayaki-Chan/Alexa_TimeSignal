import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Config() {
    const [loginFlag, setloginFlag] = useState(false);
    const [name, setName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const request = async () => {
            try {
                const response = await axios.get('http://192.168.1.10:3001/api/config', {
                    withCredentials: true
                });
                console.log('Config:', response.data);
                if (response.status != 200){
                    navigate('/login');
                }
                setName(response.data.user);
                setloginFlag(true);
            } catch (error) {
                console.error('API呼び出し中にエラーが発生しました:', error);
                navigate('/login');
            }
        };
        request();
    }, [navigate]);

    return (
    <>
        {loginFlag ? (
            <>
                <h1>Config</h1>
                <p>設定画面です</p>
                <p>{name}さんこんにちは！</p>
            </>) : (
            <>
                <p>読み込み中</p>
            </>
        )}    
    </>
    );
}


export default Config;