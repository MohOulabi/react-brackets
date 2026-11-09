import { useEffect, useState } from 'react';
import { Bracket, type Participant, singleElimination } from 'react-brackets';

const placeholders: Participant[] = Array.from({ length: 8 }, (_, index) => ({
  id: `placeholder-${index}`,
  name: '',
}));
const skeleton = singleElimination(placeholders);

function fetchTeams(): Promise<Participant[]> {
  const names = ['Falcons', 'Wolves', 'Herons', 'Lynx', 'Orcas', 'Ravens', 'Bison', 'Cobras'];
  return new Promise((resolve) =>
    setTimeout(() => resolve(names.map((name) => ({ id: name, name }))), 1500),
  );
}

export function App() {
  const [request, setRequest] = useState(0);

  return (
    <main>
      <button type="button" onClick={() => setRequest(request + 1)}>
        Load again
      </button>
      <Draw key={request} />
    </main>
  );
}

function Draw() {
  const [teams, setTeams] = useState<Participant[] | null>(null);

  useEffect(() => {
    let current = true;
    fetchTeams().then((loaded) => current && setTeams(loaded));
    return () => {
      current = false;
    };
  }, []);

  return (
    <div aria-busy={teams === null}>
      {teams ? (
        <Bracket stage={singleElimination(teams)} />
      ) : (
        <Bracket stage={skeleton} highlightOnHover={false} renderMatch={SkeletonMatch} />
      )}
    </div>
  );
}

function SkeletonMatch() {
  return (
    <Bracket.Match aria-hidden>
      <Bracket.Participant slot={0}>
        <span className="skeleton">Placeholder</span>
      </Bracket.Participant>
      <Bracket.Participant slot={1}>
        <span className="skeleton">Team</span>
      </Bracket.Participant>
    </Bracket.Match>
  );
}
