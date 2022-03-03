import { h } from '../nano.ts'

export const Hello = () => {
  const game = `dnf4life.html`;
  const image = `favicon.png`;
  return <div>
    <h1>Welcome to KatzeMèo website!</h1>
    <h3>Do you want to play <a href={game} style="text-decoration: none;">ein cooles spiel <img src={image} alt="Toni's Adventure" width="16" height="16"/></a>?</h3>
  </div>
}