/* Aidan Madsen: site interactions
   - copy email + toast
   - cursor spotlight on tiles
   - scroll reveal + animated stat counters
   - active section in nav
   - ⌘K / Ctrl+K quick actions
   - research charts (mini sparkline on home, interactive chart on research page)
*/
(function () {
    "use strict";

    var EMAIL = "aidanmad@byu.edu";
    var LINKEDIN = "https://www.linkedin.com/in/aidan-madsen-51747a329/";
    var RESUME = "assets/Aidan_Madsen_Resume.pdf";
    var isHome = document.body.dataset.page === "home";
    var HOME = isHome ? "" : "index.html";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

    /* Research data: rate of reported sex-related offenses per 100k (FBI NIBRS).
       Values read from Figure 4 of the paper ("Real Texas vs Synthetic Texas"), so they are approximate (±0.5). */
    var RESEARCH = {
        years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
        texas: [47.9, 54.5, 53.9, 53.9, 62.3, 56.7, 61.1, 52.3, 70.8, 65.5, 69.4],
        synth: [48.9, 53.9, 54.0, 54.1, 62.3, 57.0, 60.6, 53.1, 62.0, 60.8, 57.9],
        lawYear: 2021
    };

    /* ---------- Toast ---------- */
    var toastEl = document.querySelector(".toast");
    var toastTimer;
    function toast(html) {
        if (!toastEl) return;
        toastEl.innerHTML = html;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
    }

    /* ---------- Copy email ---------- */
    function copyEmail() {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(EMAIL).then(function () {
                toast('<i class="bi bi-check-circle-fill"></i> Copied ' + EMAIL);
            }, function () { window.location.href = "mailto:" + EMAIL; });
        } else {
            // Fallback for file:// or older browsers
            var ta = document.createElement("textarea");
            ta.value = EMAIL; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            document.body.removeChild(ta);
            if (ok) toast('<i class="bi bi-check-circle-fill"></i> Copied ' + EMAIL);
            else window.location.href = "mailto:" + EMAIL;
        }
    }
    document.querySelectorAll("[data-copy-email]").forEach(function (b) { b.addEventListener("click", copyEmail); });

    /* ---------- Modifier key label ---------- */
    if (!isMac) document.querySelectorAll("[data-mod-key]").forEach(function (k) { k.textContent = "Ctrl K"; });

    /* ---------- Cursor spotlight ---------- */
    if (window.matchMedia("(hover: hover)").matches) {
        document.querySelectorAll(".tile").forEach(function (t) {
            t.addEventListener("pointermove", function (e) {
                var r = t.getBoundingClientRect();
                t.style.setProperty("--mx", (e.clientX - r.left) + "px");
                t.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* ---------- Counters ---------- */
    function animateCount(el) {
        var raw = el.dataset.count;
        var target = parseFloat(raw);
        var decimals = (raw.split(".")[1] || "").length;
        var pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
        var final = pre + target.toFixed(decimals) + suf;
        if (reduceMotion) { el.textContent = final; return; }
        var dur = 1400, t0 = null;
        function step(now) {
            if (t0 === null) t0 = now;
            var p = Math.min((now - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = pre + (target * eased).toFixed(decimals) + suf;
            if (p < 1) requestAnimationFrame(step); else el.textContent = final;
        }
        requestAnimationFrame(step);
    }

    /* ---------- Reveal on scroll ---------- */
    var revealEls = document.querySelectorAll("[data-reveal]");
    var counterEls = document.querySelectorAll("[data-count]");
    if ("IntersectionObserver" in window) {
        var revealIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        revealEls.forEach(function (el) { revealIO.observe(el); });

        var countIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
            });
        }, { threshold: 0.6 });
        counterEls.forEach(function (el) { countIO.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add("in"); });
    }

    /* ---------- Active nav link ---------- */
    var navLinks = document.querySelectorAll("[data-nav]");
    if (navLinks.length && "IntersectionObserver" in window) {
        var navIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                navLinks.forEach(function (a) { a.classList.toggle("active", a.dataset.nav === e.target.id); });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        navLinks.forEach(function (a) {
            var sec = document.getElementById(a.dataset.nav);
            if (sec) navIO.observe(sec);
        });
    }

    /* ---------- Quick actions (⌘K) ---------- */
    var dialog = document.getElementById("cmdk");
    var input = document.getElementById("cmdk-input");
    var list = document.getElementById("cmdk-list");
    var ACTIONS = [
        { group: "Go to", label: "Overview", icon: "bi-grid-1x2", href: HOME + "#overview", keys: "home top intro" },
        { group: "Go to", label: "Experience", icon: "bi-briefcase", href: HOME + "#experience", keys: "work jobs resume nucleus philo printadontics sandbox" },
        { group: "Go to", label: "Education & Skills", icon: "bi-mortarboard", href: HOME + "#skills", keys: "byu school languages spanish python excel" },
        { group: "Go to", label: "Contact", icon: "bi-chat-dots", href: HOME + "#contact", keys: "email reach hire" },
        { group: "Go to", label: "Research: Texas H.B. 1540", icon: "bi-graph-up", href: "research.html", keys: "paper econometrics synthetic control stata" },
        { group: "Go to", label: "Rock climbing", icon: "bi-image", href: "scratch.html", keys: "photos tableau climbing beyond" },
        { group: "Actions", label: "Copy email address", icon: "bi-copy", run: copyEmail, hint: EMAIL, keys: "mail" },
        { group: "Actions", label: "Download resume (PDF)", icon: "bi-download", href: RESUME, download: true, keys: "cv pdf" },
        { group: "Actions", label: "Send an email", icon: "bi-envelope", href: "mailto:" + EMAIL, keys: "mail contact" },
        { group: "Links", label: "LinkedIn", icon: "bi-linkedin", href: LINKEDIN, external: true, keys: "connect profile" },
        { group: "Links", label: "Printadontics", icon: "bi-box-arrow-up-right", href: "https://www.printadontics.com/", external: true, keys: "dental startup" },
        { group: "Links", label: "Chapshift", icon: "bi-box-arrow-up-right", href: "https://chapshift.com", external: true, keys: "app saas" },
        { group: "Links", label: "Fairway Glass (website I built)", icon: "bi-box-arrow-up-right", href: "https://fairwayglass.com/", external: true, keys: "web design client site glazing" }
    ];
    var filtered = ACTIONS.slice();
    var selected = 0;

    function render() {
        var q = input.value.trim().toLowerCase();
        filtered = ACTIONS.filter(function (a) {
            return !q || (a.label + " " + (a.keys || "") + " " + a.group).toLowerCase().indexOf(q) !== -1;
        });
        if (selected >= filtered.length) selected = 0;
        list.innerHTML = "";
        if (!filtered.length) {
            list.innerHTML = '<li class="cmdk-empty">No matches. Try "email" or "resume".</li>';
            input.removeAttribute("aria-activedescendant");
            return;
        }
        var lastGroup = null;
        filtered.forEach(function (a, i) {
            if (a.group !== lastGroup) {
                var g = document.createElement("li");
                g.className = "cmdk-group"; g.setAttribute("role", "presentation"); g.textContent = a.group;
                list.appendChild(g);
                lastGroup = a.group;
            }
            var li = document.createElement("li");
            li.className = "cmdk-item"; li.id = "cmdk-opt-" + i;
            li.setAttribute("role", "option");
            li.setAttribute("aria-selected", i === selected ? "true" : "false");
            li.innerHTML = '<i class="bi ' + a.icon + '" aria-hidden="true"></i><span></span>' +
                (a.hint ? '<span class="hint"></span>' : (a.external ? '<span class="hint">↗</span>' : ""));
            li.querySelector("span").textContent = a.label;
            if (a.hint) li.querySelector(".hint").textContent = a.hint;
            li.addEventListener("pointermove", function () { if (selected !== i) { selected = i; updateSel(); } });
            li.addEventListener("click", function () { runAction(a); });
            list.appendChild(li);
        });
        updateSel();
    }
    function updateSel() {
        list.querySelectorAll(".cmdk-item").forEach(function (el, i) { el.setAttribute("aria-selected", i === selected ? "true" : "false"); });
        var cur = document.getElementById("cmdk-opt-" + selected);
        if (cur) { input.setAttribute("aria-activedescendant", cur.id); cur.scrollIntoView({ block: "nearest" }); }
    }
    function runAction(a) {
        closeCmdk();
        if (a.run) { a.run(); return; }
        if (a.download || a.external) {
            var link = document.createElement("a");
            link.href = a.href;
            if (a.download) link.setAttribute("download", "");
            if (a.external) { link.target = "_blank"; link.rel = "noopener"; }
            document.body.appendChild(link); link.click(); link.remove();
            return;
        }
        window.location.href = a.href;
    }
    function openCmdk() {
        if (!dialog || dialog.open) return;
        input.value = ""; selected = 0; render();
        if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
        input.focus();
    }
    function closeCmdk() {
        if (!dialog) return;
        if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
    }
    if (dialog && input && list) {
        document.querySelectorAll("[data-cmdk-open]").forEach(function (b) { b.addEventListener("click", openCmdk); });
        document.addEventListener("keydown", function (e) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (dialog.open) closeCmdk(); else openCmdk();
            }
        });
        input.addEventListener("input", function () { selected = 0; render(); });
        input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown") { e.preventDefault(); if (filtered.length) { selected = (selected + 1) % filtered.length; updateSel(); } }
            else if (e.key === "ArrowUp") { e.preventDefault(); if (filtered.length) { selected = (selected - 1 + filtered.length) % filtered.length; updateSel(); } }
            else if (e.key === "Enter") { e.preventDefault(); if (filtered[selected]) runAction(filtered[selected]); }
        });
        dialog.addEventListener("click", function (e) { if (e.target === dialog) closeCmdk(); });
    }

    /* ---------- Chart helpers ---------- */
    var SVGNS = "http://www.w3.org/2000/svg";
    function el(name, attrs, parent) {
        var n = document.createElementNS(SVGNS, name);
        for (var k in attrs) n.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(n);
        return n;
    }
    function pathFrom(xs, ys) {
        return xs.map(function (x, i) { return (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1); }).join(" ");
    }
    function gradientDef(svg, id) {
        var defs = el("defs", {}, svg);
        var g = el("linearGradient", { id: id, x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
        el("stop", { offset: "0", "stop-color": "#818cf8" }, g);
        el("stop", { offset: "0.6", "stop-color": "#a78bfa" }, g);
        el("stop", { offset: "1", "stop-color": "#e879f9" }, g);
        return defs;
    }
    // Reveal the drawn lines left-to-right with a clip rect
    function drawIn(svg, clipRect, fullWidth, startX) {
        if (reduceMotion || !("IntersectionObserver" in window)) { clipRect.setAttribute("width", fullWidth); return; }
        clipRect.setAttribute("width", 0);
        var io = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            var t0 = null, dur = 1300;
            function step(now) {
                if (t0 === null) t0 = now;
                var p = Math.min((now - t0) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                clipRect.setAttribute("width", (fullWidth * eased).toFixed(1));
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }, { threshold: 0.4 });
        io.observe(svg);
    }

    /* ---------- Mini chart (home tile) ---------- */
    function miniChart(host) {
        var W = 300, H = 120, pad = 6, min = 45, max = 73;
        var d = RESEARCH, n = d.years.length;
        var x = function (i) { return pad + (i / (n - 1)) * (W - pad * 2); };
        var y = function (v) { return H - pad - ((v - min) / (max - min)) * (H - pad * 2); };
        var xs = d.years.map(function (_, i) { return x(i); });
        var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", "aria-hidden": "true" });
        gradientDef(svg, "mini-grad");
        var clip = el("clipPath", { id: "mini-clip" }, svg.querySelector("defs"));
        var clipRect = el("rect", { x: 0, y: -10, width: W, height: H + 20 }, clip);
        var li = d.years.indexOf(d.lawYear);

        el("line", { x1: x(li), x2: x(li), y1: 0, y2: H, stroke: "rgba(255,255,255,0.25)", "stroke-dasharray": "3 4", "vector-effect": "non-scaling-stroke" }, svg);
        var g = el("g", { "clip-path": "url(#mini-clip)" }, svg);
        // shaded gap after the law
        var post = xs.slice(li);
        var area = "M" + post.map(function (px, k) { return px.toFixed(1) + " " + y(d.texas[li + k]).toFixed(1); }).join(" L") +
            " L" + post.slice().reverse().map(function (px, k) { return px.toFixed(1) + " " + y(d.synth[n - 1 - k]).toFixed(1); }).join(" L") + " Z";
        el("path", { d: area, fill: "rgba(217,70,239,0.16)" }, g);
        el("path", { d: pathFrom(xs, d.synth.map(y)), fill: "none", stroke: "#9898ae", "stroke-width": 1.6, "stroke-dasharray": "4 4", "vector-effect": "non-scaling-stroke" }, g);
        el("path", { d: pathFrom(xs, d.texas.map(y)), fill: "none", stroke: "url(#mini-grad)", "stroke-width": 2.6, "stroke-linejoin": "round", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }, g);
        host.appendChild(svg);
        drawIn(svg, clipRect, W);
    }
    document.querySelectorAll("[data-mini-chart]").forEach(miniChart);

    /* ---------- Full interactive chart (research page) ---------- */
    function fullChart(host) {
        var d = RESEARCH, n = d.years.length, li = d.years.indexOf(d.lawYear);
        var tip = host.querySelector(".chart-tip");
        var animated = false, state = null, active = -1;

        function build() {
            var old = host.querySelector("svg");
            if (old) old.remove();
            var W = host.clientWidth;
            if (!W) return;
            var H = Math.round(Math.max(260, Math.min(420, W * 0.52)));
            var m = { l: 34, r: 12, t: 30, b: 30 };
            var min = 45, max = 75;
            var iw = W - m.l - m.r, ih = H - m.t - m.b;
            var x = function (i) { return m.l + (i / (n - 1)) * iw; };
            var y = function (v) { return m.t + ih - ((v - min) / (max - min)) * ih; };
            var xs = d.years.map(function (_, i) { return x(i); });

            var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
            var defs = gradientDef(svg, "full-grad");
            var clip = el("clipPath", { id: "full-clip" }, defs);
            var clipRect = el("rect", { x: 0, y: 0, width: W, height: H }, clip);

            // post-law band
            el("rect", { x: x(li), y: m.t, width: x(n - 1) - x(li), height: ih, fill: "rgba(255,255,255,0.025)" }, svg);

            // grid + y axis
            var grid = el("g", { class: "grid" }, svg);
            var axis = el("g", { class: "axis" }, svg);
            for (var v = min; v <= max; v += 5) {
                el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, grid);
                var t = el("text", { x: m.l - 8, y: y(v) + 4, "text-anchor": "end" }, axis);
                t.textContent = v;
            }
            var every = W < 520 ? 2 : 1;
            d.years.forEach(function (yr, i) {
                if (i % every !== 0 && i !== n - 1) return;
                var t = el("text", { x: x(i), y: H - 8, "text-anchor": "middle" }, axis);
                t.textContent = W < 520 ? "’" + String(yr).slice(2) : yr;
            });

            // law marker
            el("line", { x1: x(li), x2: x(li), y1: m.t - 6, y2: m.t + ih, stroke: "rgba(232,121,249,0.7)", "stroke-dasharray": "4 4" }, svg);
            var lab = el("text", { x: x(li) - 8, y: m.t - 12, "text-anchor": "end", fill: "#e879f9", style: "font: 500 11.5px var(--mono)" }, svg);
            lab.textContent = "H.B. 1540 takes effect";

            var g = el("g", { "clip-path": "url(#full-clip)" }, svg);
            var post = xs.slice(li);
            var area = "M" + post.map(function (px, k) { return px.toFixed(1) + " " + y(d.texas[li + k]).toFixed(1); }).join(" L") +
                " L" + post.slice().reverse().map(function (px, k) { return px.toFixed(1) + " " + y(d.synth[n - 1 - k]).toFixed(1); }).join(" L") + " Z";
            el("path", { d: area, fill: "rgba(217,70,239,0.14)" }, g);
            el("path", { d: pathFrom(xs, d.synth.map(y)), fill: "none", stroke: "#9898ae", "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
            el("path", { d: pathFrom(xs, d.texas.map(y)), fill: "none", stroke: "url(#full-grad)", "stroke-width": 3.2, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
            d.texas.forEach(function (v, i) { el("circle", { cx: xs[i], cy: y(v), r: 3, fill: "#c4b5fd" }, g); });

            // hover elements
            var guide = el("line", { y1: m.t, y2: m.t + ih, stroke: "rgba(255,255,255,0.3)", opacity: 0 }, svg);
            var dotT = el("circle", { r: 6, fill: "#e879f9", stroke: "#09090f", "stroke-width": 2.5, opacity: 0 }, svg);
            var dotS = el("circle", { r: 5, fill: "#9898ae", stroke: "#09090f", "stroke-width": 2.5, opacity: 0 }, svg);
            var hit = el("rect", { x: m.l, y: 0, width: iw, height: H, fill: "transparent" }, svg);

            host.insertBefore(svg, tip);
            state = { x: x, y: y, xs: xs, W: W, m: m, guide: guide, dotT: dotT, dotS: dotS };

            hit.addEventListener("pointermove", function (e) {
                var r = svg.getBoundingClientRect();
                var px = e.clientX - r.left;
                var i = Math.round(((px - m.l) / iw) * (n - 1));
                show(Math.max(0, Math.min(n - 1, i)));
            });
            hit.addEventListener("pointerdown", function (e) {
                var r = svg.getBoundingClientRect();
                var i = Math.round(((e.clientX - r.left - m.l) / iw) * (n - 1));
                show(Math.max(0, Math.min(n - 1, i)));
            });
            hit.addEventListener("pointerleave", hide);

            if (!animated) { drawIn(svg, clipRect, W); animated = true; }
            if (active >= 0) show(active);
        }

        function show(i) {
            if (!state) return;
            active = i;
            var s = state, cx = s.xs[i];
            s.guide.setAttribute("x1", cx); s.guide.setAttribute("x2", cx); s.guide.setAttribute("opacity", 1);
            s.dotT.setAttribute("cx", cx); s.dotT.setAttribute("cy", s.y(d.texas[i])); s.dotT.setAttribute("opacity", 1);
            s.dotS.setAttribute("cx", cx); s.dotS.setAttribute("cy", s.y(d.synth[i])); s.dotS.setAttribute("opacity", 1);
            var gap = d.texas[i] - d.synth[i];
            tip.innerHTML =
                '<div class="tip-year">' + d.years[i] + '<span>' + (d.years[i] >= d.lawYear ? "after law" : "before law") + "</span></div>" +
                '<div class="tip-row">Texas <b>' + d.texas[i].toFixed(1) + "</b></div>" +
                '<div class="tip-row">Synthetic Texas <b>' + d.synth[i].toFixed(1) + "</b></div>" +
                '<div class="tip-row tip-gap">Gap <b>' + (gap >= 0 ? "+" : "−") + Math.abs(gap).toFixed(1) + "</b></div>";
            tip.classList.add("show");
            var tw = tip.offsetWidth;
            var left = cx + 16;
            if (left + tw > s.W) left = cx - tw - 16;
            tip.style.left = Math.max(0, left) + "px";
            tip.style.top = (s.m.t + 4) + "px";
        }
        function hide() {
            active = -1;
            if (!state) return;
            [state.guide, state.dotT, state.dotS].forEach(function (n) { n.setAttribute("opacity", 0); });
            tip.classList.remove("show");
        }

        host.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight") { e.preventDefault(); show(active < 0 ? li : Math.min(n - 1, active + 1)); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); show(active < 0 ? li : Math.max(0, active - 1)); }
            else if (e.key === "Escape") { hide(); }
        });
        host.addEventListener("blur", hide);

        build();
        if ("ResizeObserver" in window) {
            var lastW = host.clientWidth;
            new ResizeObserver(function () {
                if (Math.abs(host.clientWidth - lastW) < 2) return;
                lastW = host.clientWidth; build();
            }).observe(host);
        } else {
            window.addEventListener("resize", build);
        }
    }
    document.querySelectorAll("[data-research-chart]").forEach(fullChart);
})();
