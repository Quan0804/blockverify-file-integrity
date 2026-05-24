"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";
import contractMeta from "../contract.json";

type FileInfo = {
  fileId: string;
  sha256HashHex: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploader: string;
  timestamp: string;
  description: string;
};

export default function SearchPage() {
  const [fileId, setFileId] = useState("");
  const [status, setStatus] = useState("Nhập FileID để tra cứu");
  const [result, setResult] = useState<FileInfo | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const contractAddress = contractMeta.contractAddress;
  const contractAbi = useMemo(() => contractMeta.abi, []);
  const ethereum =
    typeof window !== "undefined"
      ? (window.ethereum as Eip1193Provider | undefined)
      : undefined;

  const formatTimestamp = (value: string) => {
    const raw = Number(value);
    if (!raw) return "-";
    return new Date(raw * 1000).toLocaleString("vi-VN");
  };

  const copyHash = async () => {
    if (!result?.sha256HashHex) return;
    await navigator.clipboard.writeText(result.sha256HashHex);
    setStatus("Đã sao chép hash");
  };

  const onSearch = async () => {
    const id = fileId.trim().toUpperCase();
    if (id.length !== 16) {
      setStatus("FileID cần đúng 16 ký tự");
      setResult(null);
      return;
    }
    if (!contractAddress || !contractAbi?.length) {
      setStatus("Chưa có contract. Hãy cập nhật contract.json");
      return;
    }
    if (!ethereum) {
      setStatus("Chưa có MetaMask");
      return;
    }

    try {
      setIsBusy(true);
      setStatus("Đang tra cứu...");
      const provider = new BrowserProvider(ethereum);
      const contract = new Contract(contractAddress, contractAbi, provider);
      const info = await contract.getFileInfo(id);

      setResult({
        fileId: info[0],
        sha256HashHex: info[1],
        fileName: info[2],
        fileType: info[3],
        fileSize: info[4].toString(),
        uploader: info[5],
        timestamp: info[6].toString(),
        description: info[7],
      });
      setStatus("Đã tìm thấy thông tin");
    } catch (error) {
      console.error(error);
      setResult(null);
      setStatus("Không tìm thấy FileID");
    } finally {
      setIsBusy(false);
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
            <div>Tra cứu FileID</div>
            <div className="pill">Bước 03</div>
          </div>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-ghost" href="/">
            Về trang chủ
          </Link>
          <Link className="btn btn-ghost" href="/upload">
            Upload
          </Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1 className="hero-title">Tra cứu thông tin file bằng FileID.</h1>
          <p className="hero-sub">
            FileID được sinh sau khi ghi hash lên blockchain. Hãy nhập FileID để
            xem chi tiết và hash gốc.
          </p>
        </div>
        <div className="card">
          <h2 className="card-title">Nhập FileID</h2>
          <div className="field">
            <input
              className="input"
              placeholder="VD: A3F8C2D1E5B70924"
              value={fileId}
              onChange={(event) => setFileId(event.target.value)}
              maxLength={16}
            />
            <button className="btn" onClick={onSearch} disabled={isBusy}>
              {isBusy ? "Đang tìm..." : "Tra cứu"}
            </button>
          </div>
          <div className="upload-status">Trạng thái: {status}</div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Kết quả</h2>
          <p className="section-sub">
            Hash gốc này được dùng để so sánh khi xác thực file.
          </p>
        </div>
        <div className="card">
          {result ? (
            <div className="result-grid">
              <div>
                <div className="stat-label">FileID</div>
                <div className="stat-value mono">{result.fileId}</div>
              </div>
              <div>
                <div className="stat-label">Hash</div>
                <div className="hash-chip mono">{result.sha256HashHex}</div>
                <button className="btn btn-ghost" onClick={copyHash}>
                  Sao chep hash
                </button>
              </div>
              <div>
                <div className="stat-label">Tên file</div>
                <div className="stat-value">{result.fileName}</div>
              </div>
              <div>
                <div className="stat-label">Loại</div>
                <div className="stat-value">{result.fileType || "-"}</div>
              </div>
              <div>
                <div className="stat-label">Kích thước</div>
                <div className="stat-value">{result.fileSize} bytes</div>
              </div>
              <div>
                <div className="stat-label">Uploader</div>
                <div className="stat-value mono">{result.uploader}</div>
              </div>
              <div>
                <div className="stat-label">Thời gian</div>
                <div className="stat-value">{formatTimestamp(result.timestamp)}</div>
              </div>
              <div>
                <div className="stat-label">Mô tả</div>
                <div className="stat-value">{result.description || "-"}</div>
              </div>
            </div>
          ) : (
            <div className="section-sub">Chưa có dữ liệu.</div>
          )}
        </div>
      </section>
    </main>
  );
}
