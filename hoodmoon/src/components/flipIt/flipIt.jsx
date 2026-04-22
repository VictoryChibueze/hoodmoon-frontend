// App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./flipIt.module.css";
import Canvas from "./components/CoinCanvas";
import Header from "./components/Header";
import CenterDisplay from "./components/CenterDisplay";
import PickSection from "./components/PickSection";
import BetSection from "./components/BetSection";
import HistorySection from "./components/HistorySection";

const FlipIt = () => {
  // Game State
  const [balance, setBalance] = useState(100);
  const [betAmount, setBetAmount] = useState(10);
  const [chosenSide, setChosenSide] = useState("heads");
  const [gamePhase, setGamePhase] = useState("idle"); // idle, countdown, flipping, result
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [countdown, setCountdown] = useState(5);

  // Refs for animation coordination
  const coinAnimatorRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Constants
  const COUNTDOWN_SEC = 5;
  const RESULT_HOLD_MS = 2600;

  // Update balance display
  const updateBalance = useCallback((newBalance) => {
    setBalance(newBalance);
  }, []);

  // Add to history
  const addHistory = useCallback((side, won) => {
    setHistory((prev) => [{ side, won }, ...prev].slice(0, 12));
  }, []);

  // Start countdown
  const startCountdown = useCallback((onComplete) => {
    let remaining = COUNTDOWN_SEC;
    setCountdown(remaining);
    setGamePhase("countdown");

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 0.1;
      setCountdown(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        onComplete();
      }
    }, 100);
  }, []);

  // Stop countdown
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Execute flip round
  const executeFlip = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) {
      return false;
    }

    // Deduct bet
    setBalance((prev) => prev - betAmount);

    // Generate random result
    const flipResult = Math.random() < 0.5 ? "heads" : "tails";
    setResult(flipResult);
    setGamePhase("flipping");

    // Trigger coin animation (handled by CoinCanvas component)
    return flipResult;
  }, [betAmount, balance]);

  // Handle flip complete (callback from animation)
  const onFlipComplete = useCallback(
    (flipResult, won) => {
      if (won) {
        setBalance((prev) => prev + betAmount * 2);
      }

      addHistory(flipResult, won);
      setGamePhase("result");

      // Auto reset after showing result
      setTimeout(() => {
        setGamePhase("idle");
        setResult(null);
        startCountdown(() => {
          const flipResult = executeFlip();
          if (flipResult) {
            // Animation will be triggered by CoinCanvas
            window.dispatchEvent(
              new CustomEvent("triggerFlip", { detail: flipResult }),
            );
          } else {
            setGamePhase("idle");
          }
        });
      }, RESULT_HOLD_MS);
    },
    [betAmount, addHistory, executeFlip, startCountdown],
  );

  // Handle bet placement from UI
  const placeBet = useCallback(() => {
    if (gamePhase !== "idle" && gamePhase !== "countdown") return;

    const bet = parseFloat(document.getElementById("bet-input")?.value) || 0;
    if (bet <= 0 || bet > balance) {
      // Shake input
      const input = document.getElementById("bet-input");
      if (input) {
        input.style.outline = "2px solid #ff4d6a";
        setTimeout(() => {
          input.style.outline = "";
        }, 500);
      }
      return;
    }

    setBetAmount(bet);
  }, [balance, gamePhase]);

  // Start the game loop
  useEffect(() => {
    startCountdown(() => {
      const flipResult = executeFlip();
      if (flipResult) {
        // Trigger animation after a tiny delay to ensure component is ready
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("triggerFlip", { detail: flipResult }),
          );
        }, 50);
      } else {
        setGamePhase("idle");
      }
    });

    return () => {
      stopCountdown();
    };
  }, []);

  return (
    <div className="game-container">
      <div className="bg-glow"></div>

      <div className="game-wrapper">
        <Header balance={balance} />

        <Canvas
          gamePhase={gamePhase}
          result={result}
          onFlipComplete={(won) => {
            if (result) {
              onFlipComplete(result, result === chosenSide);
            }
          }}
        />

        <CenterDisplay
          gamePhase={gamePhase}
          countdown={countdown}
          result={result}
          won={result === chosenSide}
          betAmount={betAmount}
        />

        <PickSection
          chosenSide={chosenSide}
          setChosenSide={setChosenSide}
          disabled={gamePhase !== "idle" && gamePhase !== "countdown"}
        />

        <BetSection
          balance={balance}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          disabled={gamePhase !== "idle" && gamePhase !== "countdown"}
          onPlaceBet={placeBet}
          gamePhase={gamePhase}
        />

        <HistorySection history={history} />
      </div>
    </div>
  );
};

export default FlipIt;
