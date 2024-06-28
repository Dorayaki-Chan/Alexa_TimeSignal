//import { useNavigate } from 'react-router-dom';



function Home() {

    return (
        <>
            <div>
                <h1>ホーム画面</h1> {/* 状態を使用してメッセージを表示 */}
                <p>このページは認証されたユーザーのみがアクセスできます。</p>
            </div>
            {Array.from({ length: 100 }, (_, i) => (
                <div key={i}>
                    <h1>ホーム画面</h1> {/* 状態を使用してメッセージを表示 */}
                    <p>このページは認証されたユーザーのみがアクセスできます。</p>
                </div>
            ))}
            
        </>
    );
}

export default Home;