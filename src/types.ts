export interface AuditRecord {
  id: string;
  an: string;
  dcDate: string;
  sumAdjRwBefore: number;
  sumAdjRwAfter: number;
  difference: number;
  auditor: string;
  department: string;
  diagnosis: string;
  // Clinical fields from DRG Seeker
  age: number;
  ageDay: number;
  sex: string;
  discType: string;
  admWt: number;
  losd: number;
  loshr: number;
  pdx: string;
  icd10: string[]; // SDx1 - SDx12
  icd9: string[];  // Proc1 - Proc20
  createdAt: string;
}

export const AUDITORS = [
  "พ.กิตติศักดิ์",
  "พ.ณัฐกานต์",
  "พ.ปฏิญญา",
  "พ.รุจาภา",
  "พ.สมใจ",
  "พ.สายชล",
  "พ.อัจฉริยา"
].sort((a, b) => a.localeCompare(b, 'th'));

export const DEPARTMENTS = [
  "กุมารเวชกรรม",
  "จักษุ",
  "จิตเวช",
  "นรีเวช",
  "ศัลยกรรม",
  "ศัลยกรรมกระดูก",
  "ศัลยกรรมตกเเต่ง",
  "ศัลยกรรมทางเดินปัสสาวะ",
  "สูติกรรม",
  "หู คอ จมูก",
  "อายุรกรรม",
  "Maxillo-facial"
].sort((a, b) => a.localeCompare(b, 'th'));
