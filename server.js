const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with a database in production)
let scores = [];

// Helper function to find or create user score
const findOrCreateUserScore = (username) => {
    const existingScore = scores.find(s => s.username.toLowerCase() === username.toLowerCase());
    if (!existingScore) {
        const newScore = {
            id: Date.now().toString(),
            username,
            score: 0,
            timestamp: new Date().toISOString()
        };
        scores.push(newScore);
        return newScore;
    }
    return existingScore;
};

// API Routes
app.post('/api/scores', (req, res) => {
    try {
        const { username, score, timestamp } = req.body;

        if (!username || typeof score !== 'number') {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Username and score are required'
            });
        }

        // Find existing score or create new one
        const existingScore = scores.find(
            s => s.username.toLowerCase() === username.toLowerCase()
        );

        if (existingScore) {
            // Update existing score if new score is higher
            if (score > existingScore.score) {
                existingScore.score = score;
                existingScore.timestamp = timestamp || new Date().toISOString();
            }
        } else {
            // Create new score entry
            scores.push({
                id: Date.now().toString(),
                username,
                score,
                timestamp: timestamp || new Date().toISOString()
            });
        }

        // Sort scores to calculate rank
        scores.sort((a, b) => b.score - a.score);
        const rank = scores.findIndex(s =>
            s.username.toLowerCase() === username.toLowerCase()
        ) + 1;

        res.json({
            success: true,
            rank,
            message: `Score ${existingScore ? 'updated' : 'saved'} successfully`
        });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to save score'
        });
    }
});

app.get('/api/leaderboard', (req, res) => {
    try {
        // Sort scores by score (descending) and timestamp (ascending) for ties
        const sortedScores = [...scores].sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        // Return top 10 scores
        res.json(sortedScores.slice(0, 10));
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch leaderboard'
        });
    }
});

// Get user's current score
app.get('/api/scores/:username', (req, res) => {
    try {
        const { username } = req.params;
        const userScore = scores.find(
            s => s.username.toLowerCase() === username.toLowerCase()
        );

        if (!userScore) {
            return res.status(404).json({
                error: 'Not found',
                message: 'User not found'
            });
        }

        // Calculate user's rank
        const rank = scores.filter(s => s.score > userScore.score).length + 1;

        res.json({
            ...userScore,
            rank
        });
    } catch (error) {
        console.error('Error fetching user score:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch user score'
        });
    }
});

// Reset or update user's score
app.put('/api/scores/:username/reset', (req, res) => {
    try {
        const { username } = req.params;
        const { score = 0 } = req.body;

        const userScore = findOrCreateUserScore(username);
        userScore.score = score;
        userScore.timestamp = new Date().toISOString();

        res.json({
            success: true,
            score: userScore
        });
    } catch (error) {
        console.error('Error resetting score:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to reset score'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Server error',
        message: 'Something went wrong!'
    });
});