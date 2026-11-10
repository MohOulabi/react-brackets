import { useState } from 'react';
import { Bracket, type Labels, reportResult, singleElimination } from 'react-brackets';
import styles from './app.module.css';

interface Language {
  dir: 'rtl' | 'ltr';
  lang: string;
  name: string;
  title: string;
  meta: string;
  clubs: string[];
  rounds: string[];
  labels: Partial<Labels>;
}

const arabic: Language = {
  dir: 'rtl',
  lang: 'ar',
  name: 'العربية',
  title: 'كأس الأبطال',
  meta: 'ثمانية أندية، مباراة واحدة لكل دور.',
  clubs: ['الصقور', 'الذئاب', 'البلشون', 'الوشق', 'الحيتان', 'الغربان', 'الثيران', 'الكوبرا'],
  rounds: ['ربع النهائي', 'نصف النهائي', 'النهائي'],
  labels: {
    tbd: 'لم يحدد',
    bye: 'تأهل مباشر',
    previous: 'الدور السابق',
    next: 'الدور التالي',
    rounds: 'الأدوار',
  },
};

const english: Language = {
  dir: 'ltr',
  lang: 'en',
  name: 'English',
  title: 'Champions Cup',
  meta: 'Eight clubs, one match a round.',
  clubs: ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'],
  rounds: ['Quarterfinals', 'Semifinals', 'Final'],
  labels: {},
};

function cup({ clubs, rounds }: Language) {
  return reportResult(
    singleElimination(
      clubs.map((name, index) => ({ id: `club-${index + 1}`, name })),
      { roundName: (index) => rounds[index] ?? `${index + 1}` },
    ),
    'main.r1.m1',
    { scores: [2, 1] },
  );
}

export function App() {
  const [language, setLanguage] = useState(arabic);

  return (
    <div dir={language.dir} lang={language.lang} className={styles.app}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{language.title}</h2>
          <p className={styles.meta}>{language.meta}</p>
        </div>
        <fieldset className={styles.switch} aria-label="Language">
          {[arabic, english].map((option) => (
            <button
              key={option.lang}
              type="button"
              lang={option.lang}
              aria-pressed={option === language}
              onClick={() => setLanguage(option)}
            >
              {option.name}
            </button>
          ))}
        </fieldset>
      </header>
      <Bracket stage={cup(language)} connectorRadius={8} labels={language.labels} />
    </div>
  );
}
