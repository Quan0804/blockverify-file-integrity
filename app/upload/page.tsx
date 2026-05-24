"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";
import contractMeta from "../contract.json";

type HashState = {
  fileName: string;
  fileSize: number;
  fileType: string;
  hash: string;
};

type SavedEntry = {
  fileId: string;
  fileName: string;
  hash: string;
  createdAt: number;
};

export default function UploadPage() {
  const [hashState, setHashState] = useState<HashState | null>(null);
  const [status, setStatus] = useState("Chưa có file");
  const [isBusy, setIsBusy] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("bv_fileids");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedEntry[];
      return parsed
        .map((entry) => ({
          fileId: String(entry.fileId ?? ""),
          fileName: String(entry.fileName ?? ""),
          hash: String(entry.hash ?? ""),
          createdAt: Number(entry.createdAt ?? 0),
        }))
        .filter((entry) => entry.fileId.length > 0);
    } catch {
      return [];
    }
  });

  const contractAddress = contractMeta.contractAddress;
  const contractAbi = useMemo(() => contractMeta.abi, []);
  const storageKey = "bv_fileids";
  const ethereum =
    typeof window !== "undefined"
      ? (window.ethereum as Eip1193Provider | undefined)
      : undefined;

  const ensureWalletReady = async () => {
    if (!ethereum) {
      setStatus("Chưa có MetaMask");
      return null;
    }
    const provider = new BrowserProvider(ethereum);
    try {
      await provider.send("eth_requestAccounts", []);
    } catch (error) {
      console.error(error);
      setStatus("Bạn chưa cấp quyền ví");
      return null;
    }

    if (contractAddress) {
      const code = await provider.getCode(contractAddress);
      if (!code || code === "0x") {
        setStatus("Contract chưa deploy trên network hiện tại");
        return null;
      }
    }

    return provider;
  };

  const saveFileId = (entry: SavedEntry) => {
    const safeEntry = {
      fileId: String(entry.fileId),
      fileName: String(entry.fileName),
      hash: String(entry.hash),
      createdAt: Number(entry.createdAt),
    };
    const next = [safeEntry, ...saved].slice(0, 20);
    setSaved(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const computeHash = async (file: File) => {
    setIsBusy(true);
    setStatus("Đang tính SHA-256...");
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      setHashState({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "unknown",
        hash,
      });
      setFileId(null);
      setTxHash(null);
      setStatus("Đã tính xong");
    } catch (error) {
      console.error(error);
      setStatus("Lỗi khi tính hash");
      setHashState(null);
    } finally {
      setIsBusy(false);
    }
  };

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      computeHash(file);
    }
  };

  const copyHash = async () => {
    if (!hashState?.hash) return;
    await navigator.clipboard.writeText(hashState.hash);
    setStatus("Đã sao chép hash");
  };

  const lookupFileId = async () => {
    if (!hashState?.hash) return;
    if (!contractAddress || !contractAbi?.length) {
      setStatus("Chưa có contract. Hãy deploy trước.");
      return;
    }

    try {
      setIsBusy(true);
      setStatus("Đang tìm FileID...");
      const provider = await ensureWalletReady();
      if (!provider) return;
      const contract = new Contract(contractAddress, contractAbi, provider);
      const id = await contract.findFileByHash(hashState.hash);
      const nextId = id ? String(id) : "";
      setFileId(nextId || null);
      setStatus(nextId ? "Đã tìm thấy FileID" : "Không tìm thấy FileID");
    } catch (error) {
      console.error(error);
      const message = (error as Error)?.message || "";
      setStatus(message ? `Lỗi khi tìm FileID: ${message}` : "Lỗi khi tìm FileID");
    } finally {
      setIsBusy(false);
    }
  };

  const registerOnChain = async () => {
    if (!hashState) return;
    if (!contractAddress || !contractAbi?.length) {
      setStatus("Chưa có contract. Hãy deploy trước.");
      return;
    }

    try {
      setIsBusy(true);
      setStatus("Đang gửi giao dịch...");
      const provider = await ensureWalletReady();
      if (!provider) return;
      const readContract = new Contract(contractAddress, contractAbi, provider);
      const existingId = await readContract.findFileByHash(hashState.hash);
      const existingIdText = existingId ? String(existingId) : "";
      if (existingIdText) {
        setFileId(existingIdText);
        setStatus("Hash đã được đăng ký trước đó");
        return;
      }

      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractAbi, signer);

      const tx = await contract.registerFile(
        hashState.hash,
        hashState.fileName,
        hashState.fileType,
        hashState.fileSize,
        ""
      );
      setTxHash(tx.hash);
      setStatus("Đang chờ xác nhận...");
      const receipt = await tx.wait();

      const newFileId = await readContract.findFileByHash(hashState.hash);
      const nextId = newFileId ? String(newFileId) : "";

      setFileId(nextId || null);
      if (nextId) {
        saveFileId({
          fileId: nextId,
          fileName: hashState.fileName,
          hash: hashState.hash,
          createdAt: Date.now(),
        });
      }
      setStatus(nextId ? "Đăng ký thành công" : "Đã ghi hash");
    } catch (error) {
      console.error(error);
      const message = (error as Error)?.message || "";
      setStatus(message ? `Giao dịch thất bại: ${message}` : "Giao dịch thất bại");
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
            <div>Upload & SHA-256</div>
            <div className="pill">Bước 01</div>
          </div>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-ghost" href="/">
            Về trang chủ
          </Link>
          <Link className="btn btn-ghost" href="/metamask">
            Kết nối ví
          </Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1 className="hero-title">Upload file và băm SHA-256 ngay trên trình duyệt.</h1>
          <p className="hero-sub">
            File không cần gửi lên server. Hash sẽ được sử dụng để ghi lên
            blockchain và sinh FileID.
          </p>
          <div className="tag-list tag-list-spaced">
            <span className="tag">Băm phía trình duyệt</span>
            <span className="tag">SHA-256</span>
            <span className="tag">Không upload file</span>
          </div>
        </div>
        <div className="card upload-card">
          <label className="dropzone">
            <input type="file" onChange={onPickFile} disabled={isBusy} accept="*/*" />
            <div className="dropzone-title">Kéo thả file hoặc click để chọn</div>
            <div className="dropzone-sub">Hỗ trợ mọi định dạng, kể cả ảnh</div>
          </label>
          <div className="upload-status">Trạng thái: {status}</div>
          <button className="btn" onClick={registerOnChain} disabled={!hashState || isBusy}>
            Ghi hash lên blockchain
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Thông tin hash</h2>
          <p className="section-sub">
            Hash sẽ được lưu trên blockchain ở bước tiếp theo.
          </p>
        </div>
        <div className="grid">
          <div className="card">
            <h3 className="card-title">Thông tin file</h3>
            <div className="file-meta">
              <div>
                <div className="stat-label">Tên file</div>
                <div className="stat-value">{hashState?.fileName || "-"}</div>
              </div>
              <div>
                <div className="stat-label">Kích thước</div>
                <div className="stat-value">
                  {hashState ? `${(hashState.fileSize / 1024).toFixed(2)} KB` : "-"}
                </div>
              </div>
              <div>
                <div className="stat-label">Loại</div>
                <div className="stat-value">{hashState?.fileType || "-"}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">SHA-256 Hash</h3>
            <div className="hash-box mono">
              {hashState?.hash || "Chưa có hash"}
            </div>
            <button className="btn" onClick={copyHash} disabled={!hashState?.hash}>
              Sao chép hash
            </button>
          </div>
          <div className="card">
            <h3 className="card-title">Thông tin on-chain</h3>
            <div className="file-meta">
              <div>
                <div className="stat-label">FileID</div>
                <div className="stat-value mono">{fileId || "-"}</div>
              </div>
              <div>
                <div className="stat-label">Giao dịch</div>
                <div className="stat-value mono">
                  {txHash ? `${txHash.slice(0, 14)}...` : "-"}
                </div>
              </div>
              <div>
                <div className="stat-label">Hợp đồng</div>
                <div className="stat-value mono">
                  {contractAddress ? `${contractAddress.slice(0, 10)}...` : "-"}
                </div>
              </div>
            </div>
            <button className="btn" onClick={lookupFileId} disabled={!hashState?.hash || isBusy}>
              Tìm FileID theo hash
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">FileID đã lưu</h2>
          <p className="section-sub">
            Danh sách được lưu trong trình duyệt để dễ tra cứu lại.
          </p>
        </div>
        <div className="card">
          {saved.length ? (
            <div className="saved-list">
              {saved.map((entry) => (
                <div className="saved-item" key={`${entry.fileId}-${entry.createdAt}`}>
                  <div>
                    <div className="stat-label">FileID</div>
                    <div className="stat-value mono">{String(entry.fileId)}</div>
                    <div className="saved-meta">
                      {entry.fileName} · {new Date(entry.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigator.clipboard.writeText(entry.fileId)}
                  >
                    Sao chép
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="section-sub">Chưa có FileID nào.</div>
          )}
        </div>
      </section>
    </main>
  );
}
