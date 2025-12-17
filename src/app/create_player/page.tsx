"use client";

import { useState } from "react";
import "./create_player.css";
import { useRouter } from "next/navigation";
import Navigation from "@/components/layout/Navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Homepage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [grade, setGrade] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [throwingHand, setThrowingHand] = useState("");
  const [favoritePitch, setFavoritePitch] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImageURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlayer = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    if (!playerName || !grade || !height || !weight || !throwingHand || !favoritePitch || !image) {
      setError(t("createPlayer.errorAllFields"));
      return;
    }

    try {
      let imageDownloadURL = "";

      if (image) {
        const imageRef = ref(storage, `player-images/${image.name}`);
        await uploadBytes(imageRef, image);
        imageDownloadURL = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "players"), {
        name: playerName,
        grade: grade,
        height: height,
        weight: weight,
        throwingHand: throwingHand,
        favoritePitch: favoritePitch,
        creationDate: serverTimestamp(),
        imageURL: imageDownloadURL,
        condition: 'healthy'
      });

      setPlayerName("");
      setGrade("");
      setHeight("");
      setWeight("");
      setThrowingHand("");
      setFavoritePitch("");
      setImage(null);
      setImageURL(null);
      setError("");
      
      router.push("/");
    } catch (err) {
      console.error("Error adding player:", err);
      setError(t("createPlayer.errorFailed"));
    }
  };

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className="main-content">
        <div style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '0 20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '40px',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '30px',
              color: '#333',
              textAlign: 'center',
              borderBottom: '3px solid #00bcd4',
              paddingBottom: '15px'
            }}>
              {t("createPlayer.title")}
            </h2>

            {imageURL && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px'
              }}>
                <Image 
                  src={imageURL} 
                  alt="Profile Preview" 
                  width={120} 
                  height={120} 
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #00bcd4',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>
            )}

            <form onSubmit={handleAddPlayer}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '14px'
                }}>
                  {t("createPlayer.name")}:
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  placeholder={t("createPlayer.name")}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '14px'
                }}>
                  {t("createPlayer.grade")}:
                </label>
                <input
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  placeholder="例: 3"
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#555',
                    fontSize: '14px'
                  }}>
                    {t("createPlayer.height")}:
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'border-color 0.3s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="175"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#555',
                    fontSize: '14px'
                  }}>
                    {t("createPlayer.weight")}:
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'border-color 0.3s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="70"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '14px'
                }}>
                  {t("createPlayer.throwingHand")}:
                </label>
                <select
                  value={throwingHand}
                  onChange={(e) => setThrowingHand(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                >
                  <option value="">{t("createPlayer.selectThrowingHand")}</option>
                  <option value="right">{t("createPlayer.rightHanded")}</option>
                  <option value="left">{t("createPlayer.leftHanded")}</option>
                </select>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '14px'
                }}>
                  {t("createPlayer.favoritePitch")}:
                </label>
                <select
                  value={favoritePitch}
                  onChange={(e) => setFavoritePitch(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                >
                  <option value="">{t("createPlayer.selectFavoritePitch")}</option>
                  <option value="fastball">{t("createPlayer.fastball")}</option>
                  <option value="curveball">{t("createPlayer.curveball")}</option>
                  <option value="slider">{t("createPlayer.slider")}</option>
                  <option value="changeup">{t("createPlayer.changeup")}</option>
                  <option value="splitter">{t("createPlayer.splitter")}</option>
                  <option value="forkball">{t("createPlayer.forkball")}</option>
                  <option value="cutter">{t("createPlayer.cutter")}</option>
                </select>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '14px'
                }}>
                  {t("createPlayer.photo")}:
                </label>
                <div style={{
                  border: '2px dashed #e0e0e0',
                  borderRadius: '8px',
                  padding: '30px',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00bcd4';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{
                      fontSize: '48px',
                      color: '#00bcd4',
                      marginBottom: '10px'
                    }}>
                      📷
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {image ? image.name : t("createPlayer.photo")}
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <p style={{
                  color: '#f44336',
                  backgroundColor: '#ffebee',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#00bcd4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 6px rgba(0, 188, 212, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0097a7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 188, 212, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#00bcd4';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 188, 212, 0.3)';
                }}
              >
                {t("createPlayer.submit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}