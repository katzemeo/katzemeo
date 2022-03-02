import { h } from '../nano.ts'

export const Hello = () => {
  const game = `dnf4life.html`;
  return <div>
    <h1>Welcome to KatzeMèo website!</h1>
    <h3>Do you want to play <a href={game}>ein cooles spiel</a>?</h3>
  </div>
}