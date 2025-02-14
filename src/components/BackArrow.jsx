import { Link } from 'react-router-dom'

function BackArrow({ to }) {
  return (
    <div className="nav-arrow">
      <Link to={to} className="back-arrow">←</Link>
    </div>
  )
}

export default BackArrow 