

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