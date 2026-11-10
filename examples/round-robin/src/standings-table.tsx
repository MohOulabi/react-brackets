import { participantMap, type Stage, standings } from 'react-brackets';

export function StandingsTable({
  stage,
  groupId,
  className,
}: {
  stage: Stage;
  groupId?: string;
  className?: string;
}) {
  const names = participantMap(stage);
  return (
    <table className={className}>
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th title="Played">P</th>
          <th title="Won">W</th>
          <th title="Drawn">D</th>
          <th title="Lost">L</th>
          <th title="Goal difference">+/-</th>
          <th title="Points">Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings(stage, groupId).map((row, index) => (
          <tr key={row.participantId}>
            <td>{index + 1}</td>
            <td>{names.get(row.participantId)?.name}</td>
            <td>{row.played}</td>
            <td>{row.wins}</td>
            <td>{row.draws}</td>
            <td>{row.losses}</td>
            <td>{row.scored - row.conceded}</td>
            <td>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
