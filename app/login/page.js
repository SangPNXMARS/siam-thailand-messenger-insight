export default function LoginPage({ searchParams }) {
  const next = searchParams?.next || "/";
    const hasError = searchParams?.error === "1";

      return (
          <div className="login-wrap">
                <div className="login-card">
                        <h1>Insight Khách hàng — SIAM Thailand</h1>
                                <p>Trang chứa số điện thoại thật của khách hàng. Nhập mật khẩu để tiếp tục.</p>
                                        <form method="POST" action="/api/login">
                                                  <input type="hidden" name="next" value={next} />
                                                            <input type="password" name="password" placeholder="Mật khẩu" autoFocus required />
                                                                      {hasError && <div className="login-error">Sai mật khẩu, thử lại nhé.</div>}
                                                                                <button type="submit">Đăng nhập</button>
                                                                                        </form>
                                                                                              </div>
                                                                                                  </div>
                                                                                                    );
                                                                                                    }
                                                                                                    
