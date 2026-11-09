import { participantMap, type Stage, standings } from 'react-brackets';

export function StandingsTable({ stage, groupId }: { stage: Stage; groupId?: string }) {
  const names = participantMap(stage);
  return (
    <table className="standings">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>+/-</th>
          <th>Pts</th>
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
