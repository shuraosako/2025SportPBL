"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, updatePassword, updatePhoneNumber, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageURL, setCurrentImageURL] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchCurrentProfileImage = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData?.imageURL) {
              setCurrentImageURL(userData.imageURL);
            }
          }
        } catch (error) {
          console.error("Error fetching current profile image:", error);
        }
      }
    };
    fetchCurrentProfileImage();
  }, [user]);

  const toggleProfilePopup = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handlePhoneNumberSignIn = async () => {
    if (!phoneNumber) {
      alert("Please enter your phone number.");
      return;
    }

    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
      recaptchaVerifier.render();

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      alert("OTP sent to your phone number.");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId || !otp) {
      alert("Please enter the OTP.");
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      if (user) {
        await updatePhoneNumber(user, credential);
        alert("Phone number updated successfully.");
      } else {
        alert("User not logged in.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Failed to verify OTP. Please try again.");
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      alert("User not logged in.");
      return;
    }

    setIsLoading(true);
    const updates: any = {};
    const imageRef = ref(storage, `profile-images/${user.uid}`);

    try {
      if (newPassword) {
        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters long.");
          setIsLoading(false);
          return;
        }

        await updatePassword(user, newPassword);
        alert("Password updated successfully.");
      }

      if (newUsername) {
        updates.username = newUsername;
      }

      if (profileImage) {
        if (!profileImage.type.startsWith('image/')) {
          alert("Invalid file type. Please upload an image.");
          setIsLoading(false);
          return;
        }

        await uploadBytes(imageRef, profileImage);
        const imageURL = await getDownloadURL(imageRef);
        updates.imageURL = imageURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "users", user.uid), updates);
        alert("Profile updated successfully.");
      } else {
        alert("No changes to save.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProfileImage(file);
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewImage(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className="profile-container">
        {isLoading && <div className="loading-spinner">{t("profile.saving")}</div>}

        <div className="profile-header">
          <h1 className="profile-title">{t("profile.title")}</h1>
        </div>

        <div className="profile-content">
          {/* Left Column - Profile Image */}
          <div className="profile-sidebar">
            <div className="profile-image-card">
              <div className="profile-image-wrapper">
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
                  {t("profile.uploadPhoto")}
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Information */}
          <div className="profile-main">
            <div className="profile-card">
              <h2 className="section-title">アカウント情報</h2>

              <div className="form-group">
                <label className="form-label">{t("profile.newUsername")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ユーザー名を入力"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("profile.newPassword")}</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新しいパスワード (6文字以上)"
                />
              </div>
            </div>

            <div className="profile-card">
              <h2 className="section-title">電話番号認証</h2>

              <div className="form-group">
                <label className="form-label">{t("profile.phoneNumber")}</label>
                <div className="input-button-group">
                  <input
                    type="tel"
                    className="form-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+81 90-1234-5678"
                  />
                  <button className="btn-secondary" onClick={handlePhoneNumberSignIn}>
                    {t("profile.sendOTP")}
                  </button>
                </div>
              </div>

              {verificationId && (
                <div className="form-group">
                  <label className="form-label">{t("profile.otp")}</label>
                  <div className="input-button-group">
                    <input
                      type="text"
                      className="form-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="認証コードを入力"
                    />
                    <button className="btn-secondary" onClick={handleVerifyOtp}>
                      {t("profile.verifyOTP")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="save-button-container">
              <button className="btn-primary" onClick={handleSaveChanges} disabled={isLoading}>
                {t("profile.saveChanges")}
              </button>
            </div>
          </div>
        </div>

        <div id="recaptcha-container"></div>
      </div>
    </>
  );
}