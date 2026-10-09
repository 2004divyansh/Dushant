/* =====================================================
   BITMINERS JAVASCRIPT
   (shared by index.html and coming-soon.html)
   Every block checks that its elements exist, so the
   same file runs safely on both pages.
===================================================== */


/* =====================================================
   COPY CONTRACT
===================================================== */

const copyButton = document.getElementById("copyContractButton");

if (copyButton) {

    copyButton.addEventListener("click", async () => {

        const address = document
            .getElementById("contractAddress")
            .innerText
            .trim();

        try {

            await navigator.clipboard.writeText(address);

            const original = copyButton.innerHTML;

            copyButton.innerHTML = "✓ COPIED";
            copyButton.style.color = "#00c805";
            copyButton.style.borderColor = "#00c805";

            setTimeout(() => {
                copyButton.innerHTML = original;
                copyButton.style.color = "";
                copyButton.style.borderColor = "";
            }, 1800);

        } catch (error) {

            console.log("Could not copy address.");

        }

    });

}


/* =====================================================
   PDF WHITEPAPER READER
   Only runs when the page has the PDF canvas
   (index.html). Skipped on coming-soon.html.
===================================================== */

/*
    YOUR FILE MUST BE:

    whitepaper/whitepaper.pdf
*/

const canvas = document.getElementById("pdfCanvas");

if (canvas && typeof pdfjsLib !== "undefined") {

    const pdfFile = "whitepaper/whitepaper.pdf";

    let pdfDocument = null;
    let currentPage = 1;
    let rendering = false;
    let pendingPage = null;

    const canvasContext = canvas.getContext("2d");
    const currentPageElement = document.getElementById("currentPage");
    const totalPagesElement = document.getElementById("totalPages");
    const previousButton = document.getElementById("previousPage");
    const nextButton = document.getElementById("nextPage");
    const loadingElement = document.getElementById("pdfLoading");
    const zoomInButton = document.getElementById("zoomIn");
    const zoomOutButton = document.getElementById("zoomOut");
    const zoomLabel = document.getElementById("zoomLevel");

    /* Phones start zoomed in so the text is readable */
    const isMobile = window.innerWidth <= 800;
    let zoomLevel = isMobile ? 2.2 : 1;
    const MIN_ZOOM = isMobile ? 1 : 0.6;
    const MAX_ZOOM = 4;

    function changeZoom(delta) {

        const next = Math.round((zoomLevel + delta) * 10) / 10;
        zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
        queueRenderPage(currentPage);

    }

    if (zoomInButton) zoomInButton.addEventListener("click", () => changeZoom(0.4));
    if (zoomOutButton) zoomOutButton.addEventListener("click", () => changeZoom(-0.4));

    /* Re-render when the phone is rotated / window resized */
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (pdfDocument) queueRenderPage(currentPage);
        }, 250);
    });

    /* PDF.js worker */

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


    /* Load PDF */

    pdfjsLib
        .getDocument(pdfFile)
        .promise
        .then(pdf => {

            pdfDocument = pdf;
            totalPagesElement.innerText = pdf.numPages;
            renderPage(currentPage);

        })
        .catch(error => {

            console.error("Whitepaper could not be loaded:", error);

            loadingElement.innerHTML = `
                WHITEPAPER NOT FOUND
                <br><br>
                <small>
                Put your PDF here:
                <br>
                whitepaper/whitepaper.pdf
                </small>
            `;

        });


    /* Render page */

    function renderPage(pageNumber) {

        rendering = true;

        pdfDocument.getPage(pageNumber).then(page => {

            const pageContainer = document.querySelector(".whitepaper-page");
            const padding = window.innerWidth <= 800 ? 20 : 60;
            const availableWidth = pageContainer.clientWidth - padding;
            const baseViewport = page.getViewport({ scale: 1 });

            /* Fit-to-width scale, multiplied by the zoom level.
               On phones the fit-to-width scale makes text tiny,
               so zoom starts higher and the page scrolls sideways. */
            const fitScale = availableWidth / baseViewport.width;
            const maxFit = window.innerWidth <= 800 ? fitScale : Math.min(fitScale, 1.5);
            const cssScale = maxFit * zoomLevel;

            /* Render at the device pixel ratio so text stays sharp */
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            const viewport = page.getViewport({ scale: cssScale * dpr });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = (viewport.width / dpr) + "px";
            canvas.style.height = (viewport.height / dpr) + "px";

            if (zoomLabel) {
                zoomLabel.innerText = Math.round(zoomLevel * 100) + "%";
            }

            page
                .render({ canvasContext: canvasContext, viewport: viewport })
                .promise
                .then(() => {

                    loadingElement.style.display = "none";
                    canvas.style.display = "block";
                    currentPageElement.innerText = pageNumber;

                    rendering = false;

                    if (pendingPage !== null) {
                        const next = pendingPage;
                        pendingPage = null;
                        renderPage(next);
                    }

                    updateButtons();

                });

        });

    }


    function queueRenderPage(pageNumber) {

        if (rendering) {
            pendingPage = pageNumber;
        } else {
            renderPage(pageNumber);
        }

    }


    function goNext() {

        if (!pdfDocument) return;
        if (currentPage >= pdfDocument.numPages) return;

        currentPage++;
        queueRenderPage(currentPage);

    }


    function goPrevious() {

        if (!pdfDocument) return;
        if (currentPage <= 1) return;

        currentPage--;
        queueRenderPage(currentPage);

    }


    function updateButtons() {

        if (!pdfDocument) return;

        previousButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= pdfDocument.numPages;

    }


    nextButton.addEventListener("click", goNext);
    previousButton.addEventListener("click", goPrevious);


    /* Keyboard controls */

    document.addEventListener("keydown", event => {

        if (event.key === "ArrowRight") goNext();
        if (event.key === "ArrowLeft") goPrevious();

    });

}


/* =====================================================
   TERMINAL BUTTON
   (was broken before: terminalButton was undefined and
   terminalBody was never declared)
===================================================== */

const terminalButton = document.getElementById("terminalButton");
const terminalBody = document.getElementById("terminalBody");

if (terminalButton && terminalBody) {

    let terminalAccessed = false;

    terminalButton.addEventListener("click", () => {

        if (terminalAccessed) return;
        terminalAccessed = true;

        [
            "&gt; mining_terminal: ACCESS GRANTED",
            "&gt; BITMINERS SYSTEM READY"
        ].forEach(text => {

            const line = document.createElement("p");
            line.className = "terminal-green";
            line.innerHTML = text;
            terminalBody.appendChild(line);

        });

        terminalBody.scrollTop = terminalBody.scrollHeight;

    });

}


/* =====================================================
   TERMINAL INITIAL ANIMATION
===================================================== */

const terminalLines = document.querySelectorAll(".terminal-body p");

terminalLines.forEach((line, index) => {

    line.style.opacity = "0";
    line.style.transform = "translateX(-10px)";

    setTimeout(() => {

        line.style.transition = "all .4s ease";
        line.style.opacity = "1";
        line.style.transform = "translateX(0)";

    }, 300 + index * 250);

});


/* =====================================================
   SCROLL REVEAL
===================================================== */

const revealElements = document.querySelectorAll(
    ".mechanism-card, .treasury-stat, .holder-card, .culture-content, .final-content"
);

const revealObserver = new IntersectionObserver(
    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }

        });

    },
    { threshold: 0.1 }
);

revealElements.forEach(element => {

    element.classList.add("reveal");
    revealObserver.observe(element);

});


/* =====================================================
   NAVBAR
===================================================== */

const navbar = document.querySelector(".navbar");

if (navbar) {

    window.addEventListener("scroll", () => {

        navbar.style.background =
            window.scrollY > 40
                ? "rgba(3,3,3,.98)"
                : "rgba(3,3,3,.88)";

    });

}


/* =====================================================
   BUY $BIT BUTTONS
   The old "COMING SOON" alert is removed. Both BUY $BIT
   buttons are normal links to coming-soon.html, so they
   always redirect there (no JavaScript needed).
===================================================== */
