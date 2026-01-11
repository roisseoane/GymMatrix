import { HashRouter, Routes, Route } from 'react-router-dom';
import { ExerciseMatrix } from './components/ExerciseMatrix';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-text">
        <Routes>
          <Route path="/" element={<ExerciseMatrix />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
