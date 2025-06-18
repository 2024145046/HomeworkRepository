document.addEventListener('DOMContentLoaded', async () => {
    const pathSegments = window.location.pathname.split('/');
    const movieId = pathSegments[pathSegments.length - 1];

    if (!movieId || isNaN(movieId)) {
        console.error('유효하지 않은 영화 ID입니다.');
        document.querySelector('.movie-detail-container').innerHTML = '<p>영화 정보를 불러올 수 없습니다. 잘못된 접근입니다.</p>';
        return;
    }

    const movieTitleTag = document.getElementById('movieTitleTag');
    const movieTitle = document.getElementById('movieTitle');
    const moviePoster = document.getElementById('moviePoster');
    const movieIdDisplay = document.getElementById('movieIdDisplay'); 
    const movieReleaseDate = document.getElementById('movieReleaseDate');
    const movieRating = document.getElementById('movieRating');
    const movieOverview = document.getElementById('movieOverview');
    const commentsList = document.getElementById('commentsList');
    const newCommentInput = document.getElementById('newCommentInput');
    const submitCommentButton = document.getElementById('submitCommentButton');


    async function fetchMovieDetails() {
        try {
            const response = await fetch(`/api/movies/${movieId}`);

            if (!response.ok) {
                 const errorBody = await response.text();
                throw new Error(`HTTP 오류! 상태: ${response.status} (${response.statusText}) - ${errorBody}`);
            }

            const movie = await response.json(); 

            if (movieIdDisplay) { 
                movieIdDisplay.textContent = movie.movie_id; 
            }

            movieTitleTag.textContent = `${movie.movie_title} - 인프밍 영화 정보`;
            movieTitle.textContent = movie.movie_title;
            moviePoster.src = movie.movie_image;
            moviePoster.alt = movie.movie_title;
            movieReleaseDate.textContent = movie.movie_release_date; 
            movieRating.textContent = movie.movie_rate;
            movieOverview.textContent = movie.movie_overview;

        } catch (error) {
            console.error('영화 상세 정보를 불러오는 중 오류 발생:', error);
            document.querySelector('.movie-detail-content').innerHTML = '<p>영화 상세 정보를 불러올 수 없습니다.</p>';
        }
    }

    async function fetchComments() {
        try {
            const response = await fetch(`/api/movies/${movieId}/comments`);
            if (!response.ok) {
                 if (response.status === 404) {
                     console.warn(`댓글 파일 또는 해당 영화의 댓글이 없습니다 (ID: ${movieId}).`);
                     return [];
                 }
                const errorBody = await response.text();
                throw new Error(`HTTP 오류! 상태: ${response.status} (${response.statusText}) - ${errorBody}`);
            }
            const comments = await response.json();
            return comments;

        } catch (error) {
            console.error(`댓글을 불러오는 중 오류 발생 (ID: ${movieId}):`, error);
             commentsList.innerHTML = '<li>댓글을 불러오는 중 오류가 발생했습니다.</li>';
            return [];
        }
    }

    function displayComments(comments) {
        commentsList.innerHTML = '';

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<li>아직 작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!</li>';
            return;
        }

        comments.forEach(commentText => {
            const li = document.createElement('li');
            li.textContent = commentText;
            commentsList.appendChild(li);
        });
    }

    async function submitComment() {
        const commentText = newCommentInput.value.trim();

        if (!commentText) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(`/api/movies/${movieId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: commentText })
            });

            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(`댓글 등록 실패: ${response.status} - ${errorData.error || response.statusText}`);
            }

            newCommentInput.value = '';
            alert('댓글이 성공적으로 등록되었습니다.');

            window.location.reload();

        } catch (error) {
            console.error('댓글 등록 중 오류 발생:', error);
            alert('댓글 등록에 실패했습니다: ' + error.message);
        }
    }

    submitCommentButton.addEventListener('click', submitComment);

    newCommentInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
             event.preventDefault();
             submitComment();
        }
    });


    await fetchMovieDetails(); 
    const initialComments = await fetchComments(); 
    displayComments(initialComments); 

});