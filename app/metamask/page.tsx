"use client";

import Link from "next/link";
import { useState } from "react";
import { MetaMaskSDK } from "@metamask/sdk";

export default function MetaMaskPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Chưa kết nối");
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setStatus("Đang kết nối...");

      const sdk = new MetaMaskSDK({
        dappMetadata: {
          name: "BlockVerify",
          url: window.location.href,
        },
        // infuraAPIKey: "<YOUR_INFURA_KEY>",
      });

      const accounts = await sdk.connect();
      const first = accounts?.[0] || null;
      setAccount(first);
      setStatus(first ? "Đã kết nối" : "Không có tài khoản");
    } catch (err) {
      console.error("MetaMask connection failed", err);
      setStatus("Kết nối thất bại");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <main className="shell">
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">BV</div>
          <div className="brand-text">
            <div>Kết nối ví</div>
            <div className="pill">MetaMask SDK</div>
          </div>
        </div>
        <Link className="btn btn-ghost" href="/">
          Về trang chủ
        </Link>
      </header>

      <section className="hero">
        <div>
          <h1 className="hero-title">Bắt đầu kết nối ví để ký giao dịch.</h1>
          <p className="hero-sub">
            Sử dụng MetaMask SDK để kết nối ví. Nếu bạn dùng local Hardhat, hãy
            chọn network Localhost 8545 trong MetaMask.
          </p>
          <div className="hero-actions">
            <button className="btn" onClick={connect} disabled={isConnecting}>
              {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
            </button>
            <span className="pill">SDK Ready</span>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">Trạng thái kết nối</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <div>
                <div className="step-title">Mở MetaMask</div>
                <div className="section-sub">Mở khóa ví và chọn đúng network.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <div>
                <div className="step-title">Chấp nhận kết nối</div>
                <div className="section-sub">
                  Xác nhận account được phép truy cập.
                </div>
              </div>
            </div>
          </div>
          <div className="stat-grid" style={{ marginTop: "16px" }}>
            <div className="stat">
              <div className="stat-label">Trạng thái</div>
              <div className="stat-value">{account ? "Đã kết nối" : status}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Account</div>
              <div className="stat-value mono">
                {account ? account : "---"}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
