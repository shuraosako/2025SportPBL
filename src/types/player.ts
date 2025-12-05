// Player related types

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Player {
  id: string;
  name: string;
  nameEn?: string;
  grade: string;
  height: number | string;
  weight: number | string;
  throwingHand?: string;
  favoritePitch?: string;
  imageURL?: string;
  creationDate?: FirebaseTimestamp | string;
  condition?: 'healthy' | 'injured' | 'sick';
}

export interface PlayerData {
  id: string;
  documentId?: string;
  date: string;
  speed: number;
  spin: number;
  trueSpin?: number;
  spinEff?: number;
  spinDirection?: string;
  verticalMovement?: number;
  horizontalMovement?: number;
  strike?: number;
  releasePoint?: number;
  absorption?: string;
  rating?: string;
  releaseSpeed?: number;
  spinRate?: number;
  verticalBreak?: number;
  inducedVerticalBreak?: number;
  horizontalBreak?: number;
  releaseHeight?: number;
  releaseSide?: number;
  extension?: number;
  verticalApproachAngle?: number;
  plateLocationSide?: number;
  plateLocationHeight?: number;
  playerId?: string;
  name?: string;
}

export type SortableField = keyof PlayerData;
