// const App = () => {
//   return <div></div>;
// };

// export default App;


// frontend/src/components/CrashGame.tsx
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import * as PIXI from 'pixi.js';
// import { io, Socket } from 'socket.io-client';

// interface GameState {
//     status: 'waiting' | 'active' | 'crashed';
//     multiplier: number;
//     roundId: string;
//     serverSeedHash?: string;
//     crashPoint?: number;
// }

// export const CrashGame: React.FC = () => {
//     const canvasRef = useRef<HTMLDivElement>(null);
//     const appRef = useRef<PIXI.Application | null>(null);
//     const rocketRef = useRef<PIXI.Sprite | null>(null);
//     const socketRef = useRef<Socket | null>(null);
    
//     const [gameState, setGameState] = useState<GameState>({
//         status: 'waiting',
//         multiplier: 1.00,
//         roundId: ''
//     });
//     const [betAmount, setBetAmount] = useState(10);
//     const [autoCashout, setAutoCashout] = useState<number | null>(null);
//     const [balance, setBalance] = useState(1000);
//     const [hasBet, setHasBet] = useState(false);
    
//     // Initialize PixiJS
//     useEffect(() => {
//         if (!canvasRef.current) return;
        
//         const app = new PIXI.Application({
//             width: 1000,
//             height: 600,
//             backgroundColor: 0x0a0a2a,
//             antialias: true
//         });
        
//         canvasRef.current.appendChild(app.view as unknown as Node);
//         appRef.current = app;
        
//         // Create stars background
//         const stars = new PIXI.Graphics();
//         for (let i = 0; i < 200; i++) {
//             stars.beginFill(0xffffff);
//             stars.drawCircle(Math.random() * 1000, Math.random() * 600, Math.random() * 2);
//             stars.endFill();
//         }
//         app.stage.addChild(stars);
        
//         // Create rocket
//         const rocket = createRocket();
//         rocket.x = 100;
//         rocket.y = 300;
//         app.stage.addChild(rocket);
//         rocketRef.current = rocket;
        
//         // Animation loop
//         let animationId: number;
//         const animate = () => {
//             // Update rocket position based on multiplier
//             if (rocketRef.current && gameState.status === 'active') {
//                 const progress = (gameState.multiplier - 1) / 10; // Cap at 10x
//                 const targetX = 100 + (progress * 800);
//                 rocketRef.current.x += (targetX - rocketRef.current.x) * 0.1;
                
//                 // Rocket wobble
//                 rocketRef.current.rotation = Math.sin(Date.now() * 0.008) * 0.1;
                
//                 // Scale flame based on multiplier
//                 updateFlameSize(rocketRef.current, gameState.multiplier);
//             }
//             animationId = requestAnimationFrame(animate);
//         };
//         animate();
        
//         return () => {
//             cancelAnimationFrame(animationId);
//             app.destroy(true);
//         };
//     }, []);
    
//     // Create detailed rocket sprite
//     const createRocket = (): PIXI.Sprite => {
//         const graphics = new PIXI.Graphics();
        
//         // Rocket body
//         graphics.beginFill(0xff4444);
//         graphics.drawRect(-15, -8, 30, 16);
        
//         // Nose cone
//         graphics.beginFill(0xff8888);
//         graphics.drawCircle(15, 0, 8);
        
//         // Fins
//         graphics.beginFill(0xcc3333);
//         graphics.drawPolygon([
//             -10, 8, -10, 15, -20, 8
//         ]);
//         graphics.drawPolygon([
//             -10, -8, -10, -15, -20, -8
//         ]);
        
//         // Window
//         graphics.beginFill(0x88ccff);
//         graphics.drawCircle(5, 0, 4);
        
//         // Flame (will be animated)
//         const flame = new PIXI.Graphics();
//         flame.beginFill(0xff6600);
//         flame.drawPolygon([
//             -12, -3, -25, 0, -12, 3
//         ]);
//         graphics.addChild(flame);
//         (graphics as any).flame = flame;
        
//         const texture = appRef.current!.renderer.generateTexture(graphics);
//         const sprite = new PIXI.Sprite(texture);
//         (sprite as any).flameGraphics = flame;
        
//         return sprite;
//     };
    
//     const updateFlameSize = (rocket: PIXI.Sprite, multiplier: number) => {
//         const flame = (rocket as any).flameGraphics;
//         if (flame) {
//             const scale = Math.min(1 + multiplier * 0.2, 3);
//             flame.scale.set(scale, scale);
//             flame.tint = multiplier > 3 ? 0xff0000 : 0xff6600;
//         }
//     };
    
//     // Socket.IO connection
//     useEffect(() => {
//         const socket = io('http://localhost:3001');
//         socketRef.current = socket;
        
//         socket.on('connect', () => {
//             socket.emit('auth', localStorage.getItem('playerId'));
//         });
        
//         socket.on('round:waiting', (data) => {
//             setGameState(prev => ({
//                 ...prev,
//                 status: 'waiting',
//                 roundId: data.roundId,
//                 serverSeedHash: data.serverSeedHash
//             }));
//             setHasBet(false);
//         });
        
//         socket.on('round:started', (data) => {
//             setGameState(prev => ({
//                 ...prev,
//                 status: 'active',
//                 multiplier: 1.00
//             }));
//         });
        
//         socket.on('multiplier:update', (data) => {
//             setGameState(prev => ({
//                 ...prev,
//                 multiplier: data.multiplier
//             }));
//         });
        
//         socket.on('round:crashed', (data) => {
//             setGameState(prev => ({
//                 ...prev,
//                 status: 'crashed',
//                 crashPoint: data.crashPoint
//             }));
            
//             // Show crash effect
//             showExplosion();
            
//             // Log fairness verification data
//             console.log('Verify round:', {
//                 serverSeed: data.serverSeed,
//                 clientSeed: data.clientSeed,
//                 nonce: data.nonce,
//                 crashPoint: data.crashPoint
//             });
//         });
        
//         socket.on('player:cashedout', (data) => {
//             if (data.playerId === localStorage.getItem('playerId')) {
//                 setBalance(prev => prev + data.winnings);
//                 showCashoutAnimation(data.multiplier);
//             }
//         });
        
//         return () => {
//             socket.disconnect();
//         };
//     }, []);
    
//     const placeBet = () => {
//         if (!hasBet && gameState.status === 'waiting') {
//             socketRef.current?.emit('bet:place', {
//                 amount: betAmount,
//                 autoCashout: autoCashout || undefined
//             });
//             setBalance(prev => prev - betAmount);
//             setHasBet(true);
//         }
//     };
    
//     const cashOut = () => {
//         if (gameState.status === 'active' && hasBet) {
//             socketRef.current?.emit('cashout');
//         }
//     };
    
//     const showExplosion = () => {
//         if (!appRef.current || !rocketRef.current) return;
        
//         const explosion = new PIXI.Graphics();
//         explosion.beginFill(0xff6600);
//         explosion.drawCircle(0, 0, 20);
//         explosion.beginFill(0xffaa00);
//         explosion.drawCircle(0, 0, 10);
//         explosion.beginFill(0xff0000);
//         explosion.drawCircle(0, 0, 5);
        
//         explosion.position.copyFrom(rocketRef.current.position);
//         appRef.current.stage.addChild(explosion);
        
//         // Animate explosion
//         let scale = 1;
//         const explodeInterval = setInterval(() => {
//             scale += 0.2;
//             explosion.scale.set(scale, scale);
//             explosion.alpha -= 0.05;
            
//             if (explosion.alpha <= 0) {
//                 clearInterval(explodeInterval);
//                 appRef.current?.stage.removeChild(explosion);
//             }
//         }, 33);
//     };
    
//     const showCashoutAnimation = (multiplier: number) => {
//         // Flash green effect on UI
//         const cashoutElement = document.getElementById('cashout-animation');
//         if (cashoutElement) {
//             cashoutElement.style.animation = 'flash 0.5s';
//             setTimeout(() => {
//                 cashoutElement.style.animation = '';
//             }, 500);
//         }
//     };
    
//     return (
//         <div className="crash-game">
//             <div className="game-canvas" ref={canvasRef} />
            
//             <div className="game-ui">
//                 <div className="multiplier-display" style={{
//                     fontSize: gameState.multiplier > 5 ? '48px' : '64px',
//                     color: gameState.multiplier > 3 ? '#ff6600' : '#ffffff'
//                 }}>
//                     {gameState.multiplier.toFixed(2)}x
//                 </div>
                
//                 {gameState.status === 'crashed' && (
//                     <div className="crash-message">
//                         💥 CRASHED at {gameState.crashPoint?.toFixed(2)}x
//                     </div>
//                 )}
                
//                 <div className="betting-panel">
//                     <div className="balance">Balance: ${balance.toFixed(2)}</div>
                    
//                     {gameState.status === 'waiting' && !hasBet && (
//                         <>
//                             <input
//                                 type="number"
//                                 value={betAmount}
//                                 onChange={(e) => setBetAmount(Number(e.target.value))}
//                                 min="1"
//                                 max={balance}
//                             />
//                             <input
//                                 type="number"
//                                 placeholder="Auto cashout at (optional)"
//                                 onChange={(e) => setAutoCashout(Number(e.target.value) || null)}
//                             />
//                             <button onClick={placeBet}>Place Bet</button>
//                         </>
//                     )}
                    
//                     {gameState.status === 'active' && hasBet && (
//                         <button className="cashout-btn" onClick={cashOut}>
//                             CASH OUT @ {gameState.multiplier.toFixed(2)}x
//                         </button>
//                     )}
                    
//                     {gameState.status === 'waiting' && hasBet && (
//                         <div className="waiting-message">
//                             Waiting for round to start...
//                         </div>
//                     )}
//                 </div>
                
//                 {/* Fairness verification link */}
//                 {gameState.serverSeedHash && (
//                     <div className="fairness-info">
//                         <small>
//                             Round Hash: {gameState.serverSeedHash.slice(0, 16)}...
//                             <button onClick={() => verifyFairness()}>Verify</button>
//                         </small>
//                     </div>
//                 )}
//             </div>
            
//             <style>{`
//                 @keyframes flash {
//                     0% { background-color: rgba(0,255,0,0); }
//                     50% { background-color: rgba(0,255,0,0.5); }
//                     100% { background-color: rgba(0,255,0,0); }
//                 }
//             `}</style>
//         </div>
//     );
// };



import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { io } from "socket.io-client";

export default function CrashGame (){
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const rocketRef = useRef(null);
  const socketRef = useRef(null);

  const [gameState, setGameState] = useState({
    status: "waiting",
    multiplier: 1.0,
    roundId: "",
  });

  const [betAmount, setBetAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(null);
  const [balance, setBalance] = useState(1000);
  const [hasBet, setHasBet] = useState(false);

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      width: 1000,
      height: 600,
      backgroundColor: 0x0a0a2a,
      antialias: true,
    });

    // canvasRef.current.appendChild(app.view);
    canvasRef.current.appendChild(app.canvas);
    appRef.current = app;

    // Stars
    const stars = new PIXI.Graphics();
    for (let i = 0; i < 200; i++) {
      stars.beginFill(0xffffff);
      stars.drawCircle(
        Math.random() * 1000,
        Math.random() * 600,
        Math.random() * 2
      );
      stars.endFill();
    }
    app.stage.addChild(stars);

    // Rocket
    const rocket = createRocket();
    rocket.x = 100;
    rocket.y = 300;
    app.stage.addChild(rocket);
    rocketRef.current = rocket;

    let animationId;

    const animate = () => {
      if (rocketRef.current && gameState.status === "active") {
        const progress = (gameState.multiplier - 1) / 10;
        const targetX = 100 + progress * 800;

        rocketRef.current.x += (targetX - rocketRef.current.x) * 0.1;
        rocketRef.current.rotation =
          Math.sin(Date.now() * 0.008) * 0.1;

        updateFlameSize(rocketRef.current, gameState.multiplier);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      app.destroy(true);
    };
  }, [gameState]);

  const createRocket = () => {
    const graphics = new PIXI.Graphics();

    graphics.beginFill(0xff4444);
    graphics.drawRect(-15, -8, 30, 16);

    graphics.beginFill(0xff8888);
    graphics.drawCircle(15, 0, 8);

    graphics.beginFill(0xcc3333);
    graphics.drawPolygon([-10, 8, -10, 15, -20, 8]);
    graphics.drawPolygon([-10, -8, -10, -15, -20, -8]);

    graphics.beginFill(0x88ccff);
    graphics.drawCircle(5, 0, 4);

    const flame = new PIXI.Graphics();
    flame.beginFill(0xff6600);
    flame.drawPolygon([-12, -3, -25, 0, -12, 3]);

    graphics.addChild(flame);

    const texture = appRef.current.renderer.generateTexture(graphics);
    const sprite = new PIXI.Sprite(texture);

    sprite.flameGraphics = flame;

    return sprite;
  };

  const updateFlameSize = (rocket, multiplier) => {
    const flame = rocket.flameGraphics;
    if (flame) {
      const scale = Math.min(1 + multiplier * 0.2, 3);
      flame.scale.set(scale, scale);
      flame.tint = multiplier > 3 ? 0xff0000 : 0xff6600;
    }
  };

  // Socket
  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("auth", localStorage.getItem("playerId"));
    });

    socket.on("round:waiting", (data) => {
      setGameState((prev) => ({
        ...prev,
        status: "waiting",
        roundId: data.roundId,
        serverSeedHash: data.serverSeedHash,
      }));
      setHasBet(false);
    });

    socket.on("round:started", () => {
      setGameState((prev) => ({
        ...prev,
        status: "active",
        multiplier: 1.0,
      }));
    });

    socket.on("multiplier:update", (data) => {
      setGameState((prev) => ({
        ...prev,
        multiplier: data.multiplier,
      }));
    });

    socket.on("round:crashed", (data) => {
      setGameState((prev) => ({
        ...prev,
        status: "crashed",
        crashPoint: data.crashPoint,
      }));

      showExplosion();
    });

    socket.on("player:cashedout", (data) => {
      if (data.playerId === localStorage.getItem("playerId")) {
        setBalance((prev) => prev + data.winnings);
        showCashoutAnimation();
      }
    });

    return () => socket.disconnect();
  }, []);

  const placeBet = () => {
    if (!hasBet && gameState.status === "waiting") {
      socketRef.current?.emit("bet:place", {
        amount: betAmount,
        autoCashout: autoCashout || undefined,
      });

      setBalance((prev) => prev - betAmount);
      setHasBet(true);
    }
  };

  const cashOut = () => {
    if (gameState.status === "active" && hasBet) {
      socketRef.current?.emit("cashout");
    }
  };

  const showExplosion = () => {
    if (!appRef.current || !rocketRef.current) return;

    const explosion = new PIXI.Graphics();

    explosion.beginFill(0xff6600);
    explosion.drawCircle(0, 0, 20);
    explosion.beginFill(0xffaa00);
    explosion.drawCircle(0, 0, 10);
    explosion.beginFill(0xff0000);
    explosion.drawCircle(0, 0, 5);

    explosion.position.copyFrom(rocketRef.current.position);
    appRef.current.stage.addChild(explosion);

    let scale = 1;

    const interval = setInterval(() => {
      scale += 0.2;
      explosion.scale.set(scale);
      explosion.alpha -= 0.05;

      if (explosion.alpha <= 0) {
        clearInterval(interval);
        appRef.current.stage.removeChild(explosion);
      }
    }, 33);
  };

  const showCashoutAnimation = () => {
    const el = document.getElementById("cashout-animation");
    if (el) {
      el.style.animation = "flash 0.5s";
      setTimeout(() => (el.style.animation = ""), 500);
    }
  };

  return (
    <div className="crash-game">
      <div className="game-canvas" ref={canvasRef} />

      <div className="game-ui">
        <div
          className="multiplier-display"
          style={{
            fontSize: gameState.multiplier > 5 ? "48px" : "64px",
            color: gameState.multiplier > 3 ? "#ff6600" : "#fff",
          }}
        >
          {gameState.multiplier.toFixed(2)}x
        </div>

        {gameState.status === "crashed" && (
          <div className="crash-message">
            💥 CRASHED at {gameState.crashPoint?.toFixed(2)}x
          </div>
        )}

        <div className="betting-panel">
          <div className="balance">
            Balance: ${balance.toFixed(2)}
          </div>

          {gameState.status === "waiting" && !hasBet && (
            <>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
              />
              <input
                type="number"
                placeholder="Auto cashout"
                onChange={(e) =>
                  setAutoCashout(Number(e.target.value) || null)
                }
              />
              <button onClick={placeBet}>Place Bet</button>
            </>
          )}

          {gameState.status === "active" && hasBet && (
            <button onClick={cashOut}>
              CASH OUT @ {gameState.multiplier.toFixed(2)}x
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
