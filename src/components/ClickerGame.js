import React, { useState, useEffect } from 'react';

const API_URL = 'api.clicker.ryvexam.fr/api';

const ClickerGame = () => {
    const [score, setScore] = useState(0);
    const [username, setUsername] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Get background color based on position
    const getPositionStyle = (position) => {
        switch (position) {
            case 0: // 1st place
                return 'bg-amber-500 text-white font-bold';
            case 1: // 2nd place
                return 'bg-slate-400 text-white font-bold';
            case 2: // 3rd place
                return 'bg-yellow-800 text-white font-bold';
            default:
                return 'bg-blue-200';
        }
    };

    // API calls
    const saveScore = async () => {
        try {
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    score: score,
                    timestamp: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save score');
            }

            // Fetch updated leaderboard after saving score
            await fetchLeaderboard();
        } catch (error) {
            console.error('Save error:', error);
            showToastMessage('Failed to save score: ' + error.message);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`${API_URL}/leaderboard`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch leaderboard');
            }
            const data = await response.json();
            setLeaderboard(data.slice(0, 10)); // Only take top 10
        } catch (error) {
            console.error('Fetch error:', error);
            if (!isLoggedIn) {
                showToastMessage('Failed to fetch leaderboard: ' + error.message);
            }
        }
    };

    // Toast message helper
    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Set up automatic updates
    useEffect(() => {
        if (isLoggedIn) {
            // Initial save and fetch
            saveScore();

            // Set up interval for automatic updates
            const updateInterval = setInterval(() => {
                saveScore(); // This will also fetch the leaderboard after saving
            }, 3000);

            return () => clearInterval(updateInterval);
        }
    }, [isLoggedIn, score]);

    // Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        if (username.trim()) {
            try {
                // Fetch existing score for user
                const response = await fetch(`${API_URL}/scores/${username}`);
                if (response.ok) {
                    const userData = await response.json();
                    setScore(userData.score);
                    showToastMessage(`Welcome back ${username}! Your current score: ${userData.score}`);
                } else if (response.status === 404) {
                    await fetch(`${API_URL}/scores/${username}/reset`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: 0 })
                    });
                    showToastMessage(`Welcome ${username}! Starting fresh!`);
                }

                setIsLoggedIn(true);
                await fetchLeaderboard();
            } catch (error) {
                console.error('Login error:', error);
                showToastMessage('Error logging in. Please try again.');
            }
        }
    };

    // Click handler
    const handleClick = () => {
        setScore(prevScore => prevScore + 1);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Login Form */}
            {!isLoggedIn && (
                <div className="bg-blue-300 rounded-lg p-4 shadow-md">
                    <h2 className="text-xl font-bold mb-4">Login to Play</h2>
                    <form onSubmit={handleLogin} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="flex-1 px-3 py-2 bg-blue-50 border rounded text-black"
                            required
                            minLength={2}
                            maxLength={20}
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Start Game
                        </button>
                    </form>
                </div>
            )}

            {/* Game Area */}
            {isLoggedIn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-300 rounded-lg p-4 shadow-md">
                        <h2 className="text-xl font-bold mb-4">Click to Score!</h2>
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-4">{score}</div>
                            <button
                                onClick={handleClick}
                                className="w-32 h-32 rounded-full bg-blue-500 text-white text-xl font-bold hover:bg-blue-600 active:bg-blue-700"
                            >
                                Click!
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-300 rounded-lg p-4 shadow-md">
                        <h2 className="text-xl font-bold mb-4">Top 10 Players</h2>
                        <div className="space-y-2">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={entry.id || index}
                                    className={`flex justify-between p-2 ${getPositionStyle(index)} rounded shadow-sm transition-colors duration-200`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="min-w-[24px]">{`${index + 1}.`}</span>
                                        <span>{entry.username === username ?
                                            <strong>{entry.username}</strong> :
                                            entry.username}
                                        </span>
                                    </span>
                                    <span className="font-mono">{entry.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default ClickerGame;