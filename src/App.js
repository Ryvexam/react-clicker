import React from 'react';
import './App.css';
import ClickerGame from './components/ClickerGame'; // Changed from { ClickerGame }

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1 className="text-4xl font-bold mb-8">Clicker Game</h1>
                <ClickerGame />
            </header>
        </div>
    );
}

export default App;