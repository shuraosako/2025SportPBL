export interface PlayerData {
  id: string;
  documentId?: string;
  date: string;
  speed: number;
  spin: number;
  trueSpin: number;
  spinEff: number;
  spinDirection: string;
  verticalMovement: number;
  horizontalMovement: number;
  strike: number;
  releasePoint: number;
  absorption: string;
}

export type SortableField = keyof PlayerData;

export interface Player {
  id: string;
  name: string;
  grade: string;
  height: string;
  weight: string;
  throwingHand?: string;  
  favoritePitch?: string; 
  creationDate: any;
  imageURL?: string;
}
