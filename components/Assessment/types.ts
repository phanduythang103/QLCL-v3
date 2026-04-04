import { Data83tc } from '../../readData83tc';
import { AssessmentSheet, KqDanhGia83 } from '../../readKqDanhGia83';
import { DmDonVi } from '../../readDmDonVi';

export type ViewMode = 'LIST' | 'FORM' | 'DETAIL';
export type ActiveTab = 'CRITERIA_83' | 'ASSESSMENT_REPORTS' | 'QUALITY_ASSESSMENT';

export interface AssessmentState {
  viewMode: ViewMode;
  activeTab: ActiveTab;
  sheetList: AssessmentSheet[];
  loading: boolean;
  saving: boolean;
  criteria: Data83tc[];
  results: Record<string, Partial<KqDanhGia83>>;
  editingPhieuId: string | null;
  viewingPhieuId: string | null;
  viewingData: KqDanhGia83[];
  units: DmDonVi[];
  fontSize: number;
  expandedPhan: string | null;
  expandedChuong: string | null;
  expandedTieuChi: string | null;
}

export { type Data83tc, type DmDonVi, type AssessmentSheet, type KqDanhGia83 };
