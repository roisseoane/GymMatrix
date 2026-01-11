import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-text">
        <Routes>
          <Route path="/" element={<div />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
