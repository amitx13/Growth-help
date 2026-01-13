// types.ts

import { UserLevel } from "./user";

export interface TeamMember {
  id: string;
  userId: string;
  positionType: 'ORIGINAL' | 'REENTRY';
  placedUnderPositionId: string | null;
  currentLevel: number;
  isActive: boolean;
  directReferralCount: number;
  createdAt: string;
  user:{
    id:string,
    name:string,
    mobile:String,
  }
}

export interface TeamByLevel {
  [level: number]: TeamMember[];
}

export interface UserPositionWithTeam {
  id: string;
  currentLevel: number;
  positionType: 'ORIGINAL' | 'REENTRY';
  isActive: boolean;
  placedUnderPositionId: string | null;
  directReferralCount: number;
  userLevels: UserLevel[];
  team: TeamByLevel;
}

