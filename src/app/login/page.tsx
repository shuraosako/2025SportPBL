"use client";
 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  PhoneAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signInWithCredential
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import Navigation from "@/components/layout/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from './login.module.css';
 
export default function Login() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneSignIn, setShowPhoneSignIn] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // RecaptchaVerifierの初期化
  useEffect(() => {
    if (showPhoneSignIn && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
        },
      });
      setRecaptchaVerifier(verifier);
    }
  }, [showPhoneSignIn, recaptchaVerifier]);
 
  const handleLoginClick = async () => {
    setError("");
    setIsLoading(true);
 
    try {
      if (!showPhoneSignIn) {
        // メールログイン
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/home");
      } else {
        // 電話番号ログイン
        if (!recaptchaVerifier) {
          throw new Error("reCAPTCHA not initialized");
        }
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        setVerificationId(confirmationResult.verificationId);
        setError(t('login.otpSent'));
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to log in. Please check your credentials or try again.");
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleVerifyOtpClick = async () => {
    if (!verificationId || !otp) {
      setError(t('profile.otp') + "を入力してください");
      return;
    }
 
    setIsLoading(true);
    setError("");
    
    try {
      // credentialを作成してサインイン
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      router.push("/home");
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <>
      <Navigation showProfile={false} showHamburger={false} />
 
      <div className={styles.logunder}>
        <div className={styles.log}>
          <div className={styles.signInToggle}>
            <button type="button" onClick={() => setShowPhoneSignIn(false)}>
              {t('login.emailLogin')}
            </button>
            <button type="button" onClick={() => setShowPhoneSignIn(true)}>
              {t('login.phoneLogin')}
            </button>
          </div>
 
          {!showPhoneSignIn && (
            <>
              <div className="inputfield">
                <label>{t('login.email')}</label>
                <input
                  type="email"
                  id="mailaddress"
                  name="mailaddress"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="inputfield">
                <label>{t('login.password')}</label>
                <input
                  type="password"
                  id="pass"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
 
          {showPhoneSignIn && !verificationId && (
            <div className="inputfield">
              <label>{t('profile.phoneNumber')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+81 90-1234-5678"
                required
              />
            </div>
          )}
 
          {error && <div className={styles.error}>{error}</div>}
 
          {!verificationId && (
            <button
              type="button"
              onClick={handleLoginClick}
              disabled={isLoading}
              className={styles.loginButton}
            >
              {isLoading ? t('common.loading') : t('login.submit')}
            </button>
          )}
 
          {verificationId && (
            <div className="inputfield">
              <label>{t('profile.otp')}</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={t('login.verifyOTPPrompt')}
                required
              />
              <button
                type="button"
                onClick={handleVerifyOtpClick}
                disabled={isLoading}
                className={styles.loginButton}
              >
                {isLoading ? t('common.loading') : t('profile.verifyOTP')}
              </button>
            </div>
          )}
 
          <div className={styles.addition}>
            <Link href="/forgot_pass">＞{t('login.forgotPassword')}</Link>
            <br />
            <Link href="/New-Account">＞{t('login.createAccount')}</Link>
          </div>
        </div>
      </div>
 
      <div className={styles.last}>
        <div className={styles.lastLine}></div>
      </div>
 
      <div id="recaptcha-container"></div>
    </>
  );
}