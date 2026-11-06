
// ======================================
// GRAND CONCERT CUSTOM
// ======================================

const instrumentData = [
    { id: "piano", name: "🎹 Piano", type: "piano", wave: "triangle" },
    { id: "guitar", name: "🎸 Gitar", type: "guitar", wave: "sawtooth" },
    { id: "bass", name: "🎸 Bass", type: "bass", wave: "triangle" },
    { id: "violin", name: "🎻 Biola", type: "violin", wave: "sawtooth" },
    { id: "flute", name: "🪈 Flute", type: "flute", wave: "sine" },
    { id: "drums", name: "🥁 Drum", type: "drums", wave: "noise" }
];

const noteNames = [
    "C3","D3","E3","F3","G3","A3","B3",
    "C4","D4","E4","F4","G4","A4","B4",
    "C5","D5","E5","F5","G5","A5","B5"
];

const scales = {
    C: ["C","D","E","F","G","A","B"],
    G: ["G","A","B","C","D","E","F#"],
    D: ["D","E","F#","G","A","B","C#"],
    A: ["A","B","C","D","E","F","G"],
    F: ["F","G","A","Bb","C","D","E"]
};

const patterns = {};
const steps = 8;

let audioContext = null;
let timer = null;
let currentStep = 0;
let isPlaying = false;
let nextTime = 0;
let generation = 0;

// ======================================
// MEMBUAT POLA MUSIK
// ======================================

instrumentData.forEach(inst => {

    patterns[inst.id] = Array.from(
        { length: steps },
        (_, i) => ({
            on: [0, 2, 4, 6].includes(i),

            note: inst.id === "bass"
                ? ["C3","C3","G3","C3","F3","F3","G3","G3"][i]

                : inst.id === "drums"
                ? "C3"

                : ["C4","E4","G4","E4","F4","A4","G4","E4"][i]
        })
    );

});

const root = document.getElementById("instruments");

// ======================================
// MENAMPILKAN INSTRUMEN
// ======================================

function renderInstruments() {

    root.innerHTML = "";

    instrumentData.forEach(inst => {

        const card = document.createElement("div");
        card.className = "instrument";

        const head = document.createElement("div");
        head.className = "instrument-head";

        const title = document.createElement("div");

        title.innerHTML = `
            <div class="instrument-name">${inst.name}</div>
            <div class="small">Volume instrumen</div>
        `;

        const volume = document.createElement("input");

        volume.type = "range";
        volume.min = "0";
        volume.max = "1";
        volume.step = "0.05";

        volume.value = inst.id === "drums" ? "0.4" : "0.25";

        volume.setAttribute(
            "aria-label",
            "Volume " + inst.name
        );

        inst.volume = volume;

        head.append(title, volume);

        const grid = document.createElement("div");
        grid.className = "notes";

        patterns[inst.id].forEach((pattern, i) => {

            const cell = document.createElement("div");
            cell.style.minWidth = "0";

            const btn = document.createElement("button");

            btn.className =
                "step" + (pattern.on ? " active" : "");

            btn.textContent = i + 1;
            btn.style.width = "100%";

            btn.title = "Ketukan " + (i + 1);

            btn.setAttribute(
                "aria-pressed",
                String(pattern.on)
            );

            const select = document.createElement("select");

            select.style.width = "100%";
            select.style.padding = "5px 0";
            select.style.fontSize = "10px";

            select.setAttribute(
                "aria-label",
                inst.name + ", nada ketukan " + (i + 1)
            );

            noteNames.forEach(note => {

                const opt = document.createElement("option");

                opt.value = note;
                opt.textContent = note;

                select.appendChild(opt);

            });

            select.value = pattern.note;

            // Mengaktifkan dan menonaktifkan ketukan

            btn.addEventListener("click", () => {

                pattern.on = !pattern.on;

                btn.classList.toggle("active", pattern.on);

                btn.setAttribute(
                    "aria-pressed",
                    String(pattern.on)
                );

            });

            // Mengubah nada

            select.addEventListener("change", () => {

                pattern.note = select.value;

            });

            cell.append(btn, select);
            grid.appendChild(cell);

        });

        card.append(head, grid);

        root.appendChild(card);

    });

}

// ======================================
// MENGUBAH NADA MENJADI FREKUENSI
// ======================================

function frequency(note) {

    const match = note.match(/^([A-G])(#|b)?(\d)$/);

    if (!match) return 261.63;

    const semitones = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11
    };

    let n = semitones[match[1]];

    if (match[2] === "#") n++;
    if (match[2] === "b") n--;

    const midi = (Number(match[3]) + 1) * 12 + n;

    return 440 * Math.pow(2, (midi - 69) / 12);

}

// ======================================
// MEMAINKAN SUARA INSTRUMEN
// ======================================

function playTone(inst, note, time, duration) {

    if (!audioContext) return;

    // SUARA DRUM

    if (inst.type === "drums") {

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = "sine";

        osc.frequency.setValueAtTime(130, time);

        osc.frequency.exponentialRampToValueAtTime(
            45,
            time + 0.12
        );

        gain.gain.setValueAtTime(
            Number(inst.volume.value),
            time
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.15
        );

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.16);

        return;
    }

    // SUARA INSTRUMEN LAIN

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const volume = Number(inst.volume.value);
    const freq = frequency(note);

    osc.type = inst.wave;

    osc.frequency.setValueAtTime(freq, time);

    // KARAKTER SUARA GITAR

    if (inst.type === "guitar") {

        osc.frequency.exponentialRampToValueAtTime(
            Math.max(30, freq * 0.98),
            time + duration
        );

    }

    // VOLUME KHUSUS INSTRUMEN

    const level =
        inst.type === "bass" ? 0.35 :
        inst.type === "violin" ? 0.18 :
        0.22;

    gain.gain.setValueAtTime(0.001, time);

    gain.gain.linearRampToValueAtTime(
        Math.max(0.001, volume * level),
        time + 0.025
    );

    gain.gain.setTargetAtTime(
        0.001,
        time + duration * 0.65,
        0.06
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(time);
    osc.stop(time + duration + 0.2);

}

// ======================================
// MENGATUR KETUKAN MUSIK
// ======================================

function scheduleStep() {

    if (!isPlaying || !audioContext) return;

    const bpm = Math.max(
        40,
        Math.min(
            200,
            Number(document.getElementById("tempo").value) || 100
        )
    );

    const beatDuration = 60 / bpm;

    while (nextTime < audioContext.currentTime + 0.1) {

        const step = currentStep;

        instrumentData.forEach(inst => {

            const pattern = patterns[inst.id][step];

            if (pattern.on) {

                playTone(
                    inst,
                    pattern.note,
                    nextTime,
                    beatDuration * 0.8
                );

            }

        });

        const scheduledStep = step;
        const scheduledGeneration = generation;

        setTimeout(() => {

            if (
                scheduledGeneration !== generation ||
                !isPlaying
            ) return;

            document.querySelectorAll(".step").forEach(btn => {
                btn.classList.remove("playing");
            });

            instrumentData.forEach(inst => {

                const card = [...root.children].find(el =>
                    el.querySelector(".instrument-name")
                    ?.textContent === inst.name
                );

                const btn =
                    card?.querySelectorAll(".step")[scheduledStep];

                if (btn) {
                    btn.classList.add("playing");
                }

            });

            [...document.querySelectorAll("#meter span")]
                .forEach((bar, i) => {

                    bar.classList.toggle(
                        "on",
                        i === scheduledStep
                    );

                });

        }, Math.max(
            0,
            (nextTime - audioContext.currentTime) * 1000
        ));

        nextTime += beatDuration;

        currentStep = (currentStep + 1) % steps;

    }

}

// ======================================
// MEMULAI KONSER
// ======================================

async function startConcert() {

    if (isPlaying) return;

    const bpmInput = document.getElementById("tempo");

    bpmInput.value = Math.max(
        40,
        Math.min(200, Number(bpmInput.value) || 100)
    );

    audioContext ||= new (
        window.AudioContext ||
        window.webkitAudioContext
    )();

    await audioContext.resume();

    isPlaying = true;

    generation++;

    currentStep = 0;

    nextTime = audioContext.currentTime + 0.05;

    document.getElementById("status").textContent =
        "🎶 Konser sedang berlangsung...";

    timer = setInterval(scheduleStep, 25);

}

// ======================================
// MENGHENTIKAN KONSER
// ======================================

function stopConcert() {

    isPlaying = false;

    generation++;

    if (timer) {
        clearInterval(timer);
    }

    timer = null;

    currentStep = 0;

    document.getElementById("status").textContent =
        "Konser dihentikan.";

    document.querySelectorAll(".step").forEach(btn => {
        btn.classList.remove("playing");
    });

    document.querySelectorAll("#meter span").forEach(bar => {
        bar.classList.remove("on");
    });

}

// ======================================
// TOMBOL KONTROL
// ======================================

document.getElementById("play")
    .addEventListener("click", startConcert);

document.getElementById("stop")
    .addEventListener("click", stopConcert);

// ======================================
// TOMBOL RESET
// ======================================

document.getElementById("reset")
    .addEventListener("click", () => {

        stopConcert();

        instrumentData.forEach(inst => {

            patterns[inst.id].forEach((p, i) => {

                p.on = [0, 2, 4, 6].includes(i);

                p.note = inst.id === "bass"
                    ? ["C3","C3","G3","C3","F3","F3","G3","G3"][i]

                    : inst.id === "drums"
                    ? "C3"

                    : ["C4","E4","G4","E4","F4","A4","G4","E4"][i];

            });

        });

        renderInstruments();

        document.getElementById("status").textContent =
            "Pola musik telah direset.";

    });

// ======================================
// MENAMPILKAN SEMUA INSTRUMEN
// ======================================

renderInstruments();
