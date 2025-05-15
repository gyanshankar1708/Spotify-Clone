let audio = new Audio();
let currFolder;
let songs;
function convertToMinutesSeconds(totalSeconds) {
  totalSeconds = Math.max(0, parseInt(totalSeconds, 10) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
  return `${minutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`/${folder}`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  let val = await fetch(`/${folder}/info.json`);
  let valjson = await val.json();
  let playlistDetail = document.getElementById("playlist-detail");
  playlistDetail.innerHTML = valjson.title;
  songs = [];
  for (let i = 0; i < as.length; i++) {
    const element = as[i];
    if (element.href.endsWith(".mp3") || element.href.endsWith(".m4a")) {
      songs.push(element.href.split(`${folder}/`)[1]);
    }
  }
  let songUL = document
    .querySelector(".songlists")
    .getElementsByTagName("ol")[0];
  songUL.innerHTML = "";
  for (const song of songs) {
    let songhtml = `<li data-song="${song}">
                      <div class="info flex p-1 items-center justify-between">
                        <img class="invert songimg" src="/images/music.svg" alt="Music">
                        <div class="songinfo flex justify-content">
                          <h5>${decodeURIComponent(song).split(".")[0]}</h5>
                          <p>${decodeURIComponent(song).split(".")[1]}</p>
                        </div>
                        <img src="/images/play.png" alt="" class="invert icons">
                      </div>
                    </li>`;
    songUL.innerHTML += songhtml;
  }
  Array.from(
    document.querySelector(".songlists").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (element) => {
      playMusic(e.dataset.song);
    });
  });
}
let play = document.getElementById("play");
let playimg = document
  .querySelector(".songbuttons")
  .getElementsByTagName("img")[1];
let sname = document.querySelector(".songinfo");
let dur = document.querySelector(".songtime");

async function displayFolder() {
  let a = await fetch(`//songs`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let cardContainer = document.querySelector(".card-container");
  let anchors = div.getElementsByTagName("a");
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const item = array[index];
    if (item.href.includes("/songs/")) {
      let folderval = item.href.split("/").slice(-1)[0];
      let a = await fetch(`/songs/${folderval}/info.json`);
      let response = await a.json();
      cardContainer.innerHTML += `<div data-folder="${folderval}" class="card p-2 bg-normal">
                        <div class="play flex justify-center items-center p-2">
                            <img src="/images/play.png" alt="Play" class="play-logo logo">
                        </div>
                        <img src="/songs/${folderval}/cover.png" alt="" class="playlist-img">
                        <h3>${response.title}</h3>
                        <p>${response.description}</p>
                    </div>`;
    }
  }
  Array.from(document.getElementsByClassName("card")).forEach((items) => {
    items.addEventListener("click", async (item) => {
      await getSongs(`songs/${item.currentTarget.dataset.folder}`);
      playMusic(songs[0]);
    });
  });
}

const playMusic = (track, pause = false) => {
  audio.src = `/${currFolder}/` + track;
  audio.volume = document.getElementsByTagName("input")[0].value / 100;
  if (!pause) {
    audio.play();

    playimg.src = "/images/pause.svg";
  }
  sname.innerHTML = decodeURI(
    track.replaceAll("%20", " ").replaceAll("%2C", ",").split(".")[0]
  );
  dur.innerHTML = "0:00 / 0:00";
};
async function main() {
  // await getSongs("songs/Bhojpuri");
  // playMusic(songs[0], true);
  sname.innerHTML = "Select Playlist";
  displayFolder();
  play.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playimg.src = "/images/pause.svg";
    } else {
      audio.pause();
      playimg.src = "/images/play.png";
    }
  });
  audio.addEventListener("timeupdate", () => {
    let totaldur = audio.duration;
    let currenttime = audio.currentTime;
    dur.innerHTML = `${convertToMinutesSeconds(
      currenttime
    )} / ${convertToMinutesSeconds(totaldur)}`;
    document.querySelector(".circle").style.left =
      (currenttime / totaldur) * 100 + "%";
  });
  let cir = document.querySelector(".circle");
  let seek = document.querySelector(".seekbar");
  seek.addEventListener("click", (e) => {
    let per = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    cir.style.left = per + "%";
    audio.currentTime = (per * audio.duration) / 100;
  });
  let hamburger = document.querySelector(".hamburger");
  let leftbar = document.querySelector(".left");
  hamburger.addEventListener("click", () => {
    leftbar.style.left = "0";
  });
  let cross = document.querySelector(".cancel");
  cross.addEventListener("click", () => {
    leftbar.style.left = "-100%";
  });

  let prev = document.getElementById("prev");
  prev.addEventListener("click", () => {
    console.log("Previous clicked");
    let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
    if (index > 0) {
      playMusic(songs[index - 1]);
    } else {
      playMusic(songs[0]);
    }
  });
  let next = document.getElementById("next");
  next.addEventListener("click", () => {
    console.log("Next clicked");
    let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
    if (index < songs.length - 1) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[0]);
    }
  });
  let vol = document.querySelector(".vol-range");
  vol.addEventListener("change", (e) => {
    console.log("Volume adjusted to ", e.target.value, "%");
    audio.volume = e.target.value / 100;
  });
  audio.addEventListener("ended", () => {
    let index = songs.indexOf(audio.src.split("/").slice(-1)[0]);
    if (index < songs.length - 1) {
      playMusic(songs[index + 1]);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.code === "Space" || event.keyCode === 32) {
      event.preventDefault();
      play.click();
    }
    if (event.code === "ArrowLeft") {
      if (event.shiftKey) {
        prev.click();
      } else if (audio.currentTime - 15 >= 0) {
        audio.currentTime = Math.max(0, audio.currentTime - 15);
      } else {
        prev.click();
      }
    }
    if (event.code === "ArrowRight") {
      if (event.shiftKey) {
        next.click();
      } else if (audio.currentTime + 15 <= audio.duration) {
        audio.currentTime = Math.min(audio.currentTime + 15, audio.duration);
      } else {
        next.click();
      }
    }
    if (event.code === "ArrowUp") {
      event.preventDefault();
      audio.volume = Math.min(audio.volume + 0.1, 1);
      vol.value = Math.min(parseInt(vol.value) + 10, 100);
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      audio.volume = Math.max(audio.volume - 0.1, 0);
      vol.value = Math.max(parseInt(vol.value - 10), 0);
    }
  });

  let mutebtn = document
    .querySelector(".volume")
    .getElementsByTagName("img")[0];
  mutebtn.addEventListener("click", () => {
    if (audio.volume == 0) {
      mutebtn.src = "/images/volume.svg";
      audio.volume = 1 / 2;
      vol.value = 50;
    } else {
      audio.volume = 0;
      mutebtn.src = "/images/mute.svg";
      vol.value = 0;
    }
  });
}
main();
