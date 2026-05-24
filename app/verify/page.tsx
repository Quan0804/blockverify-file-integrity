"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";
import contractMeta from "../contract.json";

type VerifyResult = {
  storedHash: string;
  currentHash: string;
  isValid: boolean;
  timestamp: string;
};

type FileMeta = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  imageWidth?: number;
  imageHeight?: number;
};

export default function VerifyPage() {
  const [fileId, setFileId] = useState("");
  const [status, setStatus] = useState("Nhap FileID va chon file");
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);

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

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  };

  const getImageSize = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error("Cannot load image"));
        img.src = url;
      });
      return dimensions;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const hashFile = async (file: File) => {
    setIsBusy(true);
    setStatus("Dang tinh SHA-256...");
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setCurrentHash(hash);
      setStatus("Da tinh hash, san sang xac thuc");
    } catch (error) {
      console.error(error);
      setStatus("Loi khi tinh hash");
      setCurrentHash(null);
    } finally {
      setIsBusy(false);
    }
  };

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const baseMeta: FileMeta = {
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        lastModified: file.lastModified,
      };
      setFileMeta(baseMeta);
      if (file.type.startsWith("image/")) {
        getImageSize(file)
          .then((dim) => {
            setFileMeta({ ...baseMeta, imageWidth: dim.width, imageHeight: dim.height });
          })
          .catch(() => {
            setFileMeta(baseMeta);
          });
      }
      hashFile(file);
    }
  };

  const verifyOnChain = async () => {
    const id = fileId.trim().toUpperCase();
    if (id.length !== 16) {
      setStatus("FileID can dung 16 ky tu");
      return;
    }
    if (!currentHash) {
      setStatus("Chua co hash tu file");
      return;
    }
    if (!contractAddress || !contractAbi?.length) {
      setStatus("Chua co contract. Hay cap nhat contract.json");
      return;
    }
    if (!ethereum) {
      setStatus("Chua co MetaMask");
      return;
    }

    try {
      setIsBusy(true);
      setStatus("Dang xac thuc...");
      const provider = new BrowserProvider(ethereum);
      const contract = new Contract(contractAddress, contractAbi, provider);
      const info = await contract.getFileInfo(id);
      const storedHash = info[1] as string;
      const timestamp = info[6].toString();
      const isValid = storedHash.toLowerCase() === currentHash.toLowerCase();

      setResult({
        storedHash,
        currentHash,
        isValid,
        timestamp,
      });
      setStatus(isValid ? "File nguyen ven" : "File da bi thay doi");
    } catch (error) {
      console.error(error);
      setResult(null);
      setStatus("Khong tim thay FileID");
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
            <div>Xac thuc file</div>
            <div className="pill">Buoc 04</div>
          </div>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-ghost" href="/">
            Ve trang chu
          </Link>
          <Link className="btn btn-ghost" href="/search">
            Tra cuu
          </Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1 className="hero-title">So sanh hash de kiem tra toan ven.</h1>
          <p className="hero-sub">
            Nhap FileID, chon file can kiem tra, he thong se bam lai va so sanh
            voi hash goc tren blockchain.
          </p>
        </div>
        <div className="card upload-card">
          <label className="dropzone">
            <input type="file" onChange={onPickFile} disabled={isBusy} />
            <div className="dropzone-title">Keo tha file hoac click de chon</div>
            <div className="dropzone-sub">Hash se duoc tinh tu file hien tai</div>
          </label>
          <div className="field">
            <input
              className="input"
              placeholder="Nhap FileID (16 ky tu)"
              value={fileId}
              onChange={(event) => setFileId(event.target.value)}
              maxLength={16}
            />
            <button className="btn" onClick={verifyOnChain} disabled={isBusy}>
              {isBusy ? "Dang kiem tra..." : "Xac thuc"}
            </button>
          </div>
          <div className="upload-status">Trang thai: {status}</div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Ket qua xac thuc</h2>
          <p className="section-sub">
            Ket qua duoc so sanh tu hash hien tai va hash goc tren blockchain.
          </p>
        </div>
        <div className="card">
          {result ? (
            <div className="verify-grid">
              <div>
                <div className="stat-label">Trang thai</div>
                <div className={`stat-value ${result.isValid ? "text-ok" : "text-fail"}`}>
                  {result.isValid ? "File nguyen ven" : "File da bi thay doi"}
                </div>
                <div className="stat-label">Thoi gian upload</div>
                <div className="stat-value">{formatTimestamp(result.timestamp)}</div>
                <div className="stat-label">Ten file</div>
                <div className="stat-value">{fileMeta?.name || "-"}</div>
                <div className="stat-label">Ngay gio file</div>
                <div className="stat-value">
                  {fileMeta?.lastModified
                    ? new Date(fileMeta.lastModified).toLocaleString("vi-VN")
                    : "-"}
                </div>
                <div className="stat-label">Dinh dang</div>
                <div className="stat-value">{fileMeta?.type || "-"}</div>
                {fileMeta?.type?.startsWith("image/") ? (
                  <>
                    <div className="stat-label">Kich thuoc anh</div>
                    <div className="stat-value">
                      {fileMeta.imageWidth && fileMeta.imageHeight
                        ? `${fileMeta.imageWidth} x ${fileMeta.imageHeight}px`
                        : "-"}
                    </div>
                  </>
                ) : null}
                <div className="stat-label">Dung luong</div>
                <div className="stat-value">{fileMeta ? formatBytes(fileMeta.size) : "-"}</div>
              </div>
              <div>
                <div className="stat-label">Hash tren chain</div>
                <div className="hash-chip mono">{result.storedHash}</div>
              </div>
              <div>
                <div className="stat-label">Hash hien tai</div>
                <div className="hash-chip mono">{result.currentHash}</div>
              </div>
            </div>
          ) : (
            <div className="section-sub">Chua co du lieu.</div>
          )}
        </div>
      </section>
    </main>
  );
}
