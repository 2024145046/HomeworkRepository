document.addEventListener('DOMContentLoaded', () => {
    const movieGrid = document.getElementById('movie-grid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const sortRadios = document.querySelectorAll('input[name="sort"]');

    let displayedMoviesCount = 0; 
    const moviesPerLoad = 8;
    let isLoading = false; 
    let currentSearchTerm = ''; 
    let currentSortOption = 'rating_desc'; 

    async function fetchMovies(searchTerm, sortOption, offset, limit) {
        const url = `/api/movies?search=${encodeURIComponent(searchTerm)}&sort=${encodeURIComponent(sortOption)}&offset=${offset}&limit=${limit}`;

        isLoading = true; 

        try {
            const response = await fetch(url);


            if (!response.ok) {

                const errorBody = await response.text(); 
                throw new Error(`HTTP 오류! 상태: ${response.status} (${response.statusText}) - ${errorBody}`);
            }

            return await response.json();

        } catch (error) {
            console.error("영화를 불러오는 중 오류 발생:", error);
            if (offset === 0) {
                movieGrid.innerHTML = `<p>영화를 불러올 수 없습니다. 오류: ${error.message}.<br>나중에 다시 시도해주세요.</p>`;
            } else {
                 console.error("무한 스크롤 중 영화 로딩 오류:", error);
            }
            return [];
        } finally {
            isLoading = false; 
        }
    }

    function createMovieCard(movie) {
        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.dataset.movieId = movie.movie_id; 
        card.addEventListener('click', () => {
             window.location.href = `/movies/${movie.movie_id}`;
        });

        const poster = document.createElement('img');
        poster.src = movie.movie_image;
        poster.alt = movie.movie_title;

        const movieInfoDiv = document.createElement('div');
        movieInfoDiv.classList.add('movie-info');

        const title = document.createElement('h3');
        title.textContent = movie.movie_title; 

        const releaseDate = document.createElement('p');
        releaseDate.textContent = `개봉일: ${movie.movie_release_date}`; 

        const rating = document.createElement('p');
        rating.textContent = `평점: ${movie.movie_rate} / 10`; 

        movieInfoDiv.appendChild(title);
        movieInfoDiv.appendChild(releaseDate);
        movieInfoDiv.appendChild(rating);

        const plotOverlay = document.createElement('div');
        plotOverlay.classList.add('movie-plot-overlay');
        plotOverlay.innerHTML = `<strong>줄거리:</strong> <br> ${movie.movie_overview}`; 

        card.appendChild(poster);
        card.appendChild(movieInfoDiv);
        card.appendChild(plotOverlay);

        return card;
    }

    function appendMovies(movies) {
        if (movies.length === 0 && displayedMoviesCount === 0) {
             movieGrid.innerHTML = '<p>조건에 맞는 영화를 찾을 수 없습니다.</p>';
             return; 
        }
        if (movieGrid.querySelector('p') && movieGrid.querySelector('p').textContent === '조건에 맞는 영화를 찾을 수 없습니다.') {
             movieGrid.innerHTML = '';
        }


        movies.forEach(movie => {
            const movieCard = createMovieCard(movie);
            movieGrid.appendChild(movieCard);
        });
    }

    async function loadInitialMovies() {
         movieGrid.innerHTML = '<p>영화 정보를 불러오는 중...</p>';
        displayedMoviesCount = 0;

        const movies = await fetchMovies(currentSearchTerm, currentSortOption, 0, moviesPerLoad);

        movieGrid.innerHTML = '';
        appendMovies(movies);

        displayedMoviesCount = movies.length;
    }

    async function loadMoreMovies() {
        if (isLoading) return; 

        isLoading = true; 

        const nextMovies = await fetchMovies(currentSearchTerm, currentSortOption, displayedMoviesCount, moviesPerLoad);

        if (nextMovies.length > 0) {
            appendMovies(nextMovies);
            displayedMoviesCount += nextMovies.length;
        }
    }

    function applyFilterAndSort() {
        currentSearchTerm = searchInput.value.toLowerCase().trim();
        const selectedSortRadio = document.querySelector('input[name="sort"]:checked');
        currentSortOption = selectedSortRadio ? selectedSortRadio.value : 'rating_desc'; 

        loadInitialMovies();
    }


    searchButton.addEventListener('click', applyFilterAndSort);

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            applyFilterAndSort();
        }
    });

    sortRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedSortRadio = document.querySelector('input[name="sort"]:checked');
            currentSortOption = selectedSortRadio ? selectedSortRadio.value : 'rating_desc';
            loadInitialMovies(); 
        });
    });

    window.addEventListener('scroll', () => {
        const scrollThreshold = 200; 
        const isNearBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - scrollThreshold;

        const approxLastLoadedCount = displayedMoviesCount % moviesPerLoad === 0 ? moviesPerLoad : displayedMoviesCount % moviesPerLoad;

        if (isNearBottom && !isLoading && displayedMoviesCount > 0 && approxLastLoadedCount === moviesPerLoad) {
             loadMoreMovies();
        }
    });


    loadInitialMovies();
});