

// smooth scroll
$(document).ready(function(){
    $(".navbar .nav-link").on('click', function(event) {

        if (this.hash !== "") {

            event.preventDefault();

            var hash = this.hash;

            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 700, function(){
                window.location.hash = hash;
            });
        } 
    });
});

// navbar toggle
$('#nav-toggle').click(function(){
    var isExpanded = !$(this).hasClass('is-active');
    $(this).toggleClass('is-active');
    $('#primary-nav').toggleClass('show');
    $(this).attr('aria-expanded', isExpanded);
    $(this).attr('aria-label', isExpanded ? 'Tutup navigasi' : 'Buka navigasi');
});

$('#primary-nav a').on('click', function(){
    $('#nav-toggle').removeClass('is-active').attr('aria-expanded', 'false').attr('aria-label', 'Buka navigasi');
    $('#primary-nav').removeClass('show');
});

var rotatingText = document.getElementById('rotating-text');
var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (rotatingText && !prefersReducedMotion) {
    var rotatingPhrases = ['[ KELOMPOK ]', '[ SOLIDARITAS ]', '[ KOLABORASI ]', '[ INOVASI ]'];
    var rotatingPhraseIndex = 0;

    window.setInterval(function() {
        rotatingPhraseIndex = (rotatingPhraseIndex + 1) % rotatingPhrases.length;
        rotatingText.textContent = rotatingPhrases[rotatingPhraseIndex];
    }, 2500);
}

(function() {
    var tableBody = document.getElementById('student-table-body');
    if (!tableBody) {
        return;
    }

    var searchInput = document.getElementById('student-search');
    var classFilter = document.getElementById('student-filter');
    var tableInfo = document.getElementById('student-table-info');
    var pageIndicator = document.getElementById('student-page-indicator');
    var previousButton = document.getElementById('student-prev');
    var nextButton = document.getElementById('student-next');
    var emptyState = document.getElementById('student-empty-state');
    var detailDialog = document.getElementById('student-detail-dialog');
    var pageSize = 10;
    var currentPage = 1;
    var rows = Array.prototype.slice.call(tableBody.querySelectorAll('tr'));

    function renderStudentRows() {
        var query = searchInput.value.trim().toLocaleLowerCase();
        var selectedClass = classFilter.value;
        var filteredRows = rows.filter(function(row) {
            var cells = row.querySelectorAll('td');
            var name = cells[2].textContent.toLocaleLowerCase();
            var nim = cells[1].textContent.toLocaleLowerCase();
            var sourceClass = cells[3].textContent.trim();
            return (!query || name.indexOf(query) !== -1 || nim.indexOf(query) !== -1) &&
                (!selectedClass || sourceClass === selectedClass);
        });

        var pageCount = Math.ceil(filteredRows.length / pageSize);
        currentPage = Math.min(currentPage, Math.max(pageCount, 1));
        var firstIndex = (currentPage - 1) * pageSize;
        var lastIndex = Math.min(firstIndex + pageSize, filteredRows.length);
        var visibleRows = filteredRows.slice(firstIndex, lastIndex);

        rows.forEach(function(row) {
            row.hidden = visibleRows.indexOf(row) === -1;
        });

        emptyState.hidden = filteredRows.length !== 0;
        tableInfo.textContent = filteredRows.length
            ? 'Menampilkan ' + (firstIndex + 1) + '–' + lastIndex + ' dari ' + filteredRows.length + ' mahasiswa'
            : 'Menampilkan 0 dari 0 mahasiswa';
        pageIndicator.textContent = pageCount ? currentPage + ' / ' + pageCount : '0 / 0';
        previousButton.disabled = currentPage <= 1 || pageCount === 0;
        nextButton.disabled = currentPage >= pageCount || pageCount === 0;
    }

    searchInput.addEventListener('input', function() {
        currentPage = 1;
        renderStudentRows();
    });

    classFilter.addEventListener('change', function() {
        currentPage = 1;
        renderStudentRows();
    });

    previousButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage -= 1;
            renderStudentRows();
        }
    });

    nextButton.addEventListener('click', function() {
        currentPage += 1;
        renderStudentRows();
    });

    tableBody.addEventListener('click', function(event) {
        var button = event.target.closest('.student-detail-button');
        if (!button) {
            return;
        }

        var cells = button.closest('tr').querySelectorAll('td');
        document.getElementById('student-detail-nim').textContent = cells[1].textContent;
        document.getElementById('student-detail-name').textContent = cells[2].textContent;
        document.getElementById('student-detail-class').textContent = cells[3].textContent.trim();
        detailDialog.showModal();
    });

    document.getElementById('student-dialog-close').addEventListener('click', function() {
        detailDialog.close();
    });

    detailDialog.addEventListener('click', function(event) {
        if (event.target === detailDialog) {
            detailDialog.close();
        }
    });

    renderStudentRows();
}());

(function() {
    var themeRoot = document.documentElement;
    var themeWave = document.getElementById('theme-wave');
    var themeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-toggle]'));
    var isTransitioning = false;

    if (!themeButtons.length) {
        return;
    }

    function updateThemeButtons(theme) {
        var isDark = theme === 'dark';
        themeButtons.forEach(function(button) {
            button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            button.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
            button.setAttribute('title', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');

            var label = button.querySelector('span:not(.sr-only)');
            if (label) {
                label.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
            }

            var screenReaderLabel = button.querySelector('.sr-only');
            if (screenReaderLabel) {
                screenReaderLabel.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
            }
        });
    }

    function applyTheme(theme) {
        themeRoot.setAttribute('data-theme', theme);
        updateThemeButtons(theme);
    }

    updateThemeButtons(themeRoot.getAttribute('data-theme') || 'light');

    themeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            if (isTransitioning) {
                return;
            }

            var currentTheme = themeRoot.getAttribute('data-theme') || 'light';
            var targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
            var shouldReduceMotion = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (shouldReduceMotion || !themeWave) {
                applyTheme(targetTheme);
                return;
            }

            isTransitioning = true;
            themeButtons.forEach(function(themeButton) {
                themeButton.disabled = true;
            });

            themeWave.setAttribute('data-target-theme', targetTheme);
            themeWave.classList.remove('is-active');
            void themeWave.offsetWidth;
            themeWave.classList.add('is-active');

            var themeApplied = false;
            var themeChangeTimer = window.setTimeout(function() {
                applyTheme(targetTheme);
                themeApplied = true;
            }, 500);

            function finishTransition(event) {
                if (event.animationName !== 'theme-wave-sweep') {
                    return;
                }

                window.clearTimeout(themeChangeTimer);
                if (!themeApplied) {
                    applyTheme(targetTheme);
                }

                themeWave.classList.remove('is-active');
                themeWave.removeAttribute('data-target-theme');
                themeButtons.forEach(function(themeButton) {
                    themeButton.disabled = false;
                });
                isTransitioning = false;
                themeWave.removeEventListener('animationend', finishTransition);
            }

            themeWave.addEventListener('animationend', finishTransition);
        });
    });
}());