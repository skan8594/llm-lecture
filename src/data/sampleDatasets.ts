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

// 1. 300mm 웨이퍼 전면 결함 맵 & 불량 패턴 클러스터링 데이터 (~160행)
function generateWafer300mmDefectsCsv(): string {
  const header = 'wafer_id,shot_id,die_x,die_y,pos_x_mm,pos_y_mm,radius_mm,defect_class,defect_subclass,defect_size_um,cluster_type,die_bin_status';
  const rows: string[] = [header];
  const waferId = 'WFR-2026-001';
  const diePitch = 14.0;

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
    if (r > 149.0) return;
    const dieX = Math.round(x / diePitch);
    const dieY = Math.round(y / diePitch);
    rows.push(
      `${waferId},${shot},${dieX},${dieY},${x.toFixed(1)},${y.toFixed(1)},${r.toFixed(1)},${cls},${subcls},${size.toFixed(2)},${cluster},${bin}`
    );
  };

  // CMP Scratch Cluster A (28 rows)
  for (let i = 0; i < 28; i++) {
    const t = i / 27;
    const x = -82.0 + 64.0 * t + Math.sin(t * 7) * 1.8;
    const y = 100.0 + 26.0 * t + Math.cos(t * 5) * 1.5;
    addRow('S_SCR1', x, y, 'Scratch', 'CMP_Slurry_Scratch', 14.0 + (i % 7) * 2.8, 'SCRATCH_CLUSTER_A', 'FAIL');
  }

  // Robotic Arm Touch Scratch B (22 rows)
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const x = 32.0 + 56.0 * t + ((i % 3) - 1) * 0.8;
    const y = -118.0 + 40.0 * t + ((i % 2) - 0.5) * 1.2;
    addRow('S_SCR2', x, y, 'Scratch', 'Robotic_Arm_Touch', 18.0 + (i % 5) * 4.2, 'SCRATCH_CLUSTER_B', 'FAIL');
  }

  // Center Photolithography Defocus & Bridge Cluster (28 rows)
  for (let i = 0; i < 28; i++) {
    const goldenAngle = (i * 137.508 * Math.PI) / 180;
    const r = 3.5 + 24.0 * Math.sqrt((i + 1) / 28);
    const x = r * Math.cos(goldenAngle);
    const y = r * Math.sin(goldenAngle);
    addRow('S_CTR', x, y, 'Bridge', 'Pattern_Bridging', 1.2 + (i % 6) * 0.32, 'CENTER_CLUSTER', 'FAIL');
  }

  // Outer Ring Defect (36 rows)
  for (let i = 0; i < 36; i++) {
    const theta = (i / 36) * 2 * Math.PI;
    const r = 111.0 + 5.0 * Math.sin(i * 1.8);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    addRow('S_RING', x, y, 'RingDefect', 'Thermal_Stress_Ring', 2.4 + (i % 8) * 0.45, 'RING_OUTER_ZONE', 'FAIL');
  }

  // Bevel & Edge Exclusion Peeling (26 rows)
  for (let i = 0; i < 26; i++) {
    const theta = (i / 26) * 2 * Math.PI + 0.05;
    const r = 143.5 + 3.0 * Math.sin(i * 2.5);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const sub = i % 2 === 0 ? 'EBR_Chemical_Residue' : 'Bevel_Peeling';
    addRow('S_EDGE', x, y, 'EdgeExclusion', sub, 7.5 + (i % 7) * 1.8, 'EDGE_BEAD_FAIL', 'FAIL');
  }

  // Random Particles (25 rows)
  for (let i = 0; i < 25; i++) {
    const angle = (i * 153.7 * Math.PI) / 180;
    const r = 15.0 + 120.0 * Math.sqrt((i + 1) / 25);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const sub = i % 2 === 0 ? 'Chamber_Flake' : 'Airborne_Aerosol';
    const bin = i % 4 === 0 ? 'FAIL' : 'PASS';
    addRow('S_PART', x, y, 'Particle', sub, 0.28 + (i % 9) * 0.11, 'RANDOM', bin);
  }

  return rows.join('\n');
}

// 2. 포토리소그래피 스캐너 오버레이(Overlay) 정합 오차 계측 데이터 (125행)
function generateLithoOverlayCsv(): string {
  const header = 'lot_id,wafer_no,shot_x,shot_y,point_id,target_layer,ref_layer,overlay_dx_nm,overlay_dy_nm,total_vector_nm,spec_limit_nm,residual_dx,residual_dy,k1_trans_x_nm,k2_trans_y_nm,k3_rot_urad,k4_mag_ppm,verdict';
  const rows: string[] = [header];
  const shots = [
    { x: -2, y: 2 }, { x: -1, y: 2 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
    { x: -2, y: 1 }, { x: 0, y: 1 }, { x: 2, y: 1 },
    { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
    { x: -2, y: -1 }, { x: 0, y: -1 }, { x: 2, y: -1 },
    { x: -2, y: -2 }, { x: -1, y: -2 }, { x: 0, y: -2 }, { x: 1, y: -2 }, { x: 2, y: -2 },
    { x: 0, y: 3 }, { x: 0, y: -3 }, { x: 3, y: 0 }, { x: -3, y: 0 },
  ]; // 25 shots
  const points = ['P1', 'P2', 'P3', 'P4', 'P5']; // 5 points per shot = 125 rows

  shots.forEach((s) => {
    points.forEach((p, pIdx) => {
      const distFromCenter = Math.sqrt(s.x * s.x + s.y * s.y);
      const isEdge = distFromCenter >= 2.5;
      const baseDx = 0.5 + distFromCenter * 0.6 + pIdx * 0.15;
      const baseDy = 0.6 + distFromCenter * 0.7 + pIdx * 0.12;
      const noise = (Math.sin(s.x * 3 + pIdx) + Math.cos(s.y * 2)) * 0.25;
      const dx = Number((baseDx + noise).toFixed(2));
      const dy = Number((baseDy + noise * 0.8).toFixed(2));
      const totalVector = Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
      const specLimit = 3.5;
      let verdict = 'PASS';
      if (totalVector > specLimit) verdict = 'FAIL_SPEC_OVER';
      else if (totalVector > specLimit * 0.85) verdict = 'PASS_MARGINAL';

      const waferNo = (s.x + s.y) % 2 === 0 ? '01' : '02';
      const targetLayer = isEdge ? 'GATE_POLY' : (pIdx % 2 === 0 ? 'CONTACT_M1' : 'VIA1_M2');
      const refLayer = isEdge ? 'ACTIVE_FIN' : (pIdx % 2 === 0 ? 'GATE_POLY' : 'METAL1');

      rows.push(
        `LOT-2026-PH01,${waferNo},${s.x},${s.y},${p},${targetLayer},${refLayer},${dx},${dy},${totalVector},${specLimit.toFixed(2)},${(dx * 0.12).toFixed(2)},${(dy * 0.11).toFixed(2)},0.85,1.20,0.12,-0.05,${verdict}`
      );
    });
  });

  return rows.join('\n');
}

// 3. 노광 초점-도즈 매트릭스(FEM) & 임계선폭(CD) 계측 데이터 (125행)
function generateLithoFemCdCsv(): string {
  const header = 'wafer_id,shot_row,shot_col,focus_offset_um,dose_energy_mj,target_cd_nm,measured_cd_nm,cd_bias_nm,iso_dense_bias_nm,side_wall_angle_deg,process_window_status';
  const rows: string[] = [header];
  const focusList = [-0.20, -0.10, 0.00, 0.10, 0.20]; // 5 focus offsets
  const doseList = [18.0, 19.5, 21.0, 22.5, 24.0];    // 5 dose energies
  const shotCoords = [
    { row: -2, col: -2 }, { row: -1, col: 0 }, { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 2 }
  ]; // 5 repeat shots = 5 * 5 * 5 = 125 rows

  const targetCd = 28.0;

  shotCoords.forEach((coord, coordIdx) => {
    focusList.forEach((focus) => {
      doseList.forEach((dose) => {
        // CD increases with lower dose, degrades with high focus offset
        const focusPenalty = Math.abs(focus) * 12.0;
        const doseEffect = (21.0 - dose) * 1.8;
        const shotVariation = (coordIdx - 2) * 0.2;
        const measured = Number((targetCd + doseEffect + focusPenalty + shotVariation).toFixed(2));
        const cdBias = Number((measured - targetCd).toFixed(2));
        const isoDenseBias = Number((1.2 + Math.abs(focus) * 4.0 + Math.random() * 0.3).toFixed(2));
        const sideWallAngle = Number((89.5 - Math.abs(focus) * 18.0 - (dose - 21.0) * 0.5).toFixed(1));

        let status = 'OPTIMAL';
        if (Math.abs(cdBias) <= 0.5 && Math.abs(focus) <= 0.05) {
          status = 'BEST_FOCUS_DOSE';
        } else if (Math.abs(cdBias) > 3.0 || sideWallAngle < 85.0) {
          status = 'OUT_OF_WINDOW';
        } else if (Math.abs(cdBias) > 1.5) {
          status = 'MARGINAL';
        }

        const waferId = `WFR-FEM-${String(coordIdx + 1).padStart(2, '0')}`;
        rows.push(
          `${waferId},${coord.row},${coord.col},${focus.toFixed(2)},${dose.toFixed(1)},${targetCd.toFixed(1)},${measured},${cdBias > 0 ? '+' : ''}${cdBias},${isoDenseBias},${sideWallAngle},${status}`
        );
      });
    });
  });

  return rows.join('\n');
}

// 4. 웨이퍼 EDS 프로브 테스트 다이 Binning & 수율 맵 데이터 (150행)
function generateEdsProbeBinCsv(): string {
  const header = 'lot_id,wafer_no,die_x,die_y,die_index,bin_code,bin_name,leakage_current_ua,vth_mv,clock_freq_ghz,die_result';
  const rows: string[] = [header];

  // 150 dies sampled across the wafer
  for (let i = 1; i <= 150; i++) {
    const angle = i * 0.42;
    const radius = Math.min(14.0, Math.sqrt(i) * 1.15);
    const dieX = Math.round(radius * Math.cos(angle));
    const dieY = Math.round(radius * Math.sin(angle));
    const dist = Math.sqrt(dieX * dieX + dieY * dieY);

    let binCode = 'BIN_1';
    let binName = 'GOOD_PRIME';
    let result = 'PASS';
    let leakage = Number((0.10 + (i % 7) * 0.02).toFixed(2));
    let vth = 380 + (i % 15) * 2;
    let clockFreq = Number((3.80 + (i % 9) * 0.02).toFixed(2));

    if (dist >= 12.0) {
      // Edge degradation
      if (i % 3 === 0) {
        binCode = 'BIN_2';
        binName = 'LEAKAGE_FAIL';
        result = 'FAIL';
        leakage = Number((4.5 + (i % 5) * 0.8).toFixed(2));
        vth = 310;
        clockFreq = 3.10;
      } else if (i % 4 === 0) {
        binCode = 'BIN_3';
        binName = 'OPEN_SHORT';
        result = 'FAIL';
        leakage = 99.9;
        vth = 10;
        clockFreq = 0.00;
      }
    } else if (dist <= 2.5 && i % 7 === 0) {
      // Center defect
      binCode = 'BIN_4';
      binName = 'SPEED_SLOW';
      result = 'FAIL';
      clockFreq = 3.05;
      vth = 430;
    } else if (i % 19 === 0) {
      binCode = 'BIN_5';
      binName = 'RETENTION_FAIL';
      result = 'FAIL';
    }

    const waferNo = i <= 75 ? '01' : '02';
    rows.push(
      `LOT-2026-EDS01,${waferNo},${dieX},${dieY},${100 + i},${binCode},${binName},${leakage},${vth},${clockFreq.toFixed(2)},${result}`
    );
  }

  return rows.join('\n');
}

// 5. 이온주입 공정 면저항(Rs) 균일도 맵 데이터 (147행 = 3개 로트 x 49포인트)
function generateIonImplantRsCsv(): string {
  const header = 'lot_id,wafer_no,dopant,energy_kev,target_dose_cm2,point_id,pos_x_mm,pos_y_mm,radius_mm,sheet_res_ohm_sq,target_rs,deviation_pct,status';
  const rows: string[] = [header];

  // 49 measurement points
  const points: { id: string; x: number; y: number }[] = [{ id: 'P01', x: 0, y: 0 }];
  const rings = [
    { r: 30, count: 8 },
    { r: 60, count: 12 },
    { r: 95, count: 12 },
    { r: 135, count: 16 },
  ]; // 1 + 8 + 12 + 12 + 16 = 49 points

  let pCount = 2;
  rings.forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      const theta = (i / ring.count) * 2 * Math.PI;
      points.push({
        id: `P${String(pCount++).padStart(2, '0')}`,
        x: Math.round(ring.r * Math.cos(theta)),
        y: Math.round(ring.r * Math.sin(theta)),
      });
    }
  });

  const lots = [
    { lot: 'LOT-2026-IMP01', wafer: '01', dopant: 'BORON_B11', energy: 15.0, dose: '1.00E+15', targetRs: 85.0 },
    { lot: 'LOT-2026-IMP02', wafer: '01', dopant: 'PHOSPHORUS_P31', energy: 40.0, dose: '5.00E+14', targetRs: 120.0 },
    { lot: 'LOT-2026-IMP03', wafer: '02', dopant: 'ARSENIC_AS75', energy: 25.0, dose: '2.00E+15', targetRs: 45.0 },
  ];

  lots.forEach((cfg) => {
    points.forEach((pt) => {
      const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
      // Edge effect: resistance increases slightly towards edge
      const edgeEffect = Math.pow(r / 150.0, 2) * (cfg.targetRs * 0.05);
      const randomVar = ((pt.x + pt.y) % 5) * 0.15;
      const actualRs = Number((cfg.targetRs + edgeEffect + randomVar).toFixed(2));
      const devPct = Number((((actualRs - cfg.targetRs) / cfg.targetRs) * 100).toFixed(2));

      let status = 'PASS';
      if (Math.abs(devPct) > 5.0) status = 'FAIL_EDGE_HIGH';
      else if (Math.abs(devPct) > 3.0) status = 'WARNING_EDGE_HIGH';

      rows.push(
        `${cfg.lot},${cfg.wafer},${cfg.dopant},${cfg.energy.toFixed(1)},${cfg.dose},${pt.id},${pt.x.toFixed(1)},${pt.y.toFixed(1)},${r.toFixed(1)},${actualRs},${cfg.targetRs.toFixed(1)},${devPct > 0 ? '+' : ''}${devPct},${status}`
      );
    });
  });

  return rows.join('\n');
}

// 6. 식각 챔버 FDC 센서 시계열 로그 (140행)
function generateEtchFdcCsv(): string {
  const header = 'timestamp,chamber_id,rf_source_power_w,rf_bias_power_w,chamber_pressure_mtorr,esc_temp_c,cf4_flow_sccm,o2_flow_sccm,throttle_valve_angle,fdc_alarm_flag';
  const rows: string[] = [header];
  const chambers = ['ETCH-CH01', 'ETCH-CH02', 'ETCH-CH03', 'ETCH-CH04'];

  for (let i = 0; i < 35; i++) {
    const minute = Math.floor(i / 6);
    const second = (i % 6) * 10;
    const timeStr = `2026-09-07 09:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

    chambers.forEach((ch, chIdx) => {
      let rfSource = 1250.0 + (chIdx * 20.0) + Math.sin(i * 0.5) * 5.0;
      let rfBias = 250.0 + (chIdx * 10.0) + Math.cos(i * 0.4) * 3.0;
      let pressure = 12.0 + Math.sin(i * 0.8) * 0.3;
      let escTemp = 65.0 + Math.sin(i * 0.2) * 1.2;
      let cf4 = 80.0 + Math.cos(i * 0.3) * 1.5;
      let o2 = 10.0 + (i % 4) * 0.2;
      let throttle = 42.0 + Math.sin(i * 0.5) * 1.5;
      let alarm = 'NORMAL';

      // Insert anomaly for CH01 around step 15-20
      if (ch === 'ETCH-CH01' && i >= 16 && i <= 20) {
        pressure += 3.8;
        rfBias += 28.0;
        throttle += 9.5;
        alarm = i === 18 ? 'ALARM_PRESSURE_HUNTING' : 'WARNING';
      }

      // Insert temperature anomaly for CH03 around step 25-28
      if (ch === 'ETCH-CH03' && i >= 25 && i <= 28) {
        escTemp += 8.5;
        rfSource += 65.0;
        alarm = i === 26 ? 'ALARM_OVERTEMP' : 'WARNING';
      }

      rows.push(
        `${timeStr},${ch},${rfSource.toFixed(1)},${rfBias.toFixed(1)},${pressure.toFixed(2)},${escTemp.toFixed(1)},${cf4.toFixed(1)},${o2.toFixed(1)},${throttle.toFixed(1)},${alarm}`
      );
    });
  }

  return rows.join('\n');
}

// 7. CMP 박막 두께 및 균일도 계측 데이터 (125행)
function generateCmpMetrologyCsv(): string {
  const header = 'lot_id,wafer_no,slot_no,head_rpm,down_force_psi,slurry_flow_ml_min,thk_center_nm,thk_mid_nm,thk_edge_nm,wiwnu_percent,removal_rate_nm_min,status';
  const rows: string[] = [header];

  for (let lotIdx = 1; lotIdx <= 5; lotIdx++) {
    const lotId = `LOT-2026-CMP0${lotIdx}`;
    for (let slot = 1; slot <= 25; slot++) {
      const waferNo = String(slot).padStart(2, '0');
      const headRpm = 110 + (slot % 4);
      const downForce = 3.5 + (slot % 3) * 0.1;
      const slurryFlow = 250 + (slot % 5) * 2;

      let thkCenter = 145.0 + Math.sin(slot * 0.5) * 1.5;
      let thkMid = 145.8 + Math.cos(slot * 0.5) * 1.2;
      let thkEdge = 144.5 + Math.sin(slot * 0.7) * 1.8;
      let wiwnu = Number((Math.abs(thkCenter - thkEdge) / thkMid * 100).toFixed(2));
      let removalRate = 210.0 + Math.cos(slot) * 4.0;
      let status = 'PASS';

      if (slot === 13 || slot === 14) {
        thkEdge -= 4.5;
        wiwnu = 4.8;
        status = 'WARNING_EDGE_FAST';
      } else if (lotIdx === 4 && slot === 20) {
        thkCenter += 8.0;
        wiwnu = 6.2;
        status = 'FAIL_UNIFORMITY';
      }

      rows.push(
        `${lotId},${waferNo},${waferNo},${headRpm},${downForce.toFixed(1)},${slurryFlow},${thkCenter.toFixed(1)},${thkMid.toFixed(1)},${thkEdge.toFixed(1)},${wiwnu.toFixed(2)},${removalRate.toFixed(1)},${status}`
      );
    }
  }

  return rows.join('\n');
}

// 8. 웨이퍼 로트 공정간 Q-Time 추적 로그 (120행)
function generateLotQtimeCsv(): string {
  const header = 'lot_id,product_code,source_step,target_step,dispatch_time,arrival_time,elapsed_minutes,qtime_limit_minutes,qtime_risk_status,foup_id';
  const rows: string[] = [header];

  const pairs = [
    { src: 'CLEAN_PRE_OX', tgt: 'FURNACE_GATE_OX', limit: 120 },
    { src: 'PHOTO_EXPOSE', tgt: 'ETCH_HARC', limit: 180 },
    { src: 'METAL_CMP', tgt: 'CLEAN_POST_CMP', limit: 90 },
    { src: 'ETCH_GATE', tgt: 'ASHING_PR_STRIP', limit: 60 },
  ];
  const products = ['DRAM-1B', 'NAND-V8', 'CIS-4K', 'HBM3E'];

  for (let i = 1; i <= 120; i++) {
    const lotId = `LOT-2026-Q${String(i).padStart(3, '0')}`;
    const prod = products[i % products.length];
    const pair = pairs[i % pairs.length];
    const foup = `FOUP-${String.fromCharCode(65 + (i % 4))}${100 + (i % 30)}`;

    const hour = 6 + Math.floor(i / 15);
    const minute = (i * 7) % 60;
    const dispatchTime = `2026-09-07 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Calculate elapsed time
    let elapsed = Math.round(pair.limit * (0.3 + (i % 10) * 0.08));
    let status = 'SAFE';

    if (i % 17 === 0) {
      elapsed = pair.limit + 15 + (i % 25);
      status = 'VIOLATED_INTERLOCK';
    } else if (i % 8 === 0) {
      elapsed = pair.limit - 10 + (i % 8);
      status = 'WARNING_EXPIRING_SOON';
    }

    const arrivalHour = hour + Math.floor((minute + elapsed) / 60);
    const arrivalMin = (minute + elapsed) % 60;
    const arrivalTime = `2026-09-07 ${String(arrivalHour).padStart(2, '0')}:${String(arrivalMin).padStart(2, '0')}`;

    rows.push(
      `${lotId},${prod},${pair.src},${pair.tgt},${dispatchTime},${arrivalTime},${elapsed},${pair.limit},${status},${foup}`
    );
  }

  return rows.join('\n');
}

export function getInitialDatasets(): SampleDataset[] {
  const waferCsv = generateWafer300mmDefectsCsv();
  const overlayCsv = generateLithoOverlayCsv();
  const femCsv = generateLithoFemCdCsv();
  const edsCsv = generateEdsProbeBinCsv();
  const rsCsv = generateIonImplantRsCsv();
  const fdcCsv = generateEtchFdcCsv();
  const cmpCsv = generateCmpMetrologyCsv();
  const qtimeCsv = generateLotQtimeCsv();

  const stats1 = calculateCsvStats(waferCsv);
  const stats2 = calculateCsvStats(overlayCsv);
  const stats3 = calculateCsvStats(femCsv);
  const stats4 = calculateCsvStats(edsCsv);
  const stats5 = calculateCsvStats(rsCsv);
  const stats6 = calculateCsvStats(fdcCsv);
  const stats7 = calculateCsvStats(cmpCsv);
  const stats8 = calculateCsvStats(qtimeCsv);

  return [
    {
      id: 'dataset-wafer-defect-map-spatial',
      title: '300mm 웨이퍼 전면 결함 맵 & 불량 패턴 클러스터링 데이터',
      fileName: 'wafer_300mm_defect_map_clusters.csv',
      description: '300mm 웨이퍼 실측 결함 165건(결함 밀도 D0 분석 기준), Die X/Y 격자 좌표, 물리 위치(mm), 결함 유형(Scratch, Ring, Bridge, Edge, Void, Particle) 및 클러스터 패턴 라벨',
      csvContent: waferCsv,
      fileSize: stats1.fileSize,
      rowCount: stats1.rowCount,
      uploadedAt: Date.now() - 3600000 * 3,
      uploadedBy: '강사 (반도체 수율 분석팀)',
    },
    {
      id: 'dataset-litho-overlay-metrology',
      title: '포토리소그래피 스캐너 층간 오버레이(Overlay) 정합 오차 데이터',
      fileName: 'photo_scanner_overlay_metrology.csv',
      description: '노광 스캐너 샷별 X/Y 정합 오차(dx, dy, total vector nm, 125건), 층간(Gate-Fin, M1-Gate, Via-M1) 오버레이 잔여오차 및 보정 계수',
      csvContent: overlayCsv,
      fileSize: stats2.fileSize,
      rowCount: stats2.rowCount,
      uploadedAt: Date.now() - 3600000 * 2.5,
      uploadedBy: '강사 (노광 포토 공정팀)',
    },
    {
      id: 'dataset-litho-fem-cd',
      title: '노광 초점-도즈 매트릭스(FEM) & 임계선폭(CD) 계측 데이터',
      fileName: 'litho_fem_cd_metrology.csv',
      description: '초점 오프셋(um), 노광 도즈량(mJ), 패턴 임계선폭(CD nm, 125건), Iso-Dense 바이어스, 측벽 각도(Side-wall angle) 및 공정 마진(Process Window) 판정',
      csvContent: femCsv,
      fileSize: stats3.fileSize,
      rowCount: stats3.rowCount,
      uploadedAt: Date.now() - 3600000 * 2,
      uploadedBy: '강사 (노광 포토 공정팀)',
    },
    {
      id: 'dataset-eds-probe-bin',
      title: '웨이퍼 EDS 프로브 테스트 다이 Binning & 수율 맵 데이터',
      fileName: 'eds_wafer_probe_bin_map.csv',
      description: '웨이퍼 다이별 EDS 테스트 결과(150건, BIN 1 Prime Pass, BIN 2 Leakage, BIN 3 Open/Short, BIN 4 Speed, BIN 5 Retention), 누설전류(uA), 문턱전압(mV)',
      csvContent: edsCsv,
      fileSize: stats4.fileSize,
      rowCount: stats4.rowCount,
      uploadedAt: Date.now() - 3600000 * 1.5,
      uploadedBy: '강사 (반도체 테스트/수율팀)',
    },
    {
      id: 'dataset-ion-implant-rs',
      title: '이온주입(Ion Implant) 공정 면저항(Rs) 49-포인트 균일도 맵',
      fileName: 'ion_implant_sheet_resistance_map.csv',
      description: '도펀트(B, P, As), 주입 에너지/도즈, 3개 로트 49포인트(총 147건) 반경별 면저항(ohm/sq), 중심-에지 편차율(%), 주입 균일도 판정 로그',
      csvContent: rsCsv,
      fileSize: stats5.fileSize,
      rowCount: stats5.rowCount,
      uploadedAt: Date.now() - 3600000 * 1,
      uploadedBy: '강사 (박막/확산 공정팀)',
    },
    {
      id: 'dataset-etch-fdc',
      title: '식각 챔버 FDC 센서 실시간 이상감지 로그',
      fileName: 'etch_chamber_fdc_sensors.csv',
      description: '식각 챔버 4대의 RF 제어 전력, 반사파, 진공 압력(mTorr), ESC 정전척 온도, 반응 가스 유량(sccm, 140건) 및 이상 알람 태그',
      csvContent: fdcCsv,
      fileSize: stats6.fileSize,
      rowCount: stats6.rowCount,
      uploadedAt: Date.now() - 3600000 * 0.7,
      uploadedBy: '강사 (식각 공정/설비팀)',
    },
    {
      id: 'dataset-cmp-metrology',
      title: 'CMP 화학기계연마 박막 두께 & 면내 균일도 계측 데이터',
      fileName: 'cmp_thickness_metrology.csv',
      description: '연마 헤드 회전수, 압력, 중심/미드/에지 박막 잔류 두께(nm, 125건), 면내 균일도(WIWNU %), 연마율(Removal Rate) 판정 로그',
      csvContent: cmpCsv,
      fileSize: stats7.fileSize,
      rowCount: stats7.rowCount,
      uploadedAt: Date.now() - 1800000,
      uploadedBy: '강사 (CMP 공정팀)',
    },
    {
      id: 'dataset-lot-qtime',
      title: 'FAB 공정간 웨이퍼 로트 Q-Time 추적 및 인터락 로그',
      fileName: 'fab_lot_qtime_tracking.csv',
      description: '로트 ID별 출발/목적 공정, 경과 시간, 큐타임 상한(분, 120건), 초과 리스크 및 자동 인터락 격리 상태 로그',
      csvContent: qtimeCsv,
      fileSize: stats8.fileSize,
      rowCount: stats8.rowCount,
      uploadedAt: Date.now() - 900000,
      uploadedBy: '강사 (FAB 제조물류팀)',
    },
  ];
}
