import type { BaoCaoScyk } from '../readBaoCaoScyk';
import type { BcScnyknt } from '../readBcScnyknt';

export const NON_MEDICAL_INCIDENT_ID_PREFIX = 'scnyknt:';

export type LinkedIncidentSource = 'MEDICAL' | 'NON_MEDICAL';

export type LinkedIncident = BaoCaoScyk & {
  source: LinkedIncidentSource;
  original_id: string;
};

const formatNonMedicalCode = (item: BcScnyknt) => {
  const year = item.ngay_bao_cao?.slice(0, 4) || new Date().getFullYear().toString();
  return `SCNYK-${year}-${item.id.slice(0, 8).toUpperCase()}`;
};

export const normalizeMedicalIncident = (item: BaoCaoScyk): LinkedIncident => ({
  ...item,
  source: 'MEDICAL',
  original_id: item.id,
  nhom_bao_cao: item.nhom_bao_cao || 'Sự cố y khoa',
});

export const normalizeNonMedicalIncident = (item: BcScnyknt): LinkedIncident => ({
  id: `${NON_MEDICAL_INCIDENT_ID_PREFIX}${item.id}`,
  original_id: item.id,
  source: 'NON_MEDICAL',
  so_bc_ma_scyk: formatNonMedicalCode(item),
  ngay_bao_cao: item.ngay_bao_cao,
  don_vi_bao_cao: item.don_vi,
  khoa_phong: item.don_vi,
  ho_ten_nguoi_bc: item.nguoi_bao_cao,
  doi_tuong_xay_ra_sc: 'Sự cố ngoài y khoa',
  noi_xay_ra_sc: item.vi_tri_xay_ra,
  vi_tri_cu_the: item.vi_tri_xay_ra,
  ngay_xay_ra_sc: item.thoi_gian_xay_ra,
  mo_ta_su_co: item.mo_ta_dien_bien,
  dieu_tri_xy_ly_ban_dau_da_thuc_hien: item.bien_phap_xu_ly,
  de_xuat_giai_phap_ban_dau: item.nguyen_nhan_so_bo,
  muc_do_anh_huong: item.hau_qua,
  nhom_bao_cao: 'Sự cố ngoài y khoa',
  nhom_su_co: 'An toàn/Vận hành',
  hinh_anh_minh_chung: item.hinh_anh_minh_chung,
});

export const mergeLinkedIncidents = (
  medicalIncidents: BaoCaoScyk[],
  nonMedicalIncidents: BcScnyknt[]
): LinkedIncident[] => [
  ...medicalIncidents.map(normalizeMedicalIncident),
  ...nonMedicalIncidents.map(normalizeNonMedicalIncident),
].sort((a, b) => {
  const dateA = new Date(a.ngay_bao_cao || a.created_at || 0).getTime();
  const dateB = new Date(b.ngay_bao_cao || b.created_at || 0).getTime();
  return dateB - dateA;
});

export const incidentMatchesUserDepartment = (
  incident: Pick<BaoCaoScyk, 'khoa_phong' | 'don_vi_bao_cao'>,
  userDepartment: string
) => {
  const normalizedDepartment = userDepartment.trim().toLowerCase();
  if (!normalizedDepartment) return true;

  const incidentDepartment = (incident.khoa_phong || '').trim().toLowerCase();
  const reportingDepartment = (incident.don_vi_bao_cao || '').trim().toLowerCase();

  return (
    (incidentDepartment !== '' && (
      normalizedDepartment === incidentDepartment ||
      incidentDepartment.includes(normalizedDepartment) ||
      normalizedDepartment.includes(incidentDepartment)
    )) ||
    (reportingDepartment !== '' && (
      normalizedDepartment === reportingDepartment ||
      reportingDepartment.includes(normalizedDepartment) ||
      normalizedDepartment.includes(reportingDepartment)
    ))
  );
};
