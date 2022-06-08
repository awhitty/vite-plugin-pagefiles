import './App.css'

function makePath() {
  return '/abc'
}

global.foo = 'bar';

export const meta = {
  path: makePath(),
  // jsx: <div>Howdy</div>
}

export default function Home() {
  return <div>Howdy!</div>
}
