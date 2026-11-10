import { Bracket, reportResult, type Stage, singleElimination } from '@react-brackets/native';

const clubs = ['الصقور', 'الذئاب', 'البلشون', 'الوشق', 'الحيتان', 'الغربان', 'الثيران', 'الكوبرا'];
const rounds = ['ربع النهائي', 'نصف النهائي', 'النهائي'];

const stage = (
  [
    ['main.r1.m1', [2, 1]],
    ['main.r1.m2', [0, 1]],
    ['main.r1.m3', [3, 2]],
  ] as [string, [number, number]][]
).reduce<Stage>(
  (current, [match, scores]) => reportResult(current, match, { scores }),
  singleElimination(
    clubs.map((name, index) => ({ id: `club-${index + 1}`, name })),
    { roundName: (index) => rounds[index] ?? `الدور ${index + 1}` },
  ),
);

export default function RightToLeft() {
  // The first round sits on the right and the bracket swipes the other way. Apps set to
  // right to left get this without the prop.
  return <Bracket stage={stage} dir="rtl" labels={{ tbd: 'لم يحدد', bye: 'تأهل مباشر' }} />;
}
