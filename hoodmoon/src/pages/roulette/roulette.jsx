import { Navigate, Route, Routes } from "react-router-dom";

const Roulette = () => {
  return (
    <>
      <Routes>
        <Route path="" element={<Crash />} />
        <Route path="flipit" element={<FlipIt />} />
        <Route path="blackjack" element={<BlackJack />} />
        <Route path="roulette" element={<Roulette />} />
        <Route path={"*"} element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
};

export default Roulette;
