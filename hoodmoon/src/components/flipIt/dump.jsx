
// components/Header.jsx
import React from 'react';

const Header = ({ balance }) => {
  const getBalanceColor = () => {
    if (balance >= 100) return '#00e5a0';
    if (balance < 25) return '#ff4d6a';
    return '#f0b429';
  };
  
  return (
    <header className="game-header">
      <div className="logo">
        FLIP<span>IT</span>
      </div>
      <div className="balance-pill">
        <span className="balance-label">Balance</span>
        <span 
          className="balance-value" 
          style={{ color: getBalanceColor() }}
        >
          ${balance.toFixed(2)}
        </span>
      </div>
    </header>
  );
};

export default Header;

// components/HistorySection.jsx
import React from 'react';

const HistorySection = ({ history }) => {
  return (
    <section className="history-section">
      <p className="section-label">Last flips</p>
      <div className="history-chips" id="history-chips">
        {history.map((item, index) => (
          <span
            key={index}
            className={`hist-chip ${item.side}`}
            style={{ opacity: item.won ? 1 : 0.42 }}
            title={`${item.side} — ${item.won ? 'WIN' : 'LOSS'}`}
          >
            {item.side === 'heads' ? 'H' : 'T'}
          </span>
        ))}
      </div>
    </section>
  );
};

export default HistorySection;

// components/PickSection.jsx
import React from 'react';

const PickSection = ({ chosenSide, setChosenSide, disabled }) => {
  return (
    <section className="pick-section">
      <p className="section-label">Choose your side</p>
      <div className="pick-buttons">
        <button
          className={`pick-btn ${chosenSide === 'heads' ? 'active' : ''}`}
          data-side="heads"
          onClick={() => setChosenSide('heads')}
          disabled={disabled}
        >
          <span className="pick-icon">H</span>
          <span className="pick-name">HEADS</span>
          <span className="pick-odds">2×</span>
        </button>
        <button
          className={`pick-btn ${chosenSide === 'tails' ? 'active' : ''}`}
          data-side="tails"
          onClick={() => setChosenSide('tails')}
          disabled={disabled}
        >
          <span className="pick-icon">T</span>
          <span className="pick-name">TAILS</span>
          <span className="pick-odds">2×</span>
        </button>
      </div>
    </section>
  );
};

export default PickSection;

// components/BetSection.jsx
import React from 'react';

const BetSection = ({ balance, betAmount, setBetAmount, disabled, onPlaceBet, gamePhase }) => {
  const handleQuickBet = (multiplier) => {
    if (disabled) return;
    
    let newBet;
    if (multiplier === 'half') {
      newBet = Math.max(1, Math.floor(betAmount * 0.5));
    } else if (multiplier === 'double') {
      newBet = Math.min(balance, Math.floor(betAmount * 2));
    } else if (multiplier === 'max') {
      newBet = Math.floor(balance);
    }
    
    setBetAmount(newBet);
    const input = document.getElementById('bet-input');
    if (input) input.value = newBet;
  };
  
  const getStatusText = () => {
    if (gamePhase === 'countdown') return 'Betting open — place your bet!';
    if (gamePhase === 'flipping') return 'Flipping coin...';
    if (gamePhase === 'result') return 'Round complete!';
    if (gamePhase === 'idle') return 'Place your bet and pick a side';
    return 'Ready to flip!';
  };
  
  const getStatusClass = () => {
    if (gamePhase === 'countdown') return 'active';
    if (gamePhase === 'flipping') return 'flipping';
    if (gamePhase === 'result') return 'win';
    return '';
  };
  
  return (
    <section className="bet-section">
      <div className="bet-row">
        <div className="bet-field">
          <label className="section-label" htmlFor="bet-input">Bet Amount</label>
          <div className="bet-input-wrap">
            <span className="bet-currency">$</span>
            <input
              type="number"
              id="bet-input"
              className="bet-input"
              defaultValue={betAmount}
              min="1"
              step="1"
              disabled={disabled}
              onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="quick-bets">
          <button className="quick-btn" onClick={() => handleQuickBet('half')} disabled={disabled}>
            ½
          </button>
          <button className="quick-btn" onClick={() => handleQuickBet('double')} disabled={disabled}>
            2×
          </button>
          <button className="quick-btn" onClick={() => handleQuickBet('max')} disabled={disabled}>
            Max
          </button>
        </div>
      </div>
      
      <div className={`status-bar ${getStatusClass()}`}>
        <span id="status-text">{getStatusText()}</span>
      </div>
    </section>
  );
};

export default BetSection;