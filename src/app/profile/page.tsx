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
        showMessage("error", t("profile.errorPasswordMismatch"));
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

      showMessage("success", t("profile.successProfileUpdated"));
    } catch (err) {
      console.error(err);
      showMessage("error", t("profile.errorUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  // チームコード参加
  const handleJoinTeam = async () => {
    if (!teamCode || !user) {
      showMessage("error", t("profile.errorTeamCodeRequired"));
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid), { teamCode });
      showMessage("success", t("profile.successTeamJoined"));
    } catch {
      showMessage("error", t("profile.errorTeamJoinFailed"));
    }
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch {
      showMessage("error", t("profile.errorLogoutFailed"));
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
      showMessage("error", t("profile.errorDeleteAccountFailed"));
    }
  };

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className="profile-container">
        <h1 className="profile-title">{t("profile.title")}</h1>

        {message && (
          <div className={`message-box ${message.type === "success" ? "message-success" : "message-error"}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          {/* 左サイド */}
          <div className="profile-sidebar">
            <div className="profile-image-card">
              <div className="profile-image-wrapper">
                {currentImageURL ?(
                  <Image
                    src={currentImageURL}
                    alt="Profile"
                    className="profile-avatar"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    </svg>
                  </div>
                )}
                <div className="image-hover-overlay">
                  <label className="image-hover-label">
                    {t("profile.changePhoto")}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input-hidden" />
                  </label>
                </div>
              </div>

              <h3 className="profile-username">{newUsername}</h3>
            </div>

            {/* ⬇️ ここに統計情報を追加 ⬇️ */}
  <div className="account-stats-card">
    <h3 className="stats-title">{t("profile.accountStats")}</h3>
    <div className="stat-item">
      <span className="stat-label">{t("profile.accountCreationDate")}</span>
      <span className="stat-value">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP') : '不明'}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">{t("profile.lastLogin")}</span>
      <span className="stat-value">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ja-JP') : '不明'}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">{t("profile.currentEmail")}</span>
      <span className="stat-value">{email || '未設定'}</span>
    </div>
  </div>

          </div>

          {/* 中央 基本情報 */}
          <div className="profile-main">
            <div className="profile-card">
              <h2 className="section-title">{t("profile.accountInfo")}</h2>

              <div className="form-group">{t("profile.currentUsername")}
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">{t("profile.currentEmail")}
                <input value={email} disabled className="form-input" />
              </div>
            </div>

            <div className="profile-card">
              <h2 className="section-title">{t("profile.changePassword")}</h2>

              <div className="form-group">
                <label>{t("profile.newPassword")}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>{t("profile.confirmPassword")}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" />
              </div>
            </div>
          <div className="save-button-container">
            <button className="btn-primary" onClick={handleSaveChanges} disabled={isLoading}>
              {isLoading ? t("profile.saving") : t("profile.saveChanges")}
            </button>
          </div>
        </div>

          {/* 右サイド */}
          <div className="profile-main-right">
            <div className="profile-card">
              <h2 className="section-title">{t("profile.privateInfo")}</h2>

              <div className="form-group">
                <label>{t("profile.birthDate")}</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>{t("profile.emergencyContact")}</label>
                <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>{t("profile.emergencyContactName")}</label>
                <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="form-input" />
              </div>
            </div>

            <div className="profile-card">
              <h2 className="section-title">{t("profile.teamParticipation")}</h2>
              <input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className="form-input" />
              <button className="btn-primary" onClick={handleJoinTeam}>
                {t("profile.join")}
              </button>
            </div>
          <div className="save-button=container">
            <button className="btn-logout" onClick={() => setShowLogoutModal(true)}>
              {t("profile.logout")}
            </button>
          </div>

          <div className="save-button=container">
            <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
              {t("profile.deleteAccount")}
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* ログアウトモーダル */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t("profile.logoutConfirmation")}</h2>
            <p  className="modal-text">{t("profile.logoutWarning")}</p>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={()=> setShowLogoutModal(false)}>
                {t("profile.cancel")}
              </button>
              <button className="btn-primary" onClick={handleLogout}>
                {t("profile.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除モーダル */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t("profile.deleteAccountConfirmation")}</h2>
            <p className="modal-text">{t("profile.deleteAccountWarning")}</p>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={()=> setShowDeleteModal(false)}>
                {t("profile.cancel")}
              </button>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                {t("profile.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
