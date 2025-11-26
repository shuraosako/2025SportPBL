"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, updatePassword, updatePhoneNumber, signOut, updateEmail } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider } from "firebase/auth";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  
  // 画像関連
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImageURL, setCurrentImageURL] = useState<string | null>(null);
  
  // 状態管理
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // 電話番号認証
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  
  // プライバシー設定
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  
  // 統計情報
  const [creationDate, setCreationDate] = useState<string | null>(null);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  
  // モーダル
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentImageURL(userData?.imageURL || null);
            setNewUsername(userData?.username || "");
            setBio(userData?.bio || "");
            setEmail(user.email || "");
            setOrganization(userData?.organization || "");
            setIsProfilePublic(userData?.isProfilePublic ?? true);
            setIsSearchable(userData?.isSearchable ?? true);
            
            // アカウント作成日
            if (user.metadata.creationTime) {
              setCreationDate(new Date(user.metadata.creationTime).toLocaleDateString('ja-JP'));
            }
            
            // 最終ログイン日
            if (user.metadata.lastSignInTime) {
              setLastLoginDate(new Date(user.metadata.lastSignInTime).toLocaleDateString('ja-JP'));
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
  };

  const handlePhoneNumberSignIn = async () => {
    if (!phoneNumber) {
      showMessage('error', '電話番号を入力してください。');
      return;
    }

    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      recaptchaVerifier.render();

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      showMessage('success', 'OTPを送信しました。');
    } catch (error) {
      console.error("Error sending OTP:", error);
      showMessage('error', 'OTPの送信に失敗しました。');
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId || !otp) {
      showMessage('error', 'OTPを入力してください。');
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      if (user) {
        await updatePhoneNumber(user, credential);
        showMessage('success', '電話番号を更新しました。');
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showMessage('error', 'OTPの検証に失敗しました。');
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      showMessage('error', 'ログインしていません。');
      return;
    }

    // パスワード確認
    if (newPassword && newPassword !== confirmPassword) {
      showMessage('error', 'パスワードが一致しません。');
      return;
    }

    setIsLoading(true);
    const updates: any = {};
    let hasChanges = false;

    try {
      // パスワード更新
      if (newPassword) {
        if (newPassword.length < 6) {
          showMessage('error', 'パスワードは6文字以上で入力してください。');
          setIsLoading(false);
          return;
        }
        await updatePassword(user, newPassword);
        hasChanges = true;
      }

      // その他の更新
      if (newUsername) updates.username = newUsername;
      if (bio) updates.bio = bio;
      if (organization) updates.organization = organization;
      updates.isProfilePublic = isProfilePublic;
      updates.isSearchable = isSearchable;

      // プロフィール画像更新
      if (profileImage) {
        if (!profileImage.type.startsWith('image/')) {
          showMessage('error', '画像ファイルを選択してください。');
          setIsLoading(false);
          return;
        }

        const imageRef = ref(storage, `profile-images/${user.uid}`);
        await uploadBytes(imageRef, profileImage);
        const imageURL = await getDownloadURL(imageRef);
        updates.imageURL = imageURL;
        
        setCurrentImageURL(imageURL);
        setPreviewImage(null);
        setProfileImage(null);
        hasChanges = true;
      }

      // Firestoreを更新
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "users", user.uid), updates);
        hasChanges = true;
      }

      if (hasChanges) {
        showMessage('success', 'プロフィールを更新しました！');
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showMessage('error', '変更する項目がありません。');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage('error', 'プロフィールの更新に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'ファイルサイズは5MB以下にしてください。');
        return;
      }

      setProfileImage(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewImage(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showMessage('success', 'ログアウトしました。');
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      showMessage('error', 'ログアウトに失敗しました。');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // プロフィール画像削除
      if (currentImageURL) {
        const imageRef = ref(storage, `profile-images/${user.uid}`);
        await deleteObject(imageRef).catch(() => {});
      }
      
      // Firestoreのユーザーデータ削除
      await deleteDoc(doc(db, "users", user.uid));
      
      // アカウント削除
      await user.delete();
      
      showMessage('success', 'アカウントを削除しました。');
      router.push('/');
    } catch (error) {
      console.error("Error deleting account:", error);
      showMessage('error', 'アカウントの削除に失敗しました。再ログインが必要な場合があります。');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className="profile-container">
        {isLoading && <div className="loading-spinner">保存中...</div>}

        <div className="profile-header">
          <h1 className="profile-title">プロフィール設定</h1>
        </div>

        {message && (
          <div className={`message-box ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          {/* Left Sidebar */}
          <div className="profile-sidebar">
            {/* Profile Image Card */}
            <div className="profile-image-card">
              <div className="profile-image-wrapper">
                {previewImage && <div className="preview-badge">プレビュー</div>}
                {(currentImageURL || previewImage) ? (
                  <Image
                    src={previewImage || currentImageURL || ''}
                    alt="Profile"
                    className="profile-avatar"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="avatar-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="image-upload-section">
                <label className="upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input-hidden"
                    onChange={handleImageChange}
                  />
                  📷 写真を選択
                </label>
                {previewImage && (
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '12px' }}>
                    ※「変更を保存」を押すと反映されます
                  </p>
                )}
              </div>
            </div>

            {/* Account Stats Card */}
            <div className="account-stats-card">
              <h3 className="stats-title">📊 アカウント統計</h3>
              <div className="stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="stat-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="stat-label">アカウント作成日</span>
                <span className="stat-value">{creationDate || '不明'}</span>
              </div>
              <div className="stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="stat-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="stat-label">最終ログイン</span>
                <span className="stat-value">{lastLoginDate || '不明'}</span>
              </div>
              <div className="stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="stat-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="stat-label">メールアドレス</span>
                <span className="stat-value" style={{ fontSize: '0.8rem' }}>{email || '未設定'}</span>
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="profile-main">
            {/* Basic Information */}
            <div className="profile-card">
              <h2 className="section-title">👤 基本情報</h2>

              <div className="form-group">
                <label className="form-label">ユーザー名</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ユーザー名を入力"
                />
              </div>

              <div className="form-group">
                <label className="form-label">自己紹介</label>
                <textarea
                  className="form-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="自己紹介を入力してください..."
                  maxLength={500}
                />
                <div className="char-count">{bio.length}/500</div>
              </div>

              <div className="form-group">
                <label className="form-label">所属チーム/組織</label>
                <input
                  type="text"
                  className="form-input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="所属チームや組織を入力"
                />
              </div>

              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  disabled
                  placeholder="メールアドレス"
                />
              </div>
            </div>

            {/* Password Change */}
            <div className="profile-card">
              <h2 className="section-title">🔒 パスワード変更</h2>

              <div className="form-group">
                <label className="form-label">新しいパスワード</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新しいパスワード (6文字以上)"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="validation-message">パスワードは6文字以上で入力してください</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">パスワードの確認</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="もう一度パスワードを入力"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="validation-message">パスワードが一致しません</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                  <p className="validation-success">✓ パスワードが一致しています</p>
                )}
              </div>
            </div>

            {/* Phone Verification */}
            <div className="profile-card">
              <h2 className="section-title">📱 電話番号認証</h2>

              <div className="form-group">
                <label className="form-label">電話番号</label>
                <div className="input-button-group">
                  <input
                    type="tel"
                    className="form-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+81 90-1234-5678"
                  />
                  <button className="btn-secondary" onClick={handlePhoneNumberSignIn}>
                    📱 OTPを送信
                  </button>
                </div>
              </div>

              {verificationId && (
                <div className="form-group">
                  <label className="form-label">認証コード</label>
                  <div className="input-button-group">
                    <input
                      type="text"
                      className="form-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="認証コードを入力"
                    />
                    <button className="btn-secondary" onClick={handleVerifyOtp}>
                      ✓ 認証
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="profile-card">
              <h2 className="section-title">🔐 プライバシー設定</h2>

              <div className="toggle-container">
                <span className="toggle-label">プロフィールを公開</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isProfilePublic}
                    onChange={(e) => setIsProfilePublic(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-container">
                <span className="toggle-label">検索で表示</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isSearchable}
                    onChange={(e) => setIsSearchable(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="save-button-container">
              <button className="btn-primary" onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? '保存中...' : '💾 変更を保存'}
              </button>
            </div>

            <div className="save-button-container">
              <button className="btn-logout" onClick={() => setShowLogoutModal(true)}>
                🚪 ログアウト
              </button>
            </div>

            <div className="save-button-container">
              <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
                ⚠️ アカウントを削除
              </button>
            </div>
          </div>
        </div>

        <div id="recaptcha-container"></div>

        {/* Logout Modal */}
        {showLogoutModal && (
          <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">ログアウトしますか？</h2>
              <p className="modal-text">
                ログアウトすると、再度ログインする必要があります。
              </p>
              <div className="modal-buttons">
                <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>
                  キャンセル
                </button>
                <button className="btn-primary" onClick={handleLogout}>
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">⚠️ アカウントを削除しますか？</h2>
              <p className="modal-text">
                この操作は取り消せません。すべてのデータが完全に削除されます。
              </p>
              <div className="modal-buttons">
                <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  キャンセル
                </button>
                <button className="btn-danger" onClick={handleDeleteAccount}>
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}