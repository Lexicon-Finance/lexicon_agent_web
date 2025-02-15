import { useNavigate } from 'react-router-dom'

const FeatureCard = ({ icon, title, description, enabled, onClick }) => (
  <div className="feature-card" onClick={enabled ? onClick : undefined}>
    <div className="feature-icon">{icon}</div>
    <h2>{title}</h2>
    <p>{description}</p>
    <button className="feature-btn" disabled={!enabled}>
      {enabled ? 'Get Started' : 'Coming Soon'}
    </button>
  </div>
)

function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: '🛡️',
      title: 'Security Officer',
      description: 'Advanced risk detector and intent matcher to keep your journey safe',
      enabled: true,
      onClick: () => navigate('/instructions')
    },
    {
      icon: '💰',
      title: 'Financial Advisor',
      description: 'Smart portfolio management and investment recommendations to grow your wealth',
      enabled: false
    },
    {
      icon: '🎯',
      title: 'Intent Operator',
      description: 'Build and execute complex operations with simple natural language',
      enabled: false
    }
  ]

  return (
    <div className="landing-page">
      <div className="brand-name">
        <span className="logo">🤖</span>
        <span className="name">Lexicon Agent</span>
      </div>
      
      <div className="hero-section">
        <h1 className="hero-title">Your AI Partner in Web3</h1>
        <p className="hero-subtitle">Empowering your Web3 journey with AI agents</p>
      </div>

      <div className="features-container">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>

      <style jsx>{`
        .brand-name {
          position: absolute;
          top: 20px;
          left: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }

        .logo {
          font-size: 28px;
        }

        .name {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
      `}</style>
    </div>
  )
}

export default LandingPage 