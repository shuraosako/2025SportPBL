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

  // Handle image file selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);

      // Preview image
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

      // Upload image to Firebase Storage
      if (image) {
        const imageRef = ref(storage, `player-images/${image.name}`);
        await uploadBytes(imageRef, image);
        imageDownloadURL = await getDownloadURL(imageRef);
      }

      // Add player data to Firestore
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

      // Clear form fields and image preview
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
        <div className="add-player-form">
          <h2>{t("createPlayer.title")}</h2>

          {/* Profile Image Preview */}
          {imageURL && (
            <div className="image-preview">
              <Image src={imageURL} alt="Profile Preview" width={100} height={100} className="profile-image" />
            </div>
          )}

          <form onSubmit={handleAddPlayer}>
            <label>{t("createPlayer.name")}:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />

            <label>{t("createPlayer.grade")}:</label>
            <input
              type="number"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            />

            <label>{t("createPlayer.height")}:</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
            />

            <label>{t("createPlayer.weight")}:</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <label>{t("createPlayer.throwingHand")}:</label>
            <select
              value={throwingHand}
              onChange={(e) => setThrowingHand(e.target.value)}
              required
            >
              <option value="">{t("createPlayer.selectThrowingHand")}</option>
              <option value="right">{t("createPlayer.rightHanded")}</option>
              <option value="left">{t("createPlayer.leftHanded")}</option>
            </select>

            <label>{t("createPlayer.favoritePitch")}:</label>
            <select
              value={favoritePitch}
              onChange={(e) => setFavoritePitch(e.target.value)}
              required
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

            {/* Image Upload */}
            <label>{t("createPlayer.photo")}:</label>
            <input type="file" accept="image/*" onChange={handleImageChange} required />

            <button type="submit">{t("createPlayer.submit")}</button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

    </>
  );
}