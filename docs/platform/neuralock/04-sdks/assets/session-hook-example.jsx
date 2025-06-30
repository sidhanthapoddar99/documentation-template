import React, { useEffect } from 'react';
import { useNeuralockSession } from '@neuralock/react';

function SessionMonitor() {
  const { 
    session, 
    timeRemaining, 
    isExpired, 
    refresh,
    isRefreshing,
    error 
  } = useNeuralockSession();

  // Auto-refresh when session is about to expire
  useEffect(() => {
    if (timeRemaining > 0 && timeRemaining < 60000 && !isRefreshing) {
      // Less than 1 minute remaining
      console.log('Session expiring soon, refreshing...');
      refresh();
    }
  }, [timeRemaining, refresh, isRefreshing]);

  // Convert milliseconds to readable format
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate session health
  const getSessionHealth = () => {
    if (isExpired) return { status: 'expired', color: 'red' };
    if (timeRemaining < 60000) return { status: 'critical', color: 'orange' };
    if (timeRemaining < 300000) return { status: 'warning', color: 'yellow' };
    return { status: 'healthy', color: 'green' };
  };

  const health = getSessionHealth();

  return (
    <div className="session-monitor">
      <h3>Session Status</h3>
      
      <div className={`status-indicator ${health.status}`}>
        <span 
          className="status-dot" 
          style={{ backgroundColor: health.color }}
        />
        <span className="status-text">
          {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
        </span>
      </div>

      {session && (
        <div className="session-details">
          <div className="detail-item">
            <label>Session ID:</label>
            <span>{session.id.substring(0, 8)}...</span>
          </div>
          
          <div className="detail-item">
            <label>Created:</label>
            <span>{new Date(session.createdAt).toLocaleTimeString()}</span>
          </div>
          
          <div className="detail-item">
            <label>Expires:</label>
            <span>{new Date(session.expiresAt).toLocaleTimeString()}</span>
          </div>
          
          <div className="detail-item">
            <label>Time Remaining:</label>
            <span className={`time-remaining ${health.status}`}>
              {isExpired ? 'Expired' : formatTime(timeRemaining)}
            </span>
          </div>
          
          <div className="detail-item">
            <label>Connected Servers:</label>
            <span>{session.servers.length}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}

      <div className="session-actions">
        <button 
          onClick={refresh}
          disabled={isRefreshing || isExpired}
          className="refresh-button"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
        </button>
      </div>

      <style jsx>{`
        .session-monitor {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          margin: 16px 0;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .session-details {
          margin: 16px 0;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }

        .detail-item label {
          font-weight: bold;
          color: #666;
        }

        .time-remaining.critical {
          color: orange;
          font-weight: bold;
        }

        .time-remaining.warning {
          color: #f0ad4e;
        }

        .time-remaining.expired {
          color: red;
          font-weight: bold;
        }

        .refresh-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .refresh-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          color: red;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}

// Usage in a dashboard
function Dashboard() {
  const { isExpired } = useNeuralockSession();
  
  return (
    <div className="dashboard">
      <SessionMonitor />
      
      {isExpired && (
        <div className="session-expired-banner">
          Your session has expired. Please reconnect to continue.
        </div>
      )}
      
      {/* Rest of your dashboard content */}
    </div>
  );
}