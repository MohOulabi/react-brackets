import { Bracket, reportResult, singleElimination } from 'react-brackets';

const clubs = ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'الشباب', 'التعاون', 'الفتح', 'الرائد'];

const roundNames = ['ربع النهائي', 'نصف النهائي', 'النهائي'];

const stage = reportResult(
  singleElimination(
    clubs.map((name, index) => ({ id: `club-${index + 1}`, name })),
    { roundName: (index) => roundNames[index] ?? `الجولة ${index + 1}` },
  ),
  'main.r1.m1',
  { scores: [2, 1] },
);

export function App() {
  return (
    <div dir="rtl" lang="ar">
      <Bracket
        stage={stage}
        connectorRadius={8}
        labels={{
          tbd: 'لم يحدد',
          bye: 'تأهل مباشر',
          previous: 'الجولة السابقة',
          next: 'الجولة التالية',
          rounds: 'الجولات',
        }}
      />
    </div>
  );
}
