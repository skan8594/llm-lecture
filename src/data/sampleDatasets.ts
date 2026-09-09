import { SampleDataset } from '../types';

export function calculateCsvStats(csvText: string): { rowCount: number; fileSize: string } {
  const lines = csvText.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rowCount = Math.max(0, lines.length - 1); // Exclude header
  const bytes = new Blob([csvText]).size;
  let fileSize = `${bytes} B`;
  if (bytes >= 1024 * 1024) {
    fileSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (bytes >= 1024) {
    fileSize = `${(bytes / 1024).toFixed(1)} KB`;
  }
  return { rowCount, fileSize };
}

// 1. [신규/확장] 300mm 웨이퍼 전면 결함 맵 & 불량 패턴 클러스터링 데이터 (D0 ≈ 0.50 defects/cm² 반도체 양산 이상 분석 기준)
function generateWafer300mmDefectsCsv(): string {
  const header = 'wafer_id,shot_id,die_x,die_y,pos_x_mm,pos_y_mm,radius_mm,defect_class,defect_subclass,defect_size_um,cluster_type,die_bin_status';
  const rows: string[] = [header];
  const waferId = 'WFR-2026-001';
  const diePitch = 14.0; // 14mm die size

  const addRow = (
    shot: string,
    x: number,
    y: number,
    cls: string,
    subcls: string,
    size: number,
    cluster: string,
    bin: 'PASS' | 'FAIL'
  ) => {
    const r = Math.sqrt(x * x + y * y);
    if (r > 149.0) return; // Must be inside 300mm wafer (R=150mm)
    const dieX = Math.round(x / diePitch);
    const dieY = Math.round(y / diePitch);
    rows.push(
      `${waferId},${shot},${dieX},${dieY},${x.toFixed(1)},${y.toFixed(1)},${r.toFixed(1)},${cls},${subcls},${size.toFixed(2)},${cluster},${bin}`
    );
  };

  // 1. CMP Slurry Scratch Cluster A (30 EA) - Curved streak across upper-left
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const x = -82.0 + 64.0 * t + Math.sin(t * 7) * 1.8;
    const y = 100.0 + 26.0 * t + Math.cos(t * 5) * 1.5;
    const size = 14.0 + (i % 7) * 2.8;
    addRow('S_SCR1', x, y, 'Scratch', 'CMP_Slurry_Scratch', size, 'SCRATCH_CLUSTER_A', 'FAIL');
  }

  // 2. Robotic Arm Handler Touch Scratch B (24 EA) - Lower-right linear streak
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const x = 32.0 + 56.0 * t + ((i % 3) - 1) * 0.8;
    const y = -118.0 + 40.0 * t + ((i % 2) - 0.5) * 1.2;
    const size = 18.0 + (i % 5) * 4.2;
    addRow('S_SCR2', x, y, 'Scratch', 'Robotic_Arm_Touch', size, 'SCRATCH_CLUSTER_B', 'FAIL');
  }

  // 3. Center Photolithography Defocus & Bridge Cluster (42 EA) - R < 32mm
  for (let i = 0; i < 42; i++) {
    const goldenAngle = (i * 137.508 * Math.PI) / 180;
    const r = 3.5 + 26.5 * Math.sqrt((i + 1) / 42);
    const x = r * Math.cos(goldenAngle);
    const y = r * Math.sin(goldenAngle);
    const size = 1.2 + (i % 6) * 0.32;
    addRow('S_CTR', x, y, 'Bridge', 'Pattern_Bridging', size, 'CENTER_CLUSTER', 'FAIL');
  }

  // 4. Outer Concentric Ring Defect (96 EA) - ESC thermal gradient / gas flow non-uniformity (R ≈ 106~118mm)
  for (let i = 0; i < 96; i++) {
    const theta = (i / 96) * 2 * Math.PI;
    const r = 111.0 + 5.5 * Math.sin(i * 1.8) + 2.2 * Math.cos(i * 3.2);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const size = 2.4 + (i % 8) * 0.45;
    addRow('S_RING', x, y, 'RingDefect', 'Thermal_Stress_Ring', size, 'RING_OUTER_ZONE', 'FAIL');
  }

  // 5. Bevel & Edge Exclusion Peeling (60 EA) - R ≈ 141~148mm
  for (let i = 0; i < 60; i++) {
    const theta = (i / 60) * 2 * Math.PI + 0.05;
    const r = 143.5 + 3.6 * Math.sin(i * 2.5);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const sub = i % 2 === 0 ? 'EBR_Chemical_Residue' : 'Bevel_Peeling';
    const size = 7.5 + (i % 7) * 1.8;
    addRow('S_EDGE', x, y, 'EdgeExclusion', sub, size, 'EDGE_BEAD_FAIL', 'FAIL');
  }

  // 6. Via / Contact Void Failures (35 EA) - Intermediate zones
  for (let i = 0; i < 35; i++) {
    const angle = (i * 97.3 * Math.PI) / 180;
    const r = 45.0 + (i % 5) * 11.5 + (i % 3) * 3.0;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const size = 0.42 + (i % 5) * 0.12;
    addRow('S_VIA', x, y, 'Void', 'Via_Incomplete_Filling', size, 'RANDOM', 'FAIL');
  }

  // 7. Random Airborne & Chamber Flake Particles (70 EA) - Uniform random spread
  for (let i = 0; i < 70; i++) {
    const angle = (i * 153.7 * Math.PI) / 180;
    const r = 12.0 + 125.0 * Math.sqrt((i + 1) / 70);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const sub = i % 2 === 0 ? 'Chamber_Flake' : 'Airborne_Aerosol';
    const bin = i % 5 === 0 ? 'FAIL' : 'PASS';
    const size = 0.28 + (i % 9) * 0.11;
    addRow('S_PART', x, y, 'Particle', sub, size, 'RANDOM', bin);
  }

  return rows.join('\n');
}

const WAFER_MAP_DEFECT_CSV = generateWafer300mmDefectsCsv();

// 2. [신규] 포토리소그래피 스캐너 오버레이(Overlay) 정합 오차 계측 데이터
const LITHO_OVERLAY_CSV = `lot_id,wafer_no,shot_x,shot_y,point_id,target_layer,ref_layer,overlay_dx_nm,overlay_dy_nm,total_vector_nm,spec_limit_nm,residual_dx,residual_dy,k1_trans_x_nm,k2_trans_y_nm,k3_rot_urad,k4_mag_ppm,verdict
LOT-2026-PH01,01,-2,3,P1,GATE_POLY,ACTIVE_FIN,1.24,1.85,2.23,3.50,0.15,-0.08,0.85,1.20,0.12,-0.05,PASS
LOT-2026-PH01,01,-2,3,P2,GATE_POLY,ACTIVE_FIN,1.45,2.10,2.55,3.50,0.22,0.11,0.85,1.20,0.12,-0.05,PASS
LOT-2026-PH01,01,-2,3,P3,GATE_POLY,ACTIVE_FIN,1.10,1.95,2.24,3.50,-0.12,-0.05,0.85,1.20,0.12,-0.05,PASS
LOT-2026-PH01,01,-2,3,P4,GATE_POLY,ACTIVE_FIN,1.35,2.05,2.45,3.50,0.08,0.03,0.85,1.20,0.12,-0.05,PASS
LOT-2026-PH01,01,0,0,P1,GATE_POLY,ACTIVE_FIN,0.45,0.62,0.77,3.50,-0.05,0.02,0.30,0.45,0.05,-0.02,PASS
LOT-2026-PH01,01,0,0,P2,GATE_POLY,ACTIVE_FIN,0.52,0.58,0.78,3.50,0.04,-0.04,0.30,0.45,0.05,-0.02,PASS
LOT-2026-PH01,01,2,-3,P1,GATE_POLY,ACTIVE_FIN,2.85,3.20,4.29,3.50,0.85,1.12,1.80,2.10,0.38,0.18,FAIL_SPEC_OVER
LOT-2026-PH01,01,2,-3,P2,GATE_POLY,ACTIVE_FIN,3.10,3.45,4.64,3.50,1.02,1.25,1.80,2.10,0.38,0.18,FAIL_SPEC_OVER
LOT-2026-PH01,01,2,-3,P3,GATE_POLY,ACTIVE_FIN,2.90,3.15,4.28,3.50,0.78,0.95,1.80,2.10,0.38,0.18,FAIL_SPEC_OVER
LOT-2026-PH01,02,-2,3,P1,CONTACT_M1,GATE_POLY,1.05,1.12,1.54,3.50,0.08,-0.02,0.60,0.75,0.08,-0.04,PASS
LOT-2026-PH01,02,0,0,P1,CONTACT_M1,GATE_POLY,0.38,0.42,0.57,3.50,-0.02,0.01,0.25,0.30,0.02,-0.01,PASS
LOT-2026-PH01,02,2,-3,P1,CONTACT_M1,GATE_POLY,2.15,2.40,3.22,3.50,0.45,0.62,1.20,1.40,0.22,0.10,PASS_MARGINAL
LOT-2026-PH01,03,-2,3,P1,VIA1_M2,METAL1,1.80,2.20,2.84,3.80,0.32,0.15,1.10,1.50,0.15,-0.08,PASS
LOT-2026-PH01,03,0,0,P1,VIA1_M2,METAL1,0.65,0.85,1.07,3.80,-0.08,-0.02,0.45,0.60,0.04,-0.02,PASS
LOT-2026-PH01,03,2,-3,P1,VIA1_M2,METAL1,3.45,4.10,5.36,3.80,1.45,1.85,2.10,2.60,0.45,0.25,FAIL_SPEC_OVER
LOT-2026-PH01,04,0,0,P1,METAL2,VIA1_M2,0.42,0.55,0.69,3.50,-0.01,0.02,0.28,0.35,0.03,-0.01,PASS
LOT-2026-PH01,05,0,0,P1,METAL2,VIA1_M2,0.50,0.48,0.69,3.50,0.03,-0.03,0.32,0.33,0.02,-0.01,PASS`;

// 3. [신규] 노광 초점-도즈 매트릭스(FEM) & 임계선폭(CD) 계측 데이터
const LITHO_FEM_CD_CSV = `wafer_id,shot_row,shot_col,focus_offset_um,dose_energy_mj,target_cd_nm,measured_cd_nm,cd_bias_nm,iso_dense_bias_nm,side_wall_angle_deg,process_window_status
WFR-FEM-01,-2,-2,-0.10,18.0,28.0,32.4,+4.4,2.8,84.5,OUT_OF_WINDOW
WFR-FEM-01,-2,-1,-0.10,19.5,28.0,30.8,+2.8,2.1,86.2,MARGINAL
WFR-FEM-01,-2,0,-0.10,21.0,28.0,29.1,+1.1,1.5,88.0,OPTIMAL
WFR-FEM-01,-2,1,-0.10,22.5,28.0,27.6,-0.4,1.3,88.8,OPTIMAL
WFR-FEM-01,-2,2,-0.10,24.0,28.0,25.9,-2.1,1.8,87.2,MARGINAL
WFR-FEM-01,0,-2,0.00,18.0,28.0,31.2,+3.2,2.0,86.8,MARGINAL
WFR-FEM-01,0,-1,0.00,19.5,28.0,29.5,+1.5,1.4,88.5,OPTIMAL
WFR-FEM-01,0,0,0.00,21.0,28.0,28.1,+0.1,1.0,89.6,BEST_FOCUS_DOSE
WFR-FEM-01,0,1,0.00,22.5,28.0,26.8,-1.2,1.2,89.1,OPTIMAL
WFR-FEM-01,0,2,0.00,24.0,28.0,25.1,-2.9,1.7,86.9,MARGINAL
WFR-FEM-01,2,-2,+0.10,18.0,28.0,33.1,+5.1,3.2,83.8,OUT_OF_WINDOW
WFR-FEM-01,2,-1,+0.10,19.5,28.0,31.4,+3.4,2.4,85.5,MARGINAL
WFR-FEM-01,2,0,+0.10,21.0,28.0,29.8,+1.8,1.6,87.8,OPTIMAL
WFR-FEM-01,2,1,+0.10,22.5,28.0,28.0,0.0,1.2,88.4,OPTIMAL
WFR-FEM-01,2,2,+0.10,24.0,28.0,26.2,-1.8,1.5,87.0,MARGINAL`;

// 4. [신규] 웨이퍼 EDS 프로브 테스트 다이 Binning & 수율 맵 데이터
const EDS_PROBE_BIN_CSV = `lot_id,wafer_no,die_x,die_y,die_index,bin_code,bin_name,leakage_current_ua,vth_mv,clock_freq_ghz,die_result
LOT-2026-EDS01,01,-5,8,101,BIN_1,GOOD_PRIME,0.12,382,3.82,PASS
LOT-2026-EDS01,01,-4,8,102,BIN_1,GOOD_PRIME,0.14,380,3.80,PASS
LOT-2026-EDS01,01,-3,8,103,BIN_2,LEAKAGE_FAIL,4.85,310,3.20,FAIL
LOT-2026-EDS01,01,-2,8,104,BIN_1,GOOD_PRIME,0.15,385,3.85,PASS
LOT-2026-EDS01,01,-1,8,105,BIN_3,OPEN_SHORT,99.9,10,0.00,FAIL
LOT-2026-EDS01,01,0,8,106,BIN_1,GOOD_PRIME,0.13,383,3.84,PASS
LOT-2026-EDS01,01,0,0,250,BIN_1,GOOD_PRIME,0.11,388,3.90,PASS
LOT-2026-EDS01,01,1,0,251,BIN_1,GOOD_PRIME,0.12,387,3.89,PASS
LOT-2026-EDS01,01,2,0,252,BIN_4,SPEED_SLOW,0.22,425,3.15,FAIL
LOT-2026-EDS01,01,12,-3,380,BIN_5,RETENTION_FAIL,0.35,375,3.60,FAIL
LOT-2026-EDS01,01,13,-3,381,BIN_5,RETENTION_FAIL,0.40,370,3.58,FAIL
LOT-2026-EDS01,01,14,-4,410,BIN_3,OPEN_SHORT,99.9,5,0.00,FAIL
LOT-2026-EDS01,01,-12,-12,502,BIN_2,LEAKAGE_FAIL,6.20,305,3.10,FAIL
LOT-2026-EDS01,01,-11,-12,503,BIN_2,LEAKAGE_FAIL,5.80,312,3.15,FAIL
LOT-2026-EDS01,01,0,-1,255,BIN_1,GOOD_PRIME,0.10,390,3.91,PASS`;

// 5. [신규] 이온주입 공정 면저항(Rs) 49-포인트 균일도 맵 데이터
const ION_IMPLANT_RS_CSV = `lot_id,wafer_no,dopant,energy_kev,target_dose_cm2,point_id,pos_x_mm,pos_y_mm,radius_mm,sheet_res_ohm_sq,target_rs,deviation_pct,status
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P01,0.0,0.0,0.0,85.2,85.0,+0.24,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P02,0.0,30.0,30.0,85.4,85.0,+0.47,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P03,30.0,0.0,30.0,85.1,85.0,+0.12,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P04,0.0,-30.0,30.0,85.3,85.0,+0.35,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P05,-30.0,0.0,30.0,85.0,85.0,0.00,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P06,0.0,75.0,75.0,86.1,85.0,+1.29,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P07,75.0,0.0,75.0,85.8,85.0,+0.94,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P08,0.0,-75.0,75.0,86.0,85.0,+1.18,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P09,-75.0,0.0,75.0,85.9,85.0,+1.06,PASS
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P10,0.0,135.0,135.0,88.4,85.0,+4.00,WARNING_EDGE_HIGH
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P11,135.0,0.0,135.0,88.9,85.0,+4.59,WARNING_EDGE_HIGH
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P12,0.0,-135.0,135.0,89.5,85.0,+5.29,FAIL_EDGE_HIGH
LOT-2026-IMP01,01,BORON_B11,15.0,1.00E+15,P13,-135.0,0.0,135.0,88.6,85.0,+4.24,WARNING_EDGE_HIGH`;

// 6. 식각 챔버 FDC 센서 시계열 로그
const ETCH_FDC_CSV = `timestamp,chamber_id,rf_source_power_w,rf_bias_power_w,chamber_pressure_mtorr,esc_temp_c,cf4_flow_sccm,o2_flow_sccm,throttle_valve_angle,fdc_alarm_flag
2026-09-07 09:00:01,ETCH-CH01,1250.2,250.1,12.04,65.2,80.1,10.0,42.5,NORMAL
2026-09-07 09:00:05,ETCH-CH01,1249.8,250.5,12.06,65.3,79.9,10.1,42.6,NORMAL
2026-09-07 09:00:10,ETCH-CH01,1250.0,249.9,12.02,65.2,80.0,10.0,42.4,NORMAL
2026-09-07 09:00:15,ETCH-CH01,1275.4,265.8,13.80,67.8,85.2,12.4,48.2,WARNING
2026-09-07 09:00:20,ETCH-CH01,1298.6,280.2,15.40,70.5,88.9,14.1,53.1,ALARM_PRESSURE_HUNTING
2026-09-07 09:00:25,ETCH-CH01,1251.0,251.0,12.10,65.4,80.2,10.0,42.7,NORMAL
2026-09-07 09:00:01,ETCH-CH02,1200.0,220.0,11.50,62.0,75.0,8.5,39.8,NORMAL
2026-09-07 09:00:05,ETCH-CH02,1199.5,219.8,11.52,62.1,75.1,8.4,39.9,NORMAL
2026-09-07 09:00:10,ETCH-CH02,1200.5,220.3,11.49,62.0,74.9,8.5,39.7,NORMAL
2026-09-07 09:00:15,ETCH-CH02,1201.0,220.1,11.51,62.1,75.0,8.5,39.8,NORMAL
2026-09-07 09:00:01,ETCH-CH03,1300.0,270.0,14.00,68.0,90.0,15.0,45.0,NORMAL
2026-09-07 09:00:05,ETCH-CH03,1302.1,271.2,14.05,68.1,90.2,15.1,45.2,NORMAL
2026-09-07 09:00:10,ETCH-CH03,1350.8,295.0,17.20,74.2,98.5,18.0,58.4,ALARM_OVERTEMP
2026-09-07 09:00:15,ETCH-CH03,1305.0,272.0,14.10,68.5,90.5,15.2,45.5,NORMAL
2026-09-07 09:00:20,ETCH-CH03,1299.0,269.5,13.98,67.9,89.8,14.9,44.8,NORMAL`;

// 7. CMP 박막 두께 및 균일도 계측 데이터
const CMP_METROLOGY_CSV = `lot_id,wafer_no,slot_no,head_rpm,down_force_psi,slurry_flow_ml_min,thk_center_nm,thk_mid_nm,thk_edge_nm,wiwnu_percent,removal_rate_nm_min,status
LOT-2026-CMP01,01,01,110,3.5,250,145.2,146.0,144.8,1.82,210.5,PASS
LOT-2026-CMP01,02,02,110,3.5,250,145.8,146.2,145.0,1.75,211.2,PASS
LOT-2026-CMP01,03,03,110,3.5,250,144.9,145.5,144.1,1.90,212.0,PASS
LOT-2026-CMP01,04,04,112,3.6,245,148.5,147.2,143.0,3.85,205.1,WARNING_EDGE_FAST
LOT-2026-CMP01,05,05,115,3.8,240,152.0,149.0,141.2,5.20,198.4,FAIL_UNIFORMITY
LOT-2026-CMP01,06,06,110,3.5,250,145.0,145.8,144.5,1.80,210.8,PASS
LOT-2026-CMP01,07,07,110,3.5,250,145.3,146.1,144.9,1.78,211.0,PASS
LOT-2026-CMP01,08,08,110,3.5,250,144.7,145.3,144.0,1.85,211.5,PASS
LOT-2026-CMP01,09,09,108,3.4,255,143.2,144.0,143.5,1.65,214.2,PASS
LOT-2026-CMP01,10,10,110,3.5,250,145.1,145.9,144.7,1.79,210.9,PASS`;

// 8. 웨이퍼 로트 공정간 Q-Time 추적 로그
const QTIME_LOG_CSV = `lot_id,product_code,source_step,target_step,dispatch_time,arrival_time,elapsed_minutes,qtime_limit_minutes,qtime_risk_status,foup_id
LOT-2026-Q01,DRAM-1B,CLEAN_PRE_OX,FURNACE_GATE_OX,2026-09-07 07:15,2026-09-07 08:05,50,120,SAFE,FOUP-A102
LOT-2026-Q02,DRAM-1B,CLEAN_PRE_OX,FURNACE_GATE_OX,2026-09-07 06:20,2026-09-07 08:15,115,120,WARNING_EXPIRING_SOON,FOUP-A108
LOT-2026-Q03,NAND-V8,PHOTO_EXPOSE,ETCH_HARC,2026-09-07 05:00,2026-09-07 08:30,210,180,VIOLATED_INTERLOCK,FOUP-B204
LOT-2026-Q04,NAND-V8,PHOTO_EXPOSE,ETCH_HARC,2026-09-07 07:00,2026-09-07 08:10,70,180,SAFE,FOUP-B210
LOT-2026-Q05,CIS-4K,METAL_CMP,CLEAN_POST_CMP,2026-09-07 07:45,2026-09-07 08:20,35,90,SAFE,FOUP-C015
LOT-2026-Q06,CIS-4K,METAL_CMP,CLEAN_POST_CMP,2026-09-07 06:40,2026-09-07 08:15,95,90,VIOLATED_INTERLOCK,FOUP-C022
LOT-2026-Q07,DRAM-1B,ETCH_GATE,ASHING_PR_STRIP,2026-09-07 07:30,2026-09-07 08:00,30,60,SAFE,FOUP-A115
LOT-2026-Q08,DRAM-1B,ETCH_GATE,ASHING_PR_STRIP,2026-09-07 07:10,2026-09-07 08:05,55,60,WARNING_EXPIRING_SOON,FOUP-A119`;

export function getInitialDatasets(): SampleDataset[] {
  const stats1 = calculateCsvStats(WAFER_MAP_DEFECT_CSV);
  const stats2 = calculateCsvStats(LITHO_OVERLAY_CSV);
  const stats3 = calculateCsvStats(LITHO_FEM_CD_CSV);
  const stats4 = calculateCsvStats(EDS_PROBE_BIN_CSV);
  const stats5 = calculateCsvStats(ION_IMPLANT_RS_CSV);
  const stats6 = calculateCsvStats(ETCH_FDC_CSV);
  const stats7 = calculateCsvStats(CMP_METROLOGY_CSV);
  const stats8 = calculateCsvStats(QTIME_LOG_CSV);

  return [
    {
      id: 'dataset-wafer-defect-map-spatial',
      title: '300mm 웨이퍼 전면 결함 맵 & 불량 패턴 클러스터링 데이터',
      fileName: 'wafer_300mm_defect_map_clusters.csv',
      description: '300mm 웨이퍼 실측 결함 357건(결함 밀도 D0 ≈ 0.51 defects/cm² 공정 이상 기준), Die X/Y 격자 좌표, 물리 위치(mm), 결함 유형(Scratch, Ring, Bridge, Edge, Void, Particle) 및 클러스터 패턴 라벨',
      csvContent: WAFER_MAP_DEFECT_CSV,
      fileSize: stats1.fileSize,
      rowCount: stats1.rowCount,
      uploadedAt: Date.now() - 3600000 * 3,
      uploadedBy: '강사 (반도체 수율 분석팀)',
    },
    {
      id: 'dataset-litho-overlay-metrology',
      title: '포토리소그래피 스캐너 층간 오버레이(Overlay) 정합 오차 데이터',
      fileName: 'photo_scanner_overlay_metrology.csv',
      description: '노광 스캐너 샷별 X/Y 정합 오차(dx, dy, total vector nm), 층간(Gate-Fin, M1-Gate, Via-M1) 오버레이 잔여오차 및 보정 계수(Translation, Rotation, Mag)',
      csvContent: LITHO_OVERLAY_CSV,
      fileSize: stats2.fileSize,
      rowCount: stats2.rowCount,
      uploadedAt: Date.now() - 3600000 * 2.5,
      uploadedBy: '강사 (노광 포토 공정팀)',
    },
    {
      id: 'dataset-litho-fem-cd',
      title: '노광 초점-도즈 매트릭스(FEM) & 임계선폭(CD) 계측 데이터',
      fileName: 'litho_fem_cd_metrology.csv',
      description: '초점 오프셋(um), 노광 도즈량(mJ), 패턴 임계선폭(CD nm), Iso-Dense 바이어스, 측벽 각도(Side-wall angle) 및 공정 마진(Process Window) 판정',
      csvContent: LITHO_FEM_CD_CSV,
      fileSize: stats3.fileSize,
      rowCount: stats3.rowCount,
      uploadedAt: Date.now() - 3600000 * 2,
      uploadedBy: '강사 (노광 포토 공정팀)',
    },
    {
      id: 'dataset-eds-probe-bin',
      title: '웨이퍼 EDS 프로브 테스트 다이 Binning & 수율 맵 데이터',
      fileName: 'eds_wafer_probe_bin_map.csv',
      description: '웨이퍼 다이별 EDS 테스트 결과(BIN 1 Prime Pass, BIN 2 Leakage, BIN 3 Open/Short, BIN 4 Speed, BIN 5 Retention), 누설전류(uA), 문턱전압(mV)',
      csvContent: EDS_PROBE_BIN_CSV,
      fileSize: stats4.fileSize,
      rowCount: stats4.rowCount,
      uploadedAt: Date.now() - 3600000 * 1.5,
      uploadedBy: '강사 (반도체 테스트/수율팀)',
    },
    {
      id: 'dataset-ion-implant-rs',
      title: '이온주입(Ion Implant) 공정 면저항(Rs) 49-포인트 균일도 맵',
      fileName: 'ion_implant_sheet_resistance_map.csv',
      description: '도펀트(B, P, As), 주입 에너지/도즈, 49포인트 반경별 면저항(ohm/sq), 중심-에지 편차율(%), 주입 균일도 판정 로그',
      csvContent: ION_IMPLANT_RS_CSV,
      fileSize: stats5.fileSize,
      rowCount: stats5.rowCount,
      uploadedAt: Date.now() - 3600000 * 1,
      uploadedBy: '강사 (박막/확산 공정팀)',
    },
    {
      id: 'dataset-etch-fdc',
      title: '식각 챔버 FDC 센서 실시간 이상감지 로그',
      fileName: 'etch_chamber_fdc_sensors.csv',
      description: '식각 챔버의 RF 제어 전력, 반사파, 진공 압력(mTorr), ESC 정전척 온도, 반응 가스 유량(sccm) 및 이상 알람 태그',
      csvContent: ETCH_FDC_CSV,
      fileSize: stats6.fileSize,
      rowCount: stats6.rowCount,
      uploadedAt: Date.now() - 3600000 * 0.7,
      uploadedBy: '강사 (식각 공정/설비팀)',
    },
    {
      id: 'dataset-cmp-metrology',
      title: 'CMP 화학기계연마 박막 두께 & 면내 균일도 계측 데이터',
      fileName: 'cmp_thickness_metrology.csv',
      description: '연마 헤드 회전수, 압력, 중심/미드/에지 박막 잔류 두께(nm), 면내 균일도(WIWNU %), 연마율(Removal Rate) 판정 로그',
      csvContent: CMP_METROLOGY_CSV,
      fileSize: stats7.fileSize,
      rowCount: stats7.rowCount,
      uploadedAt: Date.now() - 1800000,
      uploadedBy: '강사 (CMP 공정팀)',
    },
    {
      id: 'dataset-lot-qtime',
      title: 'FAB 공정간 웨이퍼 로트 Q-Time 추적 및 인터락 로그',
      fileName: 'fab_lot_qtime_tracking.csv',
      description: '로트 ID별 출발/목적 공정, 경과 시간, 큐타임 상한(분), 초과 리스크 및 자동 인터락 격리 상태 로그',
      csvContent: QTIME_LOG_CSV,
      fileSize: stats8.fileSize,
      rowCount: stats8.rowCount,
      uploadedAt: Date.now() - 900000,
      uploadedBy: '강사 (FAB 제조물류팀)',
    },
  ];
}
