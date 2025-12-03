"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, updatePassword, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Navigation from "@/components/layout/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import "./profile.css";
import "../home/home.css";

export default function ProfilePage({ params }: { params: { uid: string } }) {
  const router = useRouter();
  const { t } = useLanguage();
  const auth = getAuth();
  const user = auth.currentUser;

  // 基本情報
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [email, setEmail] = useState("");

  // プライベート情報
  const [birthDate, setBirthDate] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  // 画像関連
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImageURL, setCurrentImageURL] = useState<string | null>(null);

  // 状態管理
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // モーダル制御
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Firestore からユーザデータ取得
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setNewUsername(data.username || "");
          setEmail(user.email || "");
          setBirthDate(data.birthDate || "");
          setEmergencyContact(data.emergencyContact || "");
          setEmergencyName(data.emergencyName || "");
          setTeamCode(data.teamCode || "");
          setCurrentImageURL(data.imageURL || null);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProfileImage(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
  };

  // プロフィール保存
  const handleSaveChanges = async () => {
    if (!user) return;

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        showMessage("error", "パスワードが一致しません");
        return;
      }
    }

    setIsLoading(true);

    const updates: any = {};

    try {
      if (newPassword && newPassword.length >= 6) {
        await updatePassword(user, newPassword);
      }

      // 基本情報
      updates.username = newUsername;
      updates.birthDate = birthDate;
      updates.emergencyContact = emergencyContact;
      updates.emergencyName = emergencyName;

      // 画像アップロード
      if (profileImage) {
        const imgRef = ref(storage, `profile-images/${user.uid}`);
        await uploadBytes(imgRef, profileImage);
        const url = await getDownloadURL(imgRef);
        updates.imageURL = url;
        setCurrentImageURL(url);
      }

      await updateDoc(doc(db, "users", user.uid), updates);

      showMessage("success", "プロフィールを更新しました！");
    } catch (err) {
      console.error(err);
      showMessage("error", "更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // チームコード参加
  const handleJoinTeam = async () => {
    if (!teamCode || !user) {
      showMessage("error", "チームコードを入力してください");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid), { teamCode });
      showMessage("success", "チームに参加しました！");
    } catch {
      showMessage("error", "チーム参加に失敗しました");
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch {
      showMessage("error", "ログアウトに失敗しました");
    }
  };

  // アカウント削除
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // 画像削除
      if (currentImageURL) {
        await deleteObject(ref(storage, `profile-images/${user.uid}`)).catch(() => {});
      }

      // Firestore 削除
      await deleteDoc(doc(db, "users", user.uid));

      // Auth 削除
      await user.delete();

      router.push("/");
    } catch {
      showMessage("error", "削除に失敗しました。再ログインが必要です");
    }
  };

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className="profile-container">
        <h1 className="profile-title">プロフィール設定</h1>

        {message && (
          <div className={`message-box ${message.type === "success" ? "message-success" : "message-error"}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          {/* 左サイド */}
          <div className="profile-sidebar">
            <div className="profile-image-card">
              {previewImage ? (
                <img src={previewImage} className="profile-avatar" />
              ) : currentImageURL ? (
                <img src={currentImageURL} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">👤</div>
              )}

              <label className="upload-button">
                画像をアップロード
                <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input-hidden" />
              </label>

              <h3 className="profile-username">{newUsername}</h3>
            </div>
          </div>

          {/* 中央 基本情報 */}
          <div className="profile-main">
            <div className="profile-card">
              <h2 className="section-title">基本情報</h2>

              <div className="form-group">
                <label>ユーザー名</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>メールアドレス</label>
                <input value={email} disabled className="form-input" />
              </div>
            </div>

            <div className="profile-card">
              <h2 className="section-title">パスワード変更</h2>

              <div className="form-group">
                <label>新しいパスワード</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>確認用パスワード</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" />
              </div>
            </div>

            <button className="btn-primary" onClick={handleSaveChanges}>
              保存する
            </button>
          </div>

          {/* 右サイド */}
          <div className="profile-main-right">
            <div className="profile-card">
              <h2 className="section-title">プライベート情報</h2>

              <div className="form-group">
                <label>誕生日</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>緊急連絡先</label>
                <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>緊急連絡先の名前</label>
                <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="form-input" />
              </div>
            </div>

            <div className="profile-card">
              <h2 className="section-title">チーム参加</h2>
              <input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className="form-input" />
              <button className="btn-primary" onClick={handleJoinTeam}>
                参加する
              </button>
            </div>

            <button className="btn-logout" onClick={() => setShowLogoutModal(true)}>
              ログアウト
            </button>

            <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
              アカウント削除
            </button>
          </div>
        </div>
      </div>

      {/* ログアウトモーダル */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>ログアウトしますか？</h2>
            <button onClick={handleLogout}>ログアウト</button>
          </div>
        </div>
      )}

      {/* 削除モーダル */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>本当に削除しますか？</h2>
            <button onClick={handleDeleteAccount} className="btn-danger">
              削除する
            </button>
          </div>
        </div>
      )}
    </>
  );
}
