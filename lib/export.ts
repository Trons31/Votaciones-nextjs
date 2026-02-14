import ExcelJS from "exceljs";
import { formatIsoCO, nowStampCO } from "./time";

type LeaderLite = { id: number; nombresLider: string; apellidosLider: string } | null;

export type VoterExportRow = {
  id: number;
  cedulaVotante: string;
  nombres: string;
  apellidos: string;
  dondeVota: string | null;
  mesaVotacion: string | null;
  leaderId: number | null;
  leader: LeaderLite;
  origen: string | null;
  checkedIn: boolean;
  checkedInAt: Date | null;
  fechaRegistro: Date;
};

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  // Quote if contains special chars
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function votersToCsv(voters: VoterExportRow[]): Buffer {
  const header = [
    "id",
    "cedula_votante",
    "nombres",
    "apellidos",
    "puesto_votacion",
    "mesa_votacion",
    "leader_id",
    "leader_nombre",
    "origen",
    "checked_in",
    "checked_in_at",
    "fecha_registro"
  ];

  const lines: string[] = [];
  lines.push(header.map(csvCell).join(","));

  for (const v of voters) {
    lines.push(
      [
        v.id,
        v.cedulaVotante,
        v.nombres,
        v.apellidos,
        v.dondeVota ?? "",
        v.mesaVotacion ?? "",
        v.leaderId ?? "",
        v.leader ? `${v.leader.nombresLider} ${v.leader.apellidosLider}` : "",
        v.origen ?? "",
        v.checkedIn ? "1" : "0",
        v.checkedInAt ? formatIsoCO(v.checkedInAt) : "",
        formatIsoCO(v.fechaRegistro)
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}

export async function votersToXlsx(voters: VoterExportRow[], sheetName = "Votantes"): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31));

  const headers = [
    "id",
    "cedula_votante",
    "nombres",
    "apellidos",
    "puesto_votacion",
    "mesa_votacion",
    "leader_id",
    "leader_nombre",
    "origen",
    "checked_in",
    "checked_in_at",
    "fecha_registro"
  ];

  ws.addRow(headers);

  for (const v of voters) {
    ws.addRow([
      v.id,
      v.cedulaVotante,
      v.nombres,
      v.apellidos,
      v.dondeVota ?? "",
      v.mesaVotacion ?? "",
      v.leaderId ?? "",
      v.leader ? `${v.leader.nombresLider} ${v.leader.apellidosLider}` : "",
      v.origen ?? "",
      v.checkedIn ? 1 : 0,
      v.checkedInAt ? formatIsoCO(v.checkedInAt) : "",
      formatIsoCO(v.fechaRegistro)
    ]);
  }

  // Ajuste simple de ancho de columnas
  ws.columns.forEach((c) => {
    if (c) c.width = 18;
  });

  const arrayBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuf as ArrayBuffer);
}

export type ReportData = {
  resumen: Record<string, string | number>;
  porLider: Array<[string, number]>;
  porColegio: Array<[string, number]>;
  porMesa: Array<[string, string, number]>;
};

export function reportToCsv(data: ReportData): Buffer {
  const lines: string[] = [];
  const w = (row: unknown[]) => lines.push(row.map(csvCell).join(","));

  w(["REPORTE", "TOTAL"]);
  for (const [k, v] of Object.entries(data.resumen)) w([k, v]);

  w([]);
  w(["POR LIDER"]);
  w(["lider", "cantidad"]);
  for (const [lider, cnt] of data.porLider) w([lider, cnt]);

  w([]);
  w(["POR COLEGIO"]);
  w(["colegio", "cantidad"]);
  for (const [colegio, cnt] of data.porColegio) w([colegio, cnt]);

  w([]);
  w(["POR MESA"]);
  w(["colegio", "mesa", "cantidad"]);
  for (const [colegio, mesa, cnt] of data.porMesa) w([colegio, mesa, cnt]);

  return Buffer.from(lines.join("\n"), "utf-8");
}

export async function reportToXlsx(data: ReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const wsResumen = wb.addWorksheet("Resumen");
  wsResumen.addRow(["Métrica", "Valor"]);
  for (const [k, v] of Object.entries(data.resumen)) wsResumen.addRow([k, v]);
  wsResumen.getColumn(1).width = 28;
  wsResumen.getColumn(2).width = 18;

  const wsLider = wb.addWorksheet("Por Líder");
  wsLider.addRow(["Líder", "Cantidad"]);
  for (const [l, cnt] of data.porLider) wsLider.addRow([l, cnt]);
  wsLider.getColumn(1).width = 34;
  wsLider.getColumn(2).width = 14;

  const wsColegio = wb.addWorksheet("Por Colegio");
  wsColegio.addRow(["Colegio", "Cantidad"]);
  for (const [c, cnt] of data.porColegio) wsColegio.addRow([c, cnt]);
  wsColegio.getColumn(1).width = 40;
  wsColegio.getColumn(2).width = 14;

  const wsMesa = wb.addWorksheet("Por Mesa");
  wsMesa.addRow(["Colegio", "Mesa", "Cantidad"]);
  for (const [c, m, cnt] of data.porMesa) wsMesa.addRow([c, m, cnt]);
  wsMesa.getColumn(1).width = 40;
  wsMesa.getColumn(2).width = 18;
  wsMesa.getColumn(3).width = 14;

  const arrayBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuf as ArrayBuffer);
}

export function downloadName(base: string, ext: "csv" | "xlsx") {
  return `${base}_${nowStampCO()}.${ext}`;
}
