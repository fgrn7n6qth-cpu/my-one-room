import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message ?? '알 수 없는 오류가 발생했습니다.',
    }
  }

  handleReset = () => {
    window.localStorage.removeItem('room-planner-home-styler-state')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#f5f3ee',
            color: '#111',
            padding: '32px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              width: 'min(560px, 100%)',
              border: '1px solid rgba(17,17,17,0.12)',
              background: '#fff',
              padding: '28px',
              boxShadow: '0 18px 40px rgba(17,17,17,0.08)',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6575' }}>
              Room Planner Recovery
            </p>
            <h1 style={{ margin: '0 0 12px', fontSize: '28px', lineHeight: 1.15 }}>
              화면을 불러오는 중 문제가 발생했습니다.
            </h1>
            <p style={{ margin: '0 0 18px', lineHeight: 1.6, color: '#475467' }}>
              저장된 편집 상태나 최근 변경된 화면 구성이 현재 버전과 맞지 않을 수 있습니다.
              아래 버튼으로 저장된 화면 상태를 초기화하고 다시 시작할 수 있습니다.
            </p>
            <p style={{ margin: '0 0 18px', padding: '12px 14px', background: '#f8fafc', border: '1px solid rgba(17,17,17,0.08)', color: '#344054' }}>
              오류 메시지: {this.state.message}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                minHeight: '48px',
                padding: '0 18px',
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              저장 상태 초기화 후 다시 열기
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
