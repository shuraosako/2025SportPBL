'use client';

import { Suspense } from 'react';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/layout/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./DataTablePage.module.css";

type UploadedRow = Record<string, any>;

function DataTableContent() {
 const { t } = useLanguage();
 const searchParams = useSearchParams();
 const playerId = searchParams.get("playerId");
 const [uploadedData, setUploadedData] = useState<UploadedRow[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   if (!playerId) {
     setLoading(false);
     return;
   }

   const fetchData = async () => {
     try {
       const subcollectionRef = collection(db, "players", playerId, "csvData");
       const snapshot = await getDocs(subcollectionRef);

       if (snapshot.empty) {
         setUploadedData([]);
       } else {
         const data = snapshot.docs.map((doc) => ({
           id: doc.id,
           ...doc.data(),
         }));
         setUploadedData(data);
       }
     } catch (error) {
       console.error("Error fetching data:", error);
     } finally {
       setLoading(false);
     }
   };

   fetchData();
 }, [playerId]);

 const headers = uploadedData.length
   ? Array.from(
       new Set(uploadedData.flatMap((row) => Object.keys(row)))
     )
   : [];

 const normalizedData = uploadedData.map((row) => {
   const normalizedRow: UploadedRow = {};
   headers.forEach((header) => {
     normalizedRow[header] = row[header] ?? "";
   });
   return normalizedRow;
 });

 if (loading) {
   return <p className={styles.message}>{t("dataTable.loading")}</p>;
 }

 if (!uploadedData || uploadedData.length === 0) {
   return <p className={styles.message}>{t("dataTable.noData")}</p>;
 }

 return (
   <>
     <Navigation showProfile={true} showHamburger={true} />
     <div className={styles.container}>
       <div className={styles.header}>
         <h1 className={styles.heading}>{t("dataTable.title")}</h1>
         <div className={styles.info}>
           <span className={styles.recordCount}>{t("player.totalRecords")}: {uploadedData.length}</span>
         </div>
       </div>
       <div className={styles.tableContainer}>
         <table className={styles.table}>
           <thead>
             <tr>
               {headers.map((key) => (
                 <th key={key}>{key}</th>
               ))}
             </tr>
           </thead>
           <tbody>
             {normalizedData.map((row, index) => (
               <tr key={index}>
                 {headers.map((key) => (
                   <td key={key}>
                     {typeof row[key] === "object" && row[key]?.seconds
                       ? new Date(row[key].seconds * 1000).toLocaleString()
                       : row[key].toString()}
                   </td>
                 ))}
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     </div>
   </>
 );
}

function LoadingFallback() {
  const { t } = useLanguage();
  return <p className={styles.message}>{t("dataTable.loading")}</p>;
}

export default function DataTable() {
 return (
   <Suspense fallback={<LoadingFallback />}>
     <DataTableContent />
   </Suspense>
 );
}