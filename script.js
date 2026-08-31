/* =================================================
   ENTER HER WORLD
================================================= */

/* =================================================
   PAGE TRANSITIONS (ABSTRACTION)
================================================= */

document.querySelectorAll("a[href]").forEach((link) => {

    const href =
        link.getAttribute("href");

    const isInternal =
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http") &&
        !href.startsWith("mailto:") &&
        link.target !== "_blank";


    if (!isInternal) return;


    link.addEventListener("click", (event) => {

        event.preventDefault();

        document.body.classList.add("page-leaving");

        setTimeout(() => {

            window.location.href = href;

        }, 480);

    });

});



/* =================================================
   GLOBAL MUSIC BUTTON
================================================= */
const musicButton = document.getElementById("musicButton");
let globalAudio = document.getElementById("audioPlayer");

if (!globalAudio) {
    globalAudio = document.createElement("audio");
    globalAudio.id = "audioPlayer";
    globalAudio.preload = "auto";
    globalAudio.loop = true;
    document.body.appendChild(globalAudio);
}

// Put your preferred song in the site folder as music.mp3.
const MUSIC_FILE = "music.mp3";
const MUSIC_STATE_KEY = "malakMusicPlaying";

function syncMusicButton() {
    if (!musicButton) return;

    const playing = !globalAudio.paused;

    musicButton.innerHTML = playing ? "❚❚" : "♫";
    musicButton.classList.toggle("playing", playing);
    musicButton.setAttribute("aria-pressed", String(playing));
    musicButton.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    musicButton.title = playing ? "Pause music" : "Play music";
}

async function playSiteMusic() {
    if (!globalAudio.src) {
        globalAudio.src = MUSIC_FILE;
    }

    try {
        await globalAudio.play();
        localStorage.setItem(MUSIC_STATE_KEY, "on");
        syncMusicButton();
    } catch (err) {
        // Browsers can block autoplay after navigating to another page.
        // The next click on the music button will start it normally.
        syncMusicButton();
        console.warn("Music could not autoplay:", err);
    }
}

if (musicButton) {
    musicButton.addEventListener("click", async () => {
        if (!globalAudio.src) {
            globalAudio.src = MUSIC_FILE;
        }

        try {
            if (globalAudio.paused) {
                await globalAudio.play();
                localStorage.setItem(MUSIC_STATE_KEY, "on");
            } else {
                globalAudio.pause();
                localStorage.setItem(MUSIC_STATE_KEY, "off");
            }
        } catch (err) {
            musicButton.title = "Add music.mp3 to the site folder";
            musicButton.setAttribute("aria-label", "Add music.mp3 to play music");
            console.warn("Music file is missing or could not be played:", err);
        }

        syncMusicButton();
    });

    globalAudio.addEventListener("play", syncMusicButton);

    globalAudio.addEventListener("pause", () => {
        syncMusicButton();
    });

    globalAudio.addEventListener("ended", syncMusicButton);

    syncMusicButton();

    // Keep the user's ON/OFF choice when moving between pages.
    if (localStorage.getItem(MUSIC_STATE_KEY) === "on") {
        playSiteMusic();
    }
}

/* =================================================
   BACKGROUND CINEMATIC ZOOM
================================================= */

const ocean =
    document.querySelector(".ocean-background");


if (ocean) {

    const startTime = performance.now();

    const entranceDuration = 3200; // ms - مدة الزووم إن الأولاني

    const entranceFrom = 1.18; // يبدأ مزوم لبره كده
    const entranceTo = 1.03;   // ويستقر هنا


    function easeOutExpo(x) {

        return x === 1
            ? 1
            : 1 - Math.pow(2, -10 * x);

    }


    function animateOcean(now) {

        const elapsed =
            now - startTime;


        let entranceScale;

        if (elapsed < entranceDuration) {

            const progress =
                easeOutExpo(elapsed / entranceDuration);

            entranceScale =
                entranceFrom +
                (entranceTo - entranceFrom) * progress;

        } else {

            entranceScale = entranceTo;

        }


        // تنفس هادي مستمر بعد ما الدخول يخلص

        const breathe =
            elapsed < entranceDuration
                ? 0
                : Math.sin(now / 1000 * 0.15) * 0.015;


        // زوم إضافي بيزيد شوية كل ما تنزل بالسكرول (حس عمق)

        const scrollZoom =
            Math.min(window.scrollY / 2200, 0.09);


        const scale =
            entranceScale + breathe + scrollZoom;


        ocean.style.transform =
            `scale(${scale})`;


        requestAnimationFrame(animateOcean);

    }


    requestAnimationFrame(animateOcean);

}

/* =================================================
   MOUSE PARALLAX
================================================= */

document.addEventListener(
    "mousemove",
    (event) => {

        const x =
            event.clientX /
            window.innerWidth -
            0.5;


        const y =
            event.clientY /
            window.innerHeight -
            0.5;


        const moon =
            document.querySelector(".moon");


        const glow =
            document.querySelector(".moon-glow");


        const rose =
            document.querySelector(".blue-rose");


        const heart =
            document.querySelector(".heart-orb");


        if (moon) {

            moon.style.marginLeft =
                `${x * 20}px`;

            moon.style.marginTop =
                `${y * 15}px`;

        }


        if (glow) {

            glow.style.transform =
                `translate(${x * 20}px, ${y * 15}px)`;

        }


        if (rose) {

            rose.style.marginLeft =
                `${x * 12}px`;

        }


        if (heart) {

            heart.style.marginLeft =
                `${x * -15}px`;

        }

    }
);



/* =================================================
   3D LOVE CARDS
================================================= */

const cards =
    document.querySelectorAll(".love-card");


cards.forEach(
    (card) => {

        card.addEventListener(
            "mousemove",
            (event) => {

                const rect =
                    card.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                const rotateY =
                    ((x - rect.width / 2) /
                    rect.width) * 12;


                const rotateX =
                    ((y - rect.height / 2) /
                    rect.height) * -12;


                card.style.transform =
                    `
                    perspective(700px)

                    rotateX(${rotateX}deg)

                    rotateY(${rotateY}deg)

                    translateY(-9px)
                    `;

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform =
                    "translateY(0)";

            }
        );

    }
);



/* =================================================
   ACTIVE NAVBAR
   (كل صفحة بتحدد الرابط active بتاعها في الـ HTML نفسه
    مباشرة، مش محتاجين نحسبها بالسكرول بعد ما بقينا
    multi-page)
================================================= */



/* =================================================
   RANDOM BUBBLES
================================================= */

function createBubble() {

    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "bubble";


    const size =
        Math.random() * 30 + 7;


    bubble.style.width =
        `${size}px`;


    bubble.style.height =
        `${size}px`;


    bubble.style.left =
        `${Math.random() * 100}%`;


    bubble.style.animationDuration =
        `${Math.random() * 8 + 5}s`;


    document
        .querySelector(
            ".ocean-background"
        )
        .appendChild(
            bubble
        );


    setTimeout(
        () => {

            bubble.remove();

        },
        14000
    );

}


setInterval(
    createBubble,
    900
);



/* =================================================
   CLICK SPARKLES
================================================= */

document.addEventListener(
    "click",
    (event) => {

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const sparkle =
                document.createElement(
                    "div"
                );


            sparkle.innerHTML =
                "✦";


            sparkle.style.position =
                "fixed";


            sparkle.style.left =
                `${event.clientX + (Math.random() * 30 - 15)}px`;


            sparkle.style.top =
                `${event.clientY + (Math.random() * 30 - 15)}px`;


            sparkle.style.color =
                "#8eeeff";


            sparkle.style.fontSize =
                `${Math.random() * 12 + 8}px`;


            sparkle.style.pointerEvents =
                "none";


            sparkle.style.zIndex =
                "999";


            sparkle.style.textShadow =
                "0 0 12px #38dfff";


            document.body.appendChild(
                sparkle
            );


            sparkle.animate(
                [
                    {
                        opacity: 1,
                        transform:
                            "translate(0,0) scale(1)"
                    },

                    {
                        opacity: 0,
                        transform:
                            `translate(
                                ${(Math.random() - .5) * 80}px,
                                -60px
                            )
                            scale(0)`
                    }
                ],
                {
                    duration: 900,
                    easing: "ease-out"
                }
            );


            setTimeout(
                () => {
                    sparkle.remove();
                },
                900
            );

        }

    }
);

/* =================================================
   MOBILE MENU
================================================= */

const menuButton =
    document.getElementById("menuButton");

const mobileNav =
    document.getElementById("mobileNav");


if (menuButton && mobileNav) {

    menuButton.addEventListener("click", () => {

        menuButton.classList.toggle("open");
        mobileNav.classList.toggle("open");

    });


    mobileNav.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            menuButton.classList.remove("open");
            mobileNav.classList.remove("open");

        });

    });

}



/* =================================================
   SCROLL REVEAL (single IntersectionObserver)
================================================= */

const revealItems =
    document.querySelectorAll(".reveal");


const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);

            }

        });

    },
    { threshold: 0.2 }
);


revealItems.forEach((item) => revealObserver.observe(item));



/* =================================================
   GALLERY FILTERS
================================================= */

const filterButtons =
    document.querySelectorAll(".filter-btn");

const galleryCards =
    document.querySelectorAll(".gallery-item");


filterButtons.forEach((btn) => {

    btn.addEventListener("click", () => {

        filterButtons.forEach((b) =>
            b.classList.remove("active")
        );

        btn.classList.add("active");


        const filter =
            btn.getAttribute("data-filter");


        galleryCards.forEach((card) => {

            const category =
                card.getAttribute("data-category");


            card.classList.toggle(
                "hidden",
                category !== filter
            );

        });

    });

});



/* =================================================
   GALLERY LIGHTBOX
================================================= */

const galleryItems =
    document.querySelectorAll(".gallery-item img");

const lightbox =
    document.getElementById("lightbox");

const lightboxImg =
    document.getElementById("lightboxImg");

const lightboxClose =
    document.getElementById("lightboxClose");


galleryItems.forEach((img) => {

    img.addEventListener("click", () => {

        lightboxImg.src = img.src;
        lightbox.classList.add("open");

    });

});


if (lightboxClose) {

    lightboxClose.addEventListener("click", () => {

        lightbox.classList.remove("open");

    });

    lightbox.addEventListener("click", (e) => {

        if (e.target === lightbox) {

            lightbox.classList.remove("open");

        }

    });

}



/* =================================================
   MUSIC PLAYLIST
================================================= */

const audioPlayer =
    document.getElementById("audioPlayer");

const tracks =
    document.querySelectorAll(".track");


tracks.forEach((track) => {

    track.addEventListener("click", () => {

        const src =
            track.getAttribute("data-src");


        const isPlaying =
            track.classList.contains("playing");


        tracks.forEach((t) => {

            t.classList.remove("playing");
            t.querySelector(".track-play").innerHTML = "▶";

        });


        if (isPlaying) {

            audioPlayer.pause();
            return;

        }


        audioPlayer.src = src;

        audioPlayer.play().catch(() => {

            // ملف الصوت مش موجود لسه - حط اسم mp3 حقيقي في data-src بتاع الـ track

        });


        track.classList.add("playing");
        track.querySelector(".track-play").innerHTML = "❚❚";

    });

});



/* =================================================
   SURPRISE CARD FLIP
================================================= */

const surpriseCard =
    document.getElementById("surpriseCard");


if (surpriseCard) {

    surpriseCard.addEventListener("click", () => {

        surpriseCard.classList.toggle("flipped");

    });

}



/* =================================================
   LETTER TYPING EFFECT
================================================= */

const letterText =
    document.getElementById("letterText");


if (letterText) {

    const fullText =
        letterText.getAttribute("data-text");


    let typed = false;


    const letterObserver = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting && !typed) {

                    typed = true;

                    let i = 0;

                    const typing = setInterval(() => {

                        letterText.textContent =
                            fullText.slice(0, i);

                        i++;


                        if (i > fullText.length) {

                            clearInterval(typing);
                            letterText.classList.add("done");

                        }

                    }, 28);

                }

            });

        },
        { threshold: 0.4 }
    );


    letterObserver.observe(letterText);

}


/* =================================================
   OCEAN MEDIA SWITCH + PHOTO/VIDEO NAVIGATION
================================================= */

const oceanSwitchButtons = document.querySelectorAll('[data-ocean-target]');
const oceanPanels = document.querySelectorAll('.ocean-media-panel');

function showOceanPanel(targetId, shouldScroll = true) {
    if (!oceanPanels.length) return;

    oceanSwitchButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.oceanTarget === targetId);
    });

    oceanPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === targetId);
    });

    const activePanel = document.getElementById(targetId);
    if (shouldScroll && activePanel) {
        window.requestAnimationFrame(() => {
            activePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

oceanSwitchButtons.forEach((button) => {
    button.addEventListener('click', () => showOceanPanel(button.dataset.oceanTarget));
});

if (oceanPanels.length) showOceanPanel('oceanPhotos', false);


/* ---------- PHOTO NAVIGATION ---------- */

const photoSlides = [...document.querySelectorAll('.ocean-photo-slide')];
const photoDots = [...document.querySelectorAll('#oceanPhotoDots button')];
const photoCaption = document.getElementById('oceanPhotoCaption');
const photoCounter = document.getElementById('oceanPhotoCounter');

const photoCaptions = [
    ['Moonlight over the ocean', 'A quiet blue moment under the moon ♡'],
    ['Golden hour by the sea', 'Where the sky meets the water.'],
    ['A little heart by the sea', 'Some memories belong exactly here ♡']
];

let currentPhoto = 2;

function renderPhoto(index) {
    if (!photoSlides.length) return;

    currentPhoto = (index + photoSlides.length) % photoSlides.length;

    photoSlides.forEach((slide, i) => {
        slide.classList.remove('is-current', 'is-prev', 'is-next');
        if (i === currentPhoto) slide.classList.add('is-current');
        else if (i === (currentPhoto - 1 + photoSlides.length) % photoSlides.length) slide.classList.add('is-prev');
        else if (i === (currentPhoto + 1) % photoSlides.length) slide.classList.add('is-next');
    });

    photoDots.forEach((dot, i) => dot.classList.toggle('active', i === currentPhoto));

    if (photoCounter) photoCounter.textContent = `${currentPhoto + 1} / ${photoSlides.length}`;

    if (photoCaption) {
        const [title, text] = photoCaptions[currentPhoto] || ['Ocean memory', 'A little piece of the sea ♡'];
        photoCaption.innerHTML = `<strong>${title}</strong><small>${text}</small>`;
    }
}

document.getElementById('oceanPhotoPrev')?.addEventListener('click', () => renderPhoto(currentPhoto - 1));
document.getElementById('oceanPhotoNext')?.addEventListener('click', () => renderPhoto(currentPhoto + 1));

photoDots.forEach((dot) => {
    dot.addEventListener('click', () => renderPhoto(Number(dot.dataset.index)));
});


/* ---------- VIDEO NAVIGATION ---------- */

const videoSlides = [...document.querySelectorAll('.ocean-video-slide')];
const videoDots = [...document.querySelectorAll('#oceanVideoDots button')];
const videoCounter = document.getElementById('oceanVideoCounter');

let currentVideo = 0;

function renderVideo(index) {
    if (!videoSlides.length) return;

    currentVideo = (index + videoSlides.length) % videoSlides.length;

    videoSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentVideo);

        const video = slide.querySelector('video');
        if (i !== currentVideo && video) video.pause();
    });

    videoDots.forEach((dot, i) => dot.classList.toggle('active', i === currentVideo));

    if (videoCounter) videoCounter.textContent = `${currentVideo + 1} / ${videoSlides.length}`;
}

document.getElementById('oceanVideoPrev')?.addEventListener('click', () => renderVideo(currentVideo - 1));
document.getElementById('oceanVideoNext')?.addEventListener('click', () => renderVideo(currentVideo + 1));

videoDots.forEach((dot) => {
    dot.addEventListener('click', () => renderVideo(Number(dot.dataset.index)));
});

renderPhoto(currentPhoto);
renderVideo(0);


/* ---------- FULLSCREEN PHOTO VIEWER ---------- */

const oceanLightbox = document.getElementById('oceanLightbox');
const oceanLightboxImage = document.getElementById('oceanLightboxImage');
const oceanLightboxClose = document.getElementById('oceanLightboxClose');

function closeOceanLightbox() {
    if (!oceanLightbox) return;
    oceanLightbox.classList.remove('open');
    oceanLightbox.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.ocean-photo-lightbox, .ocean-photo-slide').forEach((photo) => {
    photo.addEventListener('click', (event) => {
        // Don't open lightbox when clicking the navigation arrows.
        if (event.target.closest('.ocean-media-arrow')) return;

        if (!oceanLightbox || !oceanLightboxImage) return;
        oceanLightboxImage.src = photo.dataset.image;
        oceanLightbox.classList.add('open');
        oceanLightbox.setAttribute('aria-hidden', 'false');
    });
});

oceanLightboxClose?.addEventListener('click', closeOceanLightbox);

oceanLightbox?.addEventListener('click', (event) => {
    if (event.target === oceanLightbox) closeOceanLightbox();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeOceanLightbox();

    if (document.querySelector('.ocean-media-panel.active')?.id === 'oceanPhotos') {
        if (event.key === 'ArrowLeft') renderPhoto(currentPhoto - 1);
        if (event.key === 'ArrowRight') renderPhoto(currentPhoto + 1);
    } else if (document.querySelector('.ocean-media-panel.active')?.id === 'oceanVideos') {
        if (event.key === 'ArrowLeft') renderVideo(currentVideo - 1);
        if (event.key === 'ArrowRight') renderVideo(currentVideo + 1);
    }
});
