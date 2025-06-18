const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises; 
const bodyParser = require('body-parser');

const app = express();
const port = 3000;


app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const dbPath = path.join(__dirname, 'product.db');
let db;


db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('SQLite 데이터베이스 연결 오류:', err.message);
        
        process.exit(1);
    } else {
        console.log('SQLite 데이터베이스에 성공적으로 연결되었습니다.');
        
        startServer();
    }
});


function startServer() {
     app.listen(port, () => {
         console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
     });
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/movies/:movieId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'movie.html'));
    
});


app.get('/api/movies', (req, res) => {
    const searchTerm = req.query.search || ''; 
    const sortOption = req.query.sort || 'rating_desc'; 
    const limit = parseInt(req.query.limit) || 8; 
    const offset = parseInt(req.query.offset) || 0; 

    
    let orderBy = 'movie_rate DESC'; 
    switch (sortOption) {
        case 'rating_asc': orderBy = 'movie_rate ASC'; break;
        case 'date_desc': orderBy = 'movie_release_date DESC'; break;
        case 'date_asc': orderBy = 'movie_release_date ASC'; break;
        
    }

    
    const sql = `
        SELECT movie_id, movie_image, movie_title, movie_overview, movie_release_date, movie_rate FROM movies
        WHERE movie_title LIKE ? OR movie_overview LIKE ?
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?;
    `;
    
    const params = [`%${searchTerm}%`, `%${searchTerm}%`, limit, offset];

    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('영화 목록 조회 API 오류:', err.message); 
            res.status(500).json({ error: '영화를 불러오는 중 서버 오류가 발생했습니다.' }); 
            return;
        }
        
        res.json(rows);
    });
});

app.get('/api/movies/:movieId', (req, res) => {
    const movieId = req.params.movieId; 

    
    const sql = `SELECT movie_id, movie_image, movie_title, movie_overview, movie_release_date, movie_rate FROM movies WHERE movie_id = ?;`;

    
    db.get(sql, [movieId], (err, row) => {
        if (err) {
            console.error(`영화 상세 정보 조회 API 오류 (ID: ${movieId}):`, err.message); 
            res.status(500).json({ error: '영화 상세 정보를 불러오는 중 서버 오류가 발생했습니다.' });
            return;
        }
        if (!row) {
            
            res.status(404).json({ message: '요청한 영화를 찾을 수 없습니다.' });
            return;
        }
        
        res.json(row);
    });
});

const commentsFilePath = path.join(__dirname, 'comment.json');

app.get('/api/movies/:movieId/comments', async (req, res) => {
    const movieId = req.params.movieId; 

    try {
        
        const data = await fs.readFile(commentsFilePath, 'utf8');
        const comments = JSON.parse(data); 
        
        res.json(comments[movieId] || []);
    } catch (err) {
        console.error(`댓글 읽기 오류 (ID: ${movieId}):`, err.message); 
        
        if (err.code === 'ENOENT') {
             res.json([]);
        } else {
            
            res.status(500).json({ error: '댓글을 불러오는 중 오류가 발생했습니다.' });
        }
    }
});

app.post('/api/movies/:movieId/comments', async (req, res) => {
    const movieId = req.params.movieId; 
    const newComment = req.body.comment; 

    
    if (!newComment || typeof newComment !== 'string' || newComment.trim() === '') {
        return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }

    try {
        let comments = {};
        try {
            
            const data = await fs.readFile(commentsFilePath, 'utf8');
            comments = JSON.parse(data);
        } catch (err) {
            
            if (err.code !== 'ENOENT') {
                 throw err;
            }
            
        }

        
        if (!comments[movieId]) {
            comments[movieId] = []; 
        }
        comments[movieId].push(newComment.trim()); 

        
        
        await fs.writeFile(commentsFilePath, JSON.stringify(comments, null, 2), 'utf8');

        
        res.status(201).json({ message: '댓글이 성공적으로 등록되었습니다.' });

    } catch (err) {
        console.error(`댓글 쓰기 오류 (ID: ${movieId}):`, err.message); 
        res.status(500).json({ error: '댓글 등록 중 서버 오류가 발생했습니다.' });
    }
});


process.on('SIGINT', () => {
    console.log('서버 종료 신호 수신, 데이터베이스 연결을 닫습니다.');
    if (db) { 
        db.close((err) => {
            if (err) {
                console.error('SQLite 데이터베이스 연결 닫기 오류:', err.message);
                process.exit(1); 
            }
            console.log('SQLite 데이터베이스 연결을 닫았습니다.');
            process.exit(0); 
        });
    } else {
         process.exit(0); 
    }
});