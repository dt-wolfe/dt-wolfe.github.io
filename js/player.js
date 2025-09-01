//hide mem trainer until code is updated
document.querySelector(".memorytrainer")?.classList.toggle("hide-active");
//Init vars
const render_abc = [];
const audio_abc = [];

if (render_abc.length == 0) {
    render_abc.push(
        `X:1
T:Twinkle Twinkle
M:4/4
L:1/4
K:C
C C G G | A A G2 | F F E E | D D C2 ||
`,
        `X:2
T:Mary Had a Little Lamb
M:4/4
L:1/4
K:C
E D C D | E E E2 | D D D2 | E G G2 ||
`)
}
if (audio_abc.length == 0) {
    audio_abc.push(
        `X:1
T:Twinkle Twinkle
M:4/4
L:1/4
K:C
C C G G | A A G2 | F F E E | D D C2 ||
`,
        `X:2
T:Mary Had a Little Lamb
M:4/4
L:1/4
K:C
E D C D | E E E2 | D D D2 | E G G2 ||
`)
}

let currentTune = 0;
let hiddenMeasures = 0;
let totalMeasures = 0;
let synthControl;
let synth;
let isLooping = false;
let isSpeedTrainer = false;
let isMemoryTrainer = false;
let loopInProgress = false;
let audioActive = false;
const abcOptions = { add_classes: true, responsive: "resize" };

//Init Synth
if (ABCJS.synth.supportsAudio()) {
    synthControl = new ABCJS.synth.SynthController();
    synthControl.load("#audio", false, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true
    });
} else {
    console.log("Audio not supported in this browser");
}


function toggleMemoryTrainer() {
    isMemoryTrainer = !isMemoryTrainer;
    hiddenMeasures = 0;

    // Reset all measures visible
    for (let i = 0; i < totalMeasures; i++) {
        document.querySelectorAll(`.abcjs-mm${i}`).forEach(m => m.style.display = "inline");
    }

    if (isMemoryTrainer) {
        totalMeasures = ABCJS.extractMeasures(render_abc[currentTune])[0].measures.length;
        document.querySelector(".memorytrainer")?.classList.add("loop-active");
        toggleLoop();
    } else {
        toggleLoop();
        document.querySelector(".memorytrainer")?.classList.remove("loop-active");
    }
}

function handlePlaybackEnded() {
    audioActive = false;
    if (isSpeedTrainer) {
        let currentWarp = parseInt(document.querySelector(".abcjs-midi-tempo")?.value, 10) || 0;
        if (currentWarp >= 100) {
            toggleSpeedTrainer()
            return;
        }
        synthControl.setWarp(currentWarp + 10);
    }

    if (isLooping) {
        start();
    }
    // else {
    // synthControl?.seek(0);
    // }

    // if (isMemoryTrainer && !loopInProgress) {
    //     loopInProgress = true;
    //     if (hiddenMeasures < totalMeasures) {
    //         document.querySelectorAll(`.abcjs-mm${hiddenMeasures}`).forEach(m => m.style.display = "none");
    //         hiddenMeasures++;
    //     } else {
    //         toggleLoop();
    //         isMemoryTrainer = false;
    //         for (let i = 0; i < totalMeasures; i++) {
    //             document.querySelectorAll(`.abcjs-mm${i}`).forEach(m => m.style.display = "inline");
    //         }
    //         document.querySelector(".memorytrainer")?.classList.remove("loop-active");
    //         return;
    //     }
    // }
    // setTimeout(() => loopInProgress = false, 500);
}

function setTune(userAction) {
    if (!synthControl) return;
    synthControl.disable(true);
    document.getElementById("tuneSelect").value = currentTune;

    const renderObj = ABCJS.renderAbc("render_paper", render_abc[currentTune], abcOptions)[0];
    const audioObj = ABCJS.renderAbc("audio_paper", audio_abc[currentTune], abcOptions)[0];

    synthControl.setTune(
        audioObj,
        userAction,
        {
            onEnded: handlePlaybackEnded
        }
    ).then((response) => {
        console.log(response)
        // if (isLooping) {
        //     synthControl.toggleLoop();
        //     document.querySelector(".loop")?.classList.add("loop-active");        
    }
    ).catch(err => console.warn("Audio problem:", err));
}

function zzsetTune(userAction) {
    synthControl.disable(true);
    document.getElementById("tuneSelect").value = currentTune;

    const renderObj = ABCJS.renderAbc("render_paper", render_abc[currentTune], abcOptions)[0];
    const audioObj = ABCJS.renderAbc("audio_paper", audio_abc[currentTune], abcOptions)[0];

    // TODO-PER: This will allow the callback function to have access to timing info - this should be incorporated into the render at some point.
    synth = new ABCJS.synth.CreateSynth();
    synth.init({
        audioContext: new AudioContext(),
        visualObj: audioObj,
        // sequence: [],
        // millisecondsPerMeasure: 1000,
        // debugCallback: function(message) { console.log(message) },
        options: {
            // soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/" ,
            // sequenceCallback: function(noteMapTracks, callbackContext) { return noteMapTracks; },
            // callbackContext: this,
            //onEnded: handlePlaybackEnded//function(callbackContext),
            // pan: [ -0.5, 0.5 ]
        }
    }).then(function (response) {
        console.log(response);
        // if (synthControl) {
        //     synthControl.setTune(audioObj, userAction, {
        //         onEnded: handlePlaybackEnded
        //     }).then(function (response) {
        //         console.log("Audio successfully loaded.")
        //     }).catch(function (error) {
        //         console.warn("Audio problem:", error);
        //     });
        // }
    }).catch(function (error) {
        console.warn("Audio problem:", error);
    });
}

//Event Listener Functions
function previous() {
    currentTune = (currentTune - 1 + render_abc.length) % render_abc.length;
    setTune(true);
}

function next() {
    currentTune = (currentTune + 1) % render_abc.length;
    setTune(true);
}

function goto() {
    const val = parseInt(document.querySelector('#tuneSearch').value, 10);
    if (!isNaN(val) && val > 0 && val <= render_abc.length) {
        currentTune = val - 1;
        tuneSelect.value = currentTune;
        setTune(true);
    }
}

async function start() {
    if (!audioActive) {
        audioActive = true;
        await countdown(3);
    }
    synthControl?.play();
}

function restart() {
    synthControl?.restart();
}

function toggleLoop() {
    if (!synthControl) return;
    isLooping = !isLooping;
    document.querySelector(".loop")?.classList.toggle("loop-active");
    document.querySelectorAll(".audio_controls button:not(.loop), .speedtrainer").forEach(function (el) {
        el?.classList.toggle("hide-active");
    });
    // document.querySelectorAll(".trainer_controls button:not(.memorytrainer,.hide)").forEach(function (el) {
    //     el?.classList.toggle("hide-active");
    // });
    // if (isLooping || !isSpeedTrainer) {
    //     document.querySelector(".speedtrainer")?.classList.toggle("hide-active");
    // }
    synthControl?.seek(0);
    start();
}

function warp(amount) {
    if (!synthControl) return;
    synthControl.setWarp(amount);
    document.querySelectorAll(".warp25, .warp50, .warp75, .warp100")
        .forEach(btn => btn.classList.remove("warp-active"));
    document.querySelector(`.warp${amount}`)?.classList.add("warp-active");
}

function toggleSpeedTrainer() {
    isSpeedTrainer = !isSpeedTrainer;
    isLooping = !isLooping

    if (isSpeedTrainer) {
        synthControl?.setWarp(30);
    }

    document.querySelector(".speedtrainer")?.classList.toggle("loop-active");
    document.querySelectorAll(".audio_controls").forEach(function (el) {
        el?.classList.toggle("hide-active");
    });
    document.querySelectorAll(".audio_controls [class^='warp']").forEach(function (el) {
        el?.classList.remove("warp-active");
    });
    synthControl?.seek(0);
    start();
}

function hide() {
    document.querySelector("#render_paper")?.classList.toggle("hide-active")
}

function countdown(seconds) {
    return new Promise(resolve => {
        let overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.7)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.fontSize = "5em";
        overlay.style.color = "white";
        overlay.style.zIndex = "9999";
        document.body.appendChild(overlay);

        let count = seconds;
        overlay.textContent = count;
        const interval = setInterval(() => {
            count--;
            if (count <= 0) {
                clearInterval(interval);
                document.body.removeChild(overlay);
                resolve();
            } else {
                overlay.textContent = count;
            }
        }, 1000);
    });
}

//Map elements to functions
const actions = {
    ".previous": previous,
    ".next": next,
    ".goToId": goto,
    ".start": start,
    ".restart": restart,
    ".loop": toggleLoop,
    //to pass function params, use anon function
    ".warp25": () => warp(25),
    ".warp50": () => warp(50),
    ".warp75": () => warp(75),
    ".warp100": () => warp(100),
    ".speedtrainer": toggleSpeedTrainer,
    ".memorytrainer": toggleMemoryTrainer,
    ".hide": hide
};

// Attach button listeners
Object.entries(actions).forEach(([selector, handler]) =>
    document.querySelector(selector)?.addEventListener("click", handler)
);

// Populate tune dropdown
const tuneSelect = document.getElementById("tuneSelect");
render_abc.forEach((tune, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i + 1} - ${(tune.match(/\nT:\s*(.+)/) || [, "Untitled"])[1].trim()}`;
    tuneSelect.appendChild(option);
});

tuneSelect.addEventListener("change", () => {
    currentTune = parseInt(tuneSelect.value, 10);
    setTune(true);
});

//Load Tune
setTune(false);