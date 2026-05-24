import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">BV</div>
          <div className="brand-text">
            <div>BlockVerify</div>
            <div className="pill">Hệ thống toàn vẹn file</div>
          </div>
        </div>
        <nav className="nav">
          <a href="#overview">Mô tả</a>
          <a href="#flow">Quy trình</a>
          <a href="#verify">Xác thực</a>
          <Link href="/upload">Upload</Link>
          <Link href="/search">Tra cứu</Link>
          <Link href="/verify">Xác thực</Link>
        </nav>
      </header>

      <section className="hero" id="overview">
        <div>
          <h1 className="hero-title">
            Lưu trữ hash SHA-256 và xác thực file trên blockchain.
          </h1>
          <p className="hero-sub">
            Hệ thống cho phép upload file, băm SHA-256, lưu hash lên blockchain
            và sinh mã file để tìm kiếm. Khi cần, chỉ cần so sánh hash để phát
            hiện file bị sửa đổi.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/upload">
              Bắt đầu upload
            </Link>
            <Link className="btn" href="/metamask">
              Kết nối MetaMask
            </Link>
            <Link className="btn btn-ghost" href="/search">
              Tra cứu FileID
            </Link>
            <Link className="btn btn-ghost" href="/verify">
              Xác thực file
            </Link>
            <a className="btn btn-ghost" href="#flow">
              Xem luồng xử lý
            </a>
          </div>
        </div>
        <div className="card">
          <div className="pill">Tổng quan nhanh</div>
          <h2 className="card-title">Thông số nhanh</h2>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">Thuật toán băm</div>
              <div className="stat-value mono">SHA-256</div>
            </div>
            <div className="stat">
              <div className="stat-label">Lưu trữ</div>
              <div className="stat-value">On-chain</div>
            </div>
            <div className="stat">
              <div className="stat-label">Mã file</div>
              <div className="stat-value">FileID</div>
            </div>
            <div className="stat">
              <div className="stat-label">Xác thực</div>
              <div className="stat-value">So sánh hash</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="flow">
        <div className="section-head">
          <h2 className="section-title">Quy trình hoạt động</h2>
          <p className="section-sub">
            Chuỗi thao tác từ upload đến xác thực được tối ưu cho tốc độ và
            tính minh bạch.
          </p>
        </div>
        <div className="grid">
          <div className="card">
            <div className="step">
              <div className="step-num">01</div>
              <div>
                <div className="step-title">Upload và băm file</div>
                <div className="section-sub">
                  File được băm bằng SHA-256 trên trình duyệt. Không cần tải
                  file lên server.
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="step">
              <div className="step-num">02</div>
              <div>
                <div className="step-title">Ghi hash lên blockchain</div>
                <div className="section-sub">
                  Hash được ghi on-chain và sinh FileID để tìm kiếm nhanh.
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="step">
              <div className="step-num">03</div>
              <div>
                <div className="step-title">Xác thực tính toàn vẹn</div>
                <div className="section-sub">
                  Băm lại file và so sánh với hash đã lưu để phát hiện chỉnh
                  sửa.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="verify">
        <div className="section-head">
          <h2 className="section-title">Xác thực bằng FileID</h2>
          <p className="section-sub">
            Nhập FileID để trả về thông tin file và hash. So sánh hash với file
            hiện tại để kiểm tra toàn vẹn.
          </p>
        </div>
        <div className="grid">
          <div className="card">
            <h3 className="card-title">Tìm kiếm nhanh</h3>
            <p className="section-sub">
              FileID được sinh từ hash + timestamp + uploader. Dùng FileID để
              truy xuất thông tin và lịch sử.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">Đối chiếu hash</h3>
            <p className="section-sub">
              Hash gốc lưu trên chain không thể sửa. Bất kỳ sai khác nào cũng
              cho thấy file bị thay đổi.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">Ứng dụng</h3>
            <div className="tag-list">
              <span className="tag">Tài liệu</span>
              <span className="tag">Hợp đồng</span>
              <span className="tag">Chứng từ</span>
              <span className="tag">Báo cáo</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        BlockVerify - File integrity on blockchain. Mở rộng để kết hợp lưu trữ
        IPFS và truy cập file trong tương lai.
      </footer>
    </main>
  );
}
